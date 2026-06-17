import axios, { type AxiosInstance } from "axios"

// Backend base URL, including the `/v1` global prefix.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1"

// Builds an axios instance that attaches the caller's Clerk token to every
// request. `getToken` is injected so the same factory works on the client
// (useAuth().getToken) and the server (auth().getToken).
export function createApiClient(
  getToken: () => Promise<string | null>
): AxiosInstance {
  const instance = axios.create({ baseURL: API_BASE_URL })

  instance.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  return instance
}

// Normalizes axios/server errors into a readable message for toasts/UI.
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined
    const message = data?.message
    if (Array.isArray(message)) return message.join(", ")
    if (typeof message === "string") return message
    return error.message
  }
  return error instanceof Error ? error.message : "Something went wrong"
}
