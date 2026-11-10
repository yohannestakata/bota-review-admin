import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { PlaceType } from "@/features/places/types"
import { useApi } from "@/lib/api"
import { toPage, type Page } from "@/lib/paginated"

export type SuggestionKind = "tag" | "amenity" | "foodCategory" | "cuisine"

export type Evidence = {
  source: "menu" | "description" | "review"
  text: string
  branchId?: string
}

export type Suggestion = {
  id: string
  kind: SuggestionKind
  conceptId: string
  name: string
  score: number
  evidence: Evidence[]
}

export type SuggestedPlace = {
  placeId: string
  name: string
  type: PlaceType
  area: string | null
  branchCount: number
  photoUrl: string | null
  suggestions: Suggestion[]
}

export const suggestedTagsKey = ["suggested-tags"] as const

const PAGE_SIZE = 20

/** Places with pending suggestions, the most confident first. */
export function useSuggestedTags(
  q: string,
  kind: SuggestionKind | "",
  page: number
) {
  const api = useApi()
  return useQuery({
    queryKey: [...suggestedTagsKey, { q, kind, page }],
    queryFn: async () =>
      toPage(
        await api<SuggestedPlace[]>("/admin/tag-suggestions", {
          query: { q, kind, page, limit: PAGE_SIZE },
        }),
        page,
        PAGE_SIZE
      ),
    placeholderData: keepPreviousData,
  })
}

/** Approve (adds the label to the place) or reject a suggestion. */
export function useDecideSuggestion() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string
      decision: "approve" | "reject"
      placeId: string
    }) =>
      api(`/admin/tag-suggestions/${id}/decision`, {
        method: "POST",
        body: { decision },
      }),
    onSuccess: (_result, { id, placeId }) => {
      // Off the list at once; a place goes when its last one does.
      queryClient.setQueriesData<Page<SuggestedPlace>>(
        { queryKey: suggestedTagsKey },
        (page) => {
          if (!page) return page
          const rows = page.rows
            .map((row) =>
              row.placeId === placeId
                ? {
                    ...row,
                    suggestions: row.suggestions.filter((s) => s.id !== id),
                  }
                : row
            )
            .filter((row) => row.suggestions.length > 0)
          return {
            ...page,
            rows,
            total: page.total - (page.rows.length - rows.length),
          }
        }
      )
      void queryClient.invalidateQueries({ queryKey: ["places"] })
      void queryClient.invalidateQueries({ queryKey: ["needs-cuisine"] })
    },
  })
}
