"use client"

import { useAuth } from "@clerk/nextjs"
import { useMemo } from "react"

import { createApiClient } from "./api-client"

// Authenticated axios instance for client components. Feed it into the
// feature query/mutation functions.
export function useApi() {
  const { getToken } = useAuth()
  return useMemo(() => createApiClient(() => getToken()), [getToken])
}
