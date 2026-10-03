import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/api"
import { toPage } from "@/lib/paginated"

import type { Branch, ContentStatus, Taxon } from "@/features/places/types"

export type Collection = {
  id: string
  slug: string
  name: string
  description: string | null
  coverImageUrl: string | null
  displayOrder: number
  status: ContentStatus
  branchCount: number
  publishedBranchCount: number
  updatedAt: string
}

export type CollectionBranch = {
  id: string
  placeId: string
  label: string | null
  status: ContentStatus
  placeName: string
  coverPhotoUrl: string | null
  neighborhood: Taxon | null
}

export type CollectionDetail = Collection & { branches: CollectionBranch[] }

/** Live branches needed before a collection can be published. */
export const MIN_PUBLISHED = 6

const key = ["collections"] as const
const PAGE_SIZE = 24

export function useCollections(page: number) {
  const api = useApi()
  return useQuery({
    queryKey: [...key, { page }],
    queryFn: async () =>
      toPage(
        await api<Collection[]>("/admin/collections", {
          query: { page, limit: PAGE_SIZE },
        }),
        page,
        PAGE_SIZE
      ),
    placeholderData: keepPreviousData,
  })
}

export function useCollection(id: string) {
  const api = useApi()
  return useQuery({
    queryKey: [...key, "detail", id],
    queryFn: async () =>
      (await api<CollectionDetail>(`/admin/collections/${id}`)).data,
  })
}

/** Live branches to pick from when adding to a collection. */
export function useBranchSearch(q: string) {
  const api = useApi()
  return useQuery({
    queryKey: ["branch-search", q],
    queryFn: async () =>
      (
        await api<Branch[]>("/admin/branches", {
          query: { q, status: "published", limit: 20 },
        })
      ).data,
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  })
}

export type CollectionInput = {
  name?: string
  description?: string | null
  coverImageUrl?: string | null
  status?: ContentStatus
}

export function useCreateCollection() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string }) =>
      (await api<Collection>("/admin/collections", { method: "POST", body }))
        .data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useCollectionAction(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input:
        | { action: "update"; body: CollectionInput }
        | { action: "publish" }
        | { action: "archive" }
        | { action: "add"; branchId: string; displayOrder: number }
        | { action: "remove"; branchId: string }
        | { action: "order"; branchIds: string[] }
    ) => {
      const base = `/admin/collections/${id}`
      switch (input.action) {
        case "update":
          return api(base, { method: "PATCH", body: input.body })
        case "publish":
          return api(`${base}/publish`, { method: "PATCH" })
        case "archive":
          return api(base, { method: "DELETE" })
        case "add":
          return api(`${base}/branches`, {
            method: "POST",
            body: {
              branchId: input.branchId,
              displayOrder: input.displayOrder,
            },
          })
        case "remove":
          return api(`${base}/branches/${input.branchId}`, { method: "DELETE" })
        case "order":
          return api(`${base}/order`, {
            method: "PATCH",
            body: { branchIds: input.branchIds },
          })
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
