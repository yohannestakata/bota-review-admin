import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/api"
import { toPage } from "@/lib/paginated"

import type { ContentStatus } from "@/features/places/types"

export type QualityIssue = {
  key: string
  title: string
  description: string
  count: number
}

export type QualityRow = {
  branchId: string
  placeId: string
  placeName: string
  label: string
  status: ContentStatus
  neighborhood: string | null
  latitude: string | null
  longitude: string | null
  note: string
  /** The chain a duplicate place can be merged into. */
  relatedPlaceId: string | null
  updatedAt: string
}

const PAGE_SIZE = 25

export function useQualityIssues() {
  const api = useApi()
  return useQuery({
    queryKey: ["quality"],
    queryFn: async () => (await api<QualityIssue[]>("/admin/quality")).data,
  })
}

export function useQualityRows(
  issue: string | undefined,
  q: string,
  page: number
) {
  const api = useApi()
  return useQuery({
    queryKey: ["quality", issue, { q, page }],
    queryFn: async () =>
      toPage(
        await api<QualityRow[]>(`/admin/quality/${issue}`, {
          query: { q, page, limit: PAGE_SIZE },
        }),
        page,
        PAGE_SIZE
      ),
    enabled: Boolean(issue),
    placeholderData: keepPreviousData,
  })
}

/** "Not a problem": keeps a branch off a check, or puts it back. */
export function useDismissal(issue: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      branchId,
      undo,
    }: {
      branchId: string
      undo?: boolean
    }) =>
      undo
        ? api(`/admin/quality/${issue}/dismissals/${branchId}`, {
            method: "DELETE",
          })
        : api(`/admin/quality/${issue}/dismissals`, {
            method: "POST",
            body: { branchId },
          }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quality"] }),
  })
}
