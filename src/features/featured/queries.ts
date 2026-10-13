import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/api"

export type Placement = {
  id: string
  branchId: string
  placeId: string
  placeName: string
  branchLabel: string
  slot: "home" | "search"
  cuisineId: string | null
  cuisineName: string | null
  startsAt: string
  endsAt: string
  note: string | null
  status: "upcoming" | "active" | "ended"
  /** While it ran: times shown in its slot, and opened from there. */
  shown: number
  opened: number
}

export type NewPlacement = {
  branchId: string
  slot: "home" | "search"
  cuisineId?: string
  startsAt: string
  endsAt: string
  note?: string
}

const featuredKey = ["featured"] as const

export function usePlacements() {
  const api = useApi()
  return useQuery({
    queryKey: featuredKey,
    queryFn: async () => (await api<Placement[]>("/admin/featured")).data,
  })
}

export function useCreatePlacement() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewPlacement) =>
      (await api("/admin/featured", { method: "POST", body: input })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featuredKey }),
  })
}

export function usePlacementAction() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string
      action: "end" | "remove"
    }) =>
      action === "end"
        ? api(`/admin/featured/${id}/end`, { method: "PATCH" })
        : api(`/admin/featured/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featuredKey }),
  })
}
