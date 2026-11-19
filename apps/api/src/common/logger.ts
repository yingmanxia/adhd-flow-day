import type { LoggerOptions } from 'pino'
import type { AppConfig } from './config.js'

export function loggerOptions(config: AppConfig): LoggerOptions {
  return {
    level: config.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
      censor: '[redacted]',
    },
    ...(config.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        }
      : {}),
  }
}
