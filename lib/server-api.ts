import { auth } from "@clerk/nextjs/server"
import axios, { type AxiosInstance } from "axios"

import { API_BASE_URL } from "./api-client"

// Authenticated axios instance for server components / route handlers. Used by
// the admin role gate; client code uses useApi() instead.
export async function serverApi(): Promise<AxiosInstance> {
  const { getToken } = await auth()
  const token = await getToken()
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
