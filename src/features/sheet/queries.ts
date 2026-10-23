import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi, type Api } from "@/lib/api"
import { toPage, type Page } from "@/lib/paginated"

import { placesKey } from "@/features/places/queries"
import type {
  Branch,
  BranchPatch,
  ContentStatus,
  PlaceListItem,
  PlaceType,
} from "@/features/places/types"

export const SHEET_PAGE_SIZE = 50
export const sheetKey = ["sheet"] as const

/** A sheet row: one location, with its place's fields alongside. */
export type SheetRow = Branch & {
  createdAt: string
  place: Branch["place"] & { description: string | null }
}

export type SheetSort = "created" | "name"

export function useSheetRows(params: {
  q: string
  status?: ContentStatus
  sort: SheetSort
  page: number
}) {
  const api = useApi()
  return useQuery({
    queryKey: [...sheetKey, params],
    queryFn: async () =>
      toPage(
        await api<SheetRow[]>("/admin/branches", {
          query: { ...params, limit: SHEET_PAGE_SIZE },
        }),
        params.page,
        SHEET_PAGE_SIZE
      ),
    placeholderData: keepPreviousData,
  })
}

// One save at a time per row, in the order they were made: quick edits to
// the same row (two cuisines picked in a row) can't land out of order.
const queues = new Map<string, Promise<unknown>>()
function inOrder<T>(key: string, run: () => Promise<T>): Promise<T> {
  const next = (queues.get(key) ?? Promise.resolve()).then(run, run)
  queues.set(
    key,
    next.catch(() => undefined)
  )
  return next
}

async function fetchRow(api: Api, id: string) {
  return (await api<SheetRow>(`/admin/branches/${id}`)).data
}

/**
 * Puts saved rows into every loaded page in place, so the row someone is
 * editing never jumps or reloads under them.
 */
function useUpdateRows() {
  const queryClient = useQueryClient()
  return (
    match: (row: SheetRow) => boolean,
    next: (row: SheetRow) => SheetRow
  ) =>
    queryClient.setQueriesData<Page<SheetRow>>(
      { queryKey: sheetKey },
      (page) =>
        page
          ? {
              ...page,
              rows: page.rows.map((row) => (match(row) ? next(row) : row)),
            }
          : page
    )
}

/** Saves some of a location's fields (the same PATCH as the branch editor). */
export function useSaveRow() {
  const api = useApi()
  const queryClient = useQueryClient()
  const updateRows = useUpdateRows()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: BranchPatch }) =>
      inOrder(id, async () => {
        await api(`/admin/branches/${id}`, { method: "PATCH", body: patch })
        return fetchRow(api, id)
      }),
    onSuccess: (saved) => {
      updateRows(
        (row) => row.id === saved.id,
        () => saved
      )
      void queryClient.invalidateQueries({ queryKey: placesKey })
    },
  })
}

/** Saves a place's own fields; every row of that place shows the change. */
export function useSavePlace() {
  const api = useApi()
  const queryClient = useQueryClient()
  const updateRows = useUpdateRows()
  return useMutation({
    mutationFn: ({
      placeId,
      patch,
    }: {
      placeId: string
      patch: { name?: string; type?: PlaceType; description?: string | null }
    }) =>
      inOrder(`place:${placeId}`, async () => {
        await api(`/admin/places/${placeId}`, { method: "PATCH", body: patch })
        return { placeId, patch }
      }),
    onSuccess: ({ placeId, patch }) => {
      updateRows(
        (row) => row.placeId === placeId,
        (row) => ({ ...row, place: { ...row.place, ...patch } })
      )
      void queryClient.invalidateQueries({ queryKey: placesKey })
    },
  })
}

/** Live / Draft / Archived, through the same routes as the branch editor. */
export function useSetRowStatus() {
  const api = useApi()
  const queryClient = useQueryClient()
  const updateRows = useUpdateRows()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) =>
      inOrder(id, async () => {
        if (status === "archived")
          await api(`/admin/branches/${id}`, { method: "DELETE" })
        else
          await api(
            `/admin/branches/${id}/${status === "published" ? "publish" : "unpublish"}`,
            { method: "PATCH" }
          )
        return fetchRow(api, id)
      }),
    onSuccess: (saved) => {
      updateRows(
        (row) => row.id === saved.id,
        () => saved
      )
      void queryClient.invalidateQueries({ queryKey: placesKey })
    },
  })
}

/**
 * A new row: a location of an existing place, or a new place with its first
 * location. Both start as drafts.
 */
export function useAddRow() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      place: { id: string } | { name: string; type: PlaceType }
      label: string
      addressText: string
    }) => {
      const placeId =
        "id" in input.place
          ? input.place.id
          : (
              await api<{ id: string }>("/admin/places", {
                method: "POST",
                body: input.place,
              })
            ).data.id
      return (
        await api<Branch>("/admin/branches", {
          method: "POST",
          body: {
            placeId,
            label: input.label,
            addressText: input.addressText,
          },
        })
      ).data
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: sheetKey }),
        queryClient.invalidateQueries({ queryKey: placesKey }),
      ]),
  })
}

/** Places a new row's name may already be, drafts included (not archived). */
export function usePlaceMatches(q: string) {
  const api = useApi()
  return useQuery({
    queryKey: [...placesKey, "matches", q],
    queryFn: async () =>
      (
        await api<PlaceListItem[]>("/admin/places", {
          query: { q, limit: 10 },
        })
      ).data
        .filter((p) => p.status !== "archived")
        .slice(0, 5),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
  })
}
