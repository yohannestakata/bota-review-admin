import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type { PlaceType } from "@/features/places/types"
import { useApi } from "@/lib/api"
import { toPage } from "@/lib/paginated"

export type NeedsCuisineRow = {
  placeId: string
  name: string
  type: PlaceType
  /** The area of its most-reviewed branch. */
  area: string | null
  /** Its live branches; a save tags each of them. */
  branchIds: string[]
  reviewCount: number
  photoUrl: string | null
}

export const needsCuisineKey = ["needs-cuisine"] as const

const PAGE_SIZE = 25

/** Live places with no cuisine yet, most-reviewed first. */
export function useNeedsCuisine(q: string, page: number) {
  const api = useApi()
  return useQuery({
    queryKey: [...needsCuisineKey, { q, page }],
    queryFn: async () =>
      toPage(
        await api<NeedsCuisineRow[]>("/admin/places/needs-cuisine", {
          query: { q, page, limit: PAGE_SIZE },
        }),
        page,
        PAGE_SIZE
      ),
    placeholderData: keepPreviousData,
  })
}
