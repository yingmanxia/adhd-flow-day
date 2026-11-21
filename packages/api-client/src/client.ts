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
 * 进行中的 GET 请求表，key 为完整 URL。
 * 首页有多个组件同时订阅 ['daily']（顶栏角标、今日待办、计划池），
 * StrictMode 双挂载 + 写操作后的 invalidateQueries 也可能在同一瞬间触发。
 * React Query 虽按 queryKey 去重，但跨组件/跨挂载的触发仍可能穿透到 HTTP 层；
 * 这里兜底：同 URL 的并发 GET 共享同一个 Promise，只发一个真实请求。
 */
const inFlight = new Map<string, Promise<unknown>>()

/**
 * 幂等 GET 去重入口。写操作（POST/PATCH/DELETE）不去重，保证每次都真正执行。
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${baseUrl}${path}`
  const method = (options.method ?? 'GET').toUpperCase()

  if (method === 'GET') {
    const pending = inFlight.get(url)
    if (pending) return pending as Promise<T>
  }

  const promise = performRequest<T>(url, options)
  if (method === 'GET') {
    inFlight.set(url, promise)
    const cleanup = () => {
      if (inFlight.get(url) === promise) inFlight.delete(url)
    }
    // 两个回调都传，避免 reject 时产生未处理的 Promise
    promise.then(cleanup, cleanup)
  }
  return promise
}

/**
 * 实际发起请求：拿到 HTTP 状态码（含 4xx/5xx）就是服务端的明确答复，立即抛错、不重试——
 * 500 重试不会让缺表/缺权限的错误自己好，只会放大请求量。
 * 只有 fetch 自身失败（断网/DNS/超时）才重试，默认最多 1 次。
 * React Query 层应设 retry: false，不要再叠加一层重试。
 */
async function performRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, retries = 1, ...init } = options
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
