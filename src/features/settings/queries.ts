import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/api"

import type { TaxonomyKind } from "@/features/places/queries"
import type { PlaceType, TaxonRow } from "@/features/places/types"

/** A tag group's key; the groups are editable in Settings. */
export type TagCategory = string

/**
 * Saves a new order for a lookup list (tag groups, photo categories). The
 * list shows the new order at once and snaps back if the save fails.
 */
export function useReorderLookup(kind: TaxonomyKind) {
  const api = useApi()
  const queryClient = useQueryClient()
  const key = ["taxonomy", kind]
  return useMutation({
    mutationFn: async (rows: TaxonRow[]) =>
      api(`/admin/${kind}/order`, {
        method: "PATCH",
        body: { keys: rows.map((r) => r.id) },
      }),
    onMutate: async (rows) => {
      await queryClient.cancelQueries({ queryKey: key })
      const before = queryClient.getQueryData<TaxonRow[]>(key)
      queryClient.setQueryData(key, rows)
      return { before }
    },
    onError: (_error, _rows, context) => {
      if (context?.before) queryClient.setQueryData(key, context.before)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

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

export type MealTime = {
  key: string
  name: string
  /** The home rail's title, e.g. "Dinner tonight". */
  title: string
  /** Addis Ababa hours, 0 to 23. */
  from: number
  until: number
  tagIds: string[]
  foodCategoryIds: string[]
  placeTypes: PlaceType[]
}

export type MealLinks = Pick<
  MealTime,
  "tagIds" | "foodCategoryIds" | "placeTypes"
>

export function useMealTimes() {
  const api = useApi()
  return useQuery({
    queryKey: ["meal-times"],
    queryFn: async () => (await api<MealTime[]>("/admin/meal-times")).data,
  })
}

/** Saves a slot's links; the card shows them at once and snaps back on failure. */
export function useSetMealTime() {
  const api = useApi()
  const queryClient = useQueryClient()
  const key = ["meal-times"]
  return useMutation({
    mutationFn: async ({ slot, links }: { slot: string; links: MealLinks }) =>
      api<MealTime>(`/admin/meal-times/${slot}`, {
        method: "PUT",
        body: links,
      }),
    onMutate: async ({ slot, links }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const before = queryClient.getQueryData<MealTime[]>(key)
      queryClient.setQueryData<MealTime[]>(key, (rows) =>
        rows?.map((row) => (row.key === slot ? { ...row, ...links } : row))
      )
      return { before }
    },
    onError: (_error, _input, context) => {
      if (context?.before) queryClient.setQueryData(key, context.before)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
