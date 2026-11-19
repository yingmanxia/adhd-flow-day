import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import cors from '@fastify/cors'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { loadConfig } from './common/config.js'
import type { AppConfig } from './common/config.js'
import { errorHandler } from './common/errors.js'
import { loggerOptions } from './common/logger.js'
import { createRequestId, registerRequestContext } from './common/request-id.js'
import { disconnectDatabase } from './db/client.js'
import { checkDatabase } from './db/health.js'

export async function buildServer(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerOptions(config),
    genReqId: createRequestId,
    bodyLimit: 1024 * 1024,
  })

  registerRequestContext(app)
  app.setErrorHandler(errorHandler)

  const allowedOrigins = config.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  await app.register(cors, { origin: allowedOrigins ?? false })

  app.get('/health', () => ({
    status: 'ok',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  }))

  // /ready 必须反映真实依赖状态：DB 不可用时返回 503，供编排与 S11 的 CI 冒烟判断。
  app.get('/ready', async (_request, reply) => {
    const database = await checkDatabase()
    const ok = database === 'ok'
    return reply.code(ok ? 200 : 503).send({
      status: ok ? 'ok' : 'degraded',
      checks: { config: 'ok', database },
      timestamp: new Date().toISOString(),
    })
  })

  return app
}

export async function start(): Promise<FastifyInstance> {
  const config = loadConfig()
  const app = await buildServer(config)
  const logger = app.log

  let draining = false
  const shutdown = (signal: string): void => {
    if (draining) return
    draining = true
    logger.info({ signal }, 'draining: stop accepting new connections')
    app
      .close()
      .then(() => disconnectDatabase())
      .then(() => {
        logger.info('drained: server closed')
        process.exit(0)
      })
      .catch((error: unknown) => {
        logger.error({ err: error }, 'drain failed')
        process.exit(1)
      })
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'))
  process.once('SIGINT', () => shutdown('SIGINT'))

  await app.listen({ host: config.HOST, port: config.PORT })
  logger.info({ host: config.HOST, port: config.PORT }, 'api listening')
  return app
}

function isEntryPoint(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isEntryPoint()) {
  start().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
