import { useAuth } from "@clerk/react"
import { useCallback } from "react"

const BASE_URL = import.meta.env.VITE_API_URL as string

/** An error response from the API: `{ statusCode, code, message, fields? }`. */
export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, { code: string; message: string }>

  constructor(
    status: number,
    body: { code?: string; message?: string; fields?: ApiError["fields"] }
  ) {
    super(body.message ?? `Request failed (${status})`)
    this.status = status
    this.code = body.code ?? "UNKNOWN"
    this.fields = body.fields
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export type ApiResult<T> = { data: T; headers: Headers }

/**
 * Calls the Bota API as the signed-in admin (Clerk session token). Returns
 * the parsed body and the response headers (paginated lists put totals in
 * `X-Total-Count`).
 */
export function useApi() {
  const { getToken } = useAuth()

  return useCallback(
    async <T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> => {
      const url = new URL(`${BASE_URL}${path}`)
      for (const [key, value] of Object.entries(options.query ?? {})) {
        if (value !== undefined && value !== "") url.searchParams.set(key, String(value))
      }
      const token = await getToken()
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      })
      const text = await response.text()
      const parsed = text ? JSON.parse(text) : null
      if (!response.ok) throw new ApiError(response.status, parsed ?? {})
      return { data: parsed as T, headers: response.headers }
    },
    [getToken]
  )
}

export type Api = ReturnType<typeof useApi>
