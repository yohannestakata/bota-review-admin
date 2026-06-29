"use client"

import { useQuery } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import { getOverview } from "./api"

export const overviewKeys = {
  all: ["overview"] as const,
}

export function useOverview() {
  const api = useApi()
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: () => getOverview(api),
    refetchInterval: 60_000,
  })
}
