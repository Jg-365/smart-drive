import { authHeaders } from '@/features/shared/auth'
import { API_BASE_URL, DEV_USER_ID } from './config'

/** Erro lançado quando a resposta HTTP não é 2xx. Carrega status e corpo parseado. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown,
  ) {
    super(`API ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Corpo serializado como JSON automaticamente. */
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const res = await fetch(API_BASE_URL + path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      // Auth: JWT real (auth store) ou fallback x-user-id de DEV. Pode ser
      // sobrescrito por `headers` explícito na chamada.
      ...authHeaders(DEV_USER_ID),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let parsed: unknown = null
    try {
      parsed = await res.json()
    } catch {
      // corpo vazio ou não-JSON — mantém null
    }
    throw new ApiError(res.status, res.statusText, parsed)
  }

  // 204 No Content (ex: DELETE) não tem corpo para parsear
  if (res.status === 204) return undefined as T

  return (await res.json()) as T
}

/** Cliente HTTP tipado. Cada método resolve com o JSON já parseado em `T`. */
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
