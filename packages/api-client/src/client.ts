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
  retries?: number
}

/** 4xx 不重试；5xx 与网络错误最多重试 3 次（指数退避）。 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, retries = 3, ...init } = options
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
      const error = await parseError(response)
      if (response.status < 500 || attempt >= retries) throw error
    } catch (error) {
      if (error instanceof ApiClientError && error.status < 500) throw error
      if (attempt >= retries) {
        throw error instanceof ApiClientError
          ? error
          : new ApiClientError('网络好像断开了', 'NETWORK_ERROR', 0)
      }
    }
    await sleep(300 * 2 ** attempt)
  }
}
