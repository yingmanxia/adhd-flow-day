export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  DOMAIN_ERROR: 'DOMAIN_ERROR',
} as const
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export interface ApiErrorBody {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  requestId: string
}
