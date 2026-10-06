import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/api"
import { toPage } from "@/lib/paginated"

import type {
  Branch,
  BranchPatch,
  BranchPhoto,
  ContentStatus,
  Menu,
  MenuItemSize,
  PlaceDetail,
  PlaceListItem,
  PlaceType,
  TaxonRow,
} from "./types"

export const placesKey = ["places"] as const
export const branchKey = (id: string) => ["branch", id] as const

export const PAGE_SIZE = 25

export function usePlaces(params: {
  q: string
  status?: ContentStatus
  type?: PlaceType
  page: number
}) {
  const api = useApi()
  return useQuery({
    queryKey: [...placesKey, params],
    queryFn: async () =>
      toPage(
        await api<PlaceListItem[]>("/admin/places", {
          query: { ...params, limit: PAGE_SIZE },
        }),
        params.page,
        PAGE_SIZE
      ),
    placeholderData: keepPreviousData,
  })
}

export function usePlace(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: [...placesKey, "detail", id],
    queryFn: async () => (await api<PlaceDetail>(`/admin/places/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useBranch(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: branchKey(id ?? ""),
    queryFn: async () => (await api<Branch>(`/admin/branches/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useBranchPhotos(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: [...branchKey(id ?? ""), "photos"],
    queryFn: async () =>
      (await api<BranchPhoto[]>(`/admin/branches/${id}/photos`)).data,
    enabled: Boolean(id),
  })
}

export function useBranchMenus(id: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: [...branchKey(id ?? ""), "menus"],
    queryFn: async () => (await api<Menu[]>(`/branches/${id}/menus`)).data,
    enabled: Boolean(id),
  })
}

export type TaxonomyKind =
  | "neighborhoods"
  | "cuisines"
  | "food-categories"
  | "tags"
  | "amenities"
  | "tag-groups"
  | "photo-categories"
  | "place-types"
  | "rejection-reasons"
  | "claim-platforms"

/** Small lists keyed by a stable key and kept in a set order. */
export const LOOKUP_KINDS: TaxonomyKind[] = [
  "tag-groups",
  "photo-categories",
  "place-types",
  "rejection-reasons",
  "claim-platforms",
]

type LookupRow = {
  key: string
  name: string
  status: TaxonRow["status"]
  displayOrder: number
}

export function useTaxonomy(kind: TaxonomyKind) {
  const api = useApi()
  return useQuery({
    queryKey: ["taxonomy", kind],
    queryFn: async (): Promise<TaxonRow[]> => {
      if (LOOKUP_KINDS.includes(kind)) {
        // Their key doubles as the id, so the same editor and routes work.
        const rows = (await api<LookupRow[]>(`/admin/${kind}`)).data
        return rows
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((r) => ({
            id: r.key,
            name: r.name,
            slug: r.key,
            status: r.status,
          }))
      }
      const rows = (await api<TaxonRow[]>(`/admin/${kind}`)).data
      return rows.sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: 5 * 60_000,
  })
}

/** Active entries of a lookup list, plus a key -> name helper. */
export function useLookup(
  kind:
    | "tag-groups"
    | "photo-categories"
    | "place-types"
    | "rejection-reasons"
    | "claim-platforms"
) {
  const list = useTaxonomy(kind)
  const all = list.data ?? []
  return {
    active: all.filter((r) => r.status === "active"),
    nameOf: (key: string | null | undefined) =>
      all.find((r) => r.id === key)?.name ?? key ?? "",
  }
}

/** Invalidate everything a branch change can affect. */
function useInvalidateBranch() {
  const queryClient = useQueryClient()
  return (branchId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: branchKey(branchId) }),
      queryClient.invalidateQueries({ queryKey: placesKey }),
      queryClient.invalidateQueries({ queryKey: ["quality"] }),
    ])
}

export function useUpdateBranch(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  const invalidate = useInvalidateBranch()
  return useMutation({
    mutationFn: async (patch: BranchPatch) =>
      (
        await api<Branch>(`/admin/branches/${branchId}`, {
          method: "PATCH",
          body: patch,
        })
      ).data,
    onSuccess: (saved) => {
      queryClient.setQueryData(branchKey(branchId), saved)
      return invalidate(branchId)
    },
  })
}

export function useBranchStatus(branchId: string) {
  const api = useApi()
  const invalidate = useInvalidateBranch()
  return useMutation({
    mutationFn: async (action: "publish" | "unpublish" | "archive") =>
      action === "archive"
        ? (
            await api<Branch>(`/admin/branches/${branchId}`, {
              method: "DELETE",
            })
          ).data
        : (
            await api<Branch>(`/admin/branches/${branchId}/${action}`, {
              method: "PATCH",
            })
          ).data,
    onSuccess: () => invalidate(branchId),
  })
}

export function usePhotoAction(branchId: string) {
  const api = useApi()
  const invalidate = useInvalidateBranch()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      photoId,
      action,
    }: {
      photoId: string
      action: "cover" | "approve" | "reject"
    }) => {
      if (action === "cover") {
        await api(`/admin/branches/${branchId}/cover`, {
          method: "PATCH",
          body: { photoId },
        })
      } else {
        await api(`/admin/photos/${photoId}/${action}`, { method: "PATCH" })
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inbox"] })
      return invalidate(branchId)
    },
  })
}

export function useMenuItemAction(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input:
        | { action: "availability"; itemId: string; isAvailable: boolean }
        | { action: "remove"; itemId: string }
        // A new photo for the dish; null takes it off.
        | { action: "photo"; itemId: string; file: File | null }
        | {
            action: "add"
            menuId: string
            name: string
            price?: string
            sizes?: MenuItemSize[]
            category?: string
          }
        | { action: "create-menu"; name: string }
    ) => {
      switch (input.action) {
        case "availability":
          return api(`/admin/menu-items/${input.itemId}/availability`, {
            method: "PATCH",
            body: { isAvailable: input.isAvailable },
          })
        case "remove":
          return api(`/admin/menu-items/${input.itemId}`, { method: "DELETE" })
        case "photo": {
          const photo = input.file
            ? await uploadToCloudinary(api, input.file)
            : null
          return api(`/admin/menu-items/${input.itemId}`, {
            method: "PATCH",
            body: {
              imageUrl: photo?.secure_url ?? null,
              cloudinaryPublicId: photo?.public_id ?? null,
            },
          })
        }
        case "add":
          return api(`/admin/menus/${input.menuId}/items`, {
            method: "POST",
            body: {
              name: input.name,
              ...(input.sizes
                ? { sizes: input.sizes }
                : { price: input.price }),
              ...(input.category ? { category: input.category } : {}),
            },
          })
        case "create-menu":
          return api(`/admin/branches/${branchId}/menus`, {
            method: "POST",
            body: { name: input.name },
          })
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...branchKey(branchId), "menus"],
      }),
  })
}

export function useUpdatePlace(placeId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      name?: string
      type?: PlaceType
      description?: string | null
    }) =>
      (await api(`/admin/places/${placeId}`, { method: "PATCH", body })).data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: placesKey }),
        queryClient.invalidateQueries({ queryKey: ["quality"] }),
      ]),
  })
}

export function useArchivePlace(placeId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      (await api(`/admin/places/${placeId}`, { method: "DELETE" })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: placesKey }),
  })
}

export function useCreatePlace() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; type: PlaceType }) =>
      (await api<{ id: string }>("/admin/places", { method: "POST", body }))
        .data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: placesKey }),
  })
}

export function useCreateBranch() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      placeId: string
      label: string
      addressText: string
    }) => (await api<Branch>("/admin/branches", { method: "POST", body })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: placesKey }),
  })
}

export type BranchIssue = { key: string; title: string; note: string | null }

/** The Fix-list checks this branch fails. */
export function useBranchIssues(id: string) {
  const api = useApi()
  return useQuery({
    queryKey: ["quality", "branch", id],
    queryFn: async () =>
      (await api<BranchIssue[]>(`/admin/quality/branches/${id}`)).data,
  })
}

/** Moves this place's branches into another place and archives this one. */
export type MergePlan = {
  sourceId: string
  intoPlaceId: string
  /** Branches folded into an existing branch; the rest become new branches. */
  branches: { branchId: string; intoBranchId: string | null }[]
}

/** Moves one place's branches into another and archives the first. */
export function useMergePlace() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sourceId, ...body }: MergePlan) =>
      (
        await api<{ moved: number; merged: number }>(
          `/admin/places/${sourceId}/merge`,
          {
            method: "POST",
            body,
          }
        )
      ).data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: placesKey }),
        queryClient.invalidateQueries({ queryKey: ["quality"] }),
      ]),
  })
}

export function usePlaceSearch(q: string) {
  const api = useApi()
  return useQuery({
    queryKey: [...placesKey, "search", q],
    queryFn: async () =>
      (
        await api<PlaceListItem[]>("/admin/places", {
          query: { q, status: "published", limit: 20 },
        })
      ).data,
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  })
}

/** A photo category's key; the list is editable in Settings. */
export type PhotoCategory = string

type PhotoSignature = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  uploadPreset?: string
  folder: string
}

/** Uploads an image straight to Cloudinary, signed by the API. */
async function uploadToCloudinary(api: ReturnType<typeof useApi>, file: File) {
  const sig = (await api<PhotoSignature>("/photos/sign", { method: "POST" }))
    .data
  const form = new FormData()
  form.append("file", file)
  form.append("api_key", sig.apiKey)
  form.append("timestamp", String(sig.timestamp))
  form.append("signature", sig.signature)
  form.append("folder", sig.folder)
  if (sig.uploadPreset) form.append("upload_preset", sig.uploadPreset)
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form }
  )
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string }
    } | null
    throw new Error(
      `${file.name} didn't upload: ${body?.error?.message ?? `status ${response.status}`}`
    )
  }
  return (await response.json()) as {
    public_id: string
    secure_url: string
    width: number
    height: number
  }
}

/**
 * Uploads photos straight to Cloudinary (signed by the API), then adds them
 * to the branch. Admin uploads are approved at once; the first becomes the
 * cover if the branch has none.
 */
export function useUploadPhotos(branchId: string) {
  const api = useApi()
  const invalidate = useInvalidateBranch()
  return useMutation({
    mutationFn: async ({
      files,
      category,
    }: {
      files: File[]
      category: PhotoCategory
    }) => {
      let added = 0
      for (const file of files) {
        const uploaded = await uploadToCloudinary(api, file)
        await api(`/branches/${branchId}/photos`, {
          method: "POST",
          body: {
            publicId: uploaded.public_id,
            url: uploaded.secure_url,
            width: uploaded.width,
            height: uploaded.height,
            category,
          },
        })
        added += 1
      }
      return added
    },
    // Refresh even after a partial failure, so the ones that made it show.
    onSettled: () => invalidate(branchId),
  })
}
