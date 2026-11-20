/** 服务端实际返回 { error: { code, message, requestId } }；S11 前保持兼容解析。 */
export class ApiClientError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId?: string

  constructor(message: string, code: string, status: number, requestId?: string) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.requestId = requestId
  }
}

const FRIENDLY: Record<string, string> = {
  NOT_FOUND: '这件事找不到了',
  BAD_REQUEST: '刚才的操作没成功，请再试一次',
  INVALID_TRANSITION: '这件事现在不能这样移动',
  INTERNAL_ERROR: '服务暂时开小差了',
  VALIDATION_ERROR: '填写的内容需要再检查一下',
}

export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return FRIENDLY[error.code] ?? error.message
  }
  if (error instanceof TypeError) return '网络好像断开了，稍后再试'
  return '出了点小问题，稍后再试'
}
