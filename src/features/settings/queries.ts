import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/api"

import type { TaxonomyKind } from "@/features/places/queries"

/** A tag group's key; the groups are editable in Settings. */
export type TagCategory = string

export function useTaxonomyAction(kind: TaxonomyKind) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input:
        | { action: "create"; name: string; category?: TagCategory }
        | {
            action: "update"
            id: string
            name?: string
            status?: "active" | "archived"
            category?: TagCategory
          }
    ) => {
      if (input.action === "create") {
        return api(`/admin/${kind}`, {
          method: "POST",
          body: { name: input.name, category: input.category },
        })
      }
      return api(`/admin/${kind}/${input.id}`, {
        method: "PATCH",
        body: {
          name: input.name,
          status: input.status,
          category: input.category,
        },
      })
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["taxonomy", kind] }),
  })
}

export type FailedJob = {
  id: string
  type: string
  status: string
  attempts: number
  maxAttempts: number
  canRetry: boolean
  lastError: string | null
  updatedAt: string
  payloadSummary: Record<string, string | number | boolean | null | undefined>
}

export function useFailedJobs() {
  const api = useApi()
  return useQuery({
    queryKey: ["jobs", "failed"],
    queryFn: async () => (await api<FailedJob[]>("/admin/jobs/failed")).data,
  })
}

export function useRetryJob() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await api(`/admin/jobs/${id}/retry`, { method: "POST" })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  })
}

export function useRunPendingJobs() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      (
        await api<{ processed: number }>("/admin/jobs/run-pending", {
          method: "POST",
          body: {},
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  })
}
