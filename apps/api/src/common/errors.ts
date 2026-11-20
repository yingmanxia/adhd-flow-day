import { DomainError } from '@flowday/core'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

export type ErrorCode = 'BAD_REQUEST' | 'NOT_FOUND' | 'INTERNAL_ERROR'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly statusCode: number
  readonly details?: unknown

  constructor(code: ErrorCode, statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError('BAD_REQUEST', 400, message, details)
}

export function notFound(message = '资源不存在'): AppError {
  return new AppError('NOT_FOUND', 404, message)
}

export async function errorHandler(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (error instanceof AppError) {
    await reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        requestId: request.id,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    })
    return
  }

  if (error instanceof DomainError) {
    await reply.status(400).send({
      error: {
        code: 'INVALID_TRANSITION',
        message: error.message,
        requestId: request.id,
      },
    })
    return
  }

  if (error instanceof ZodError) {
    await reply.status(400).send({
      error: {
        code: 'BAD_REQUEST',
        message: '请求参数不合法',
        requestId: request.id,
        details: error.issues,
      },
    })
    return
  }

  request.log.error({ err: error, requestId: request.id }, 'unhandled error')
  await reply.status(500).send({
    error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用', requestId: request.id },
  })
}
