import type { FastifyRequest } from 'fastify'

/** 读 Idempotency-Key；S3 的 undo-delete 用窗口边界，S5 的 focus 四端点用它防重复提交。 */
export function idempotencyKey(request: FastifyRequest): string | undefined {
  const header = request.headers['idempotency-key']
  if (typeof header === 'string' && header.trim()) return header.trim()
  return undefined
}
