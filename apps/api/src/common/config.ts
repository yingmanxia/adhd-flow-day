import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

const envSchema = z.object({
  APP_NAME: z.string().min(1).default('ADHD Flow Day'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().optional(),
})

export type AppConfig = z.infer<typeof envSchema> & { startedAt: Date }

const envFilePath = fileURLToPath(new URL('../../../../.env', import.meta.url))

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  loadDotenv({ path: envFilePath })

  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`配置校验失败，请检查环境变量：\n${issues}`)
  }

  return { ...parsed.data, startedAt: new Date() }
}
