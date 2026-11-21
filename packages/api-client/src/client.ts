import { ApiClientError } from './errors.js'

const DEFAULT_BASE = '/api'
let baseUrl = DEFAULT_BASE

/** Base URL 走环境变量（main.tsx 里注入）；默认同源 /api，由 Vite proxy 转发。 */
export function configureApiClient(options: { baseUrl?: string }): void {
  baseUrl = options.baseUrl?.replace(/\/$/, '') ?? DEFAULT_BASE
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; requestId?: string }
      code?: string
      message?: string
      requestId?: string
    }
    const detail = body.error ?? body
    return new ApiClientError(
      detail.message ?? '请求失败',
      detail.code ?? 'UNKNOWN',
      response.status,
      detail.requestId,
    )
  } catch {
    return new ApiClientError(`请求失败（${response.status}）`, 'UNKNOWN', response.status)
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** 仅网络层错误（未收到 HTTP 响应）的重试次数；HTTP 非 2xx 一律不重试。默认 1。 */
  retries?: number
}

/**
 * 只要拿到了 HTTP 状态码（非 2xx）就是服务端的明确答复，立即抛错、不重试——
 * 500 重试不会让缺表/缺权限的错误自己好，只会放大请求量。
 * 只有 fetch 自身失败（断网/DNS/超时）才重试，默认最多 1 次。
 * 注意：React Query 层应设 retry: false，不要再叠加一层重试。
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, retries = 1, ...init } = options
  const url = `${baseUrl}${path}`
  const headers = {
    ...init.headers,
    ...(body === undefined ? {} : { 'content-type': 'application/json' }),
  }

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      if (response.ok) {
        return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
      }
      // 非 2xx（含 4xx/5xx）：直接抛错，不重试。
      throw await parseError(response)
    } catch (error) {
      if (error instanceof ApiClientError) throw error
      if (attempt >= retries) {
        throw new ApiClientError('网络好像断开了', 'NETWORK_ERROR', 0)
      }
    }
    await sleep(300 * 2 ** attempt)
  }
}
