import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/api"

export type Unit = "count" | "percent" | "per_week"
export type Point = { day: string; value: number | null }

export type Goal = {
  key: string
  label: string
  description: string
  unit: Unit
  target: number
  value: number | null
  status: "met" | "behind" | "no_data"
  progress: number
  trend: Point[]
  note: string | null
}

export type Growth = {
  goals: Goal[]
  metCount: number
  cohorts: {
    week: string
    size: number
    d1: number | null
    d7: number | null
    d30: number | null
  }[]
  byNeighborhood: {
    name: string
    places: number
    withThree: number
    reviews: number
  }[]
  noResults: { query: string; times: number; lastAt: string }[]
  generatedAt: string
}

const growthKey = ["growth"] as const

export function useGrowth() {
  const api = useApi()
  return useQuery({
    queryKey: growthKey,
    queryFn: async () => (await api<Growth>("/admin/metrics")).data,
  })
}

export function useSetTarget() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, target }: { key: string; target: number }) =>
      (
        await api<Growth>(`/admin/metrics/targets/${key}`, {
          method: "PUT",
          body: { target },
        })
      ).data,
    onSuccess: (data) => queryClient.setQueryData(growthKey, data),
  })
}

export function formatValue(value: number | null, unit: Unit) {
  if (value === null) return "—"
  if (unit === "percent") return `${value}%`
  if (unit === "per_week") return `${value} a week`
  return value.toLocaleString()
}
