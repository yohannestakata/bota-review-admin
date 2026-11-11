import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { PlaceType } from "@/features/places/types"
import { useApi } from "@/lib/api"
import { toPage, type Page } from "@/lib/paginated"

export type ImportStatus = "pending" | "approved" | "rejected"

export type QueuedDish = {
  name: string
  description: string | null
  price: number
  sizes?: { label: string; price: number }[] | null
  imageUrl: string | null
  imageKey: string | null
}

export type MenuImport = {
  id: string
  kind: "new" | "additions"
  source: string
  sourceUrl: string
  scrapedAt: string
  status: ImportStatus
  dishCount: number
  photoCount: number
  createdAt: string
  sections: { name: string; dishes: QueuedDish[] }[]
  branchId: string
  branchSlug: string
  branchLabel: string
  placeId: string
  placeName: string
  placeType: PlaceType
  current: { sources: string[]; dishes: number }
}

export const menuImportsKey = ["menu-imports"] as const

const PAGE_SIZE = 20

/** Menus read from other sites, by status, the oldest first. */
export function useMenuImports(status: ImportStatus, q: string, page: number) {
  const api = useApi()
  return useQuery({
    queryKey: [...menuImportsKey, { status, q, page }],
    queryFn: async () =>
      toPage(
        await api<MenuImport[]>("/admin/menu-imports", {
          query: { status, q, page, limit: PAGE_SIZE },
        }),
        page,
        PAGE_SIZE
      ),
    placeholderData: keepPreviousData,
  })
}

/** Approve (adds the dishes to the place) or reject a waiting import. */
export function useDecideMenuImport() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string
      decision: "approve" | "reject"
    }) =>
      api<{ status: ImportStatus; added: number; photos: number }>(
        `/admin/menu-imports/${id}/decision`,
        { method: "POST", body: { decision } }
      ),
    onSuccess: (_result, { id }) => {
      // Off the waiting list at once.
      queryClient.setQueriesData<Page<MenuImport>>(
        { queryKey: menuImportsKey },
        (page) =>
          page
            ? {
                ...page,
                rows: page.rows.filter((row) => row.id !== id),
                total: page.total - 1,
              }
            : page
      )
      void queryClient.invalidateQueries({ queryKey: menuImportsKey })
    },
  })
}
