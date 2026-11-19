import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'

export function createRequestId(): string {
  return randomUUID()
}

export function registerRequestContext(app: FastifyInstance): void {
  app.addHook('onRequest', (request, _reply, done) => {
    request.log.info(
      { requestId: request.id, method: request.method, url: request.url },
      'request received',
    )
    done()
  })

  app.addHook('onSend', (request, reply, payload, done) => {
    reply.header('x-request-id', request.id)
    done(null, payload)
  })

  app.addHook('onResponse', (request, reply, done) => {
    request.log.info(
      {
        requestId: request.id,
        statusCode: reply.statusCode,
        responseTimeMs: reply.elapsedTime,
      },
      'request completed',
    )
    done()
  })
}
