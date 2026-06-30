import type { AxiosInstance } from "axios"

import type {
  Collection,
  CollectionDetail,
  CollectionFormValues,
  Paginated,
} from "./types"

type PaginatedBody<T> = Paginated<T> & {
  page?: number
  limit?: number
}

function isPaginatedBody<T>(value: unknown): value is PaginatedBody<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  )
}

export async function listCollections(
  api: AxiosInstance
): Promise<Paginated<Collection>> {
  const response = await api.get<Collection[] | PaginatedBody<Collection>>(
    "/admin/collections",
    {
      params: { page: 1, limit: 50 },
    }
  )

  if (isPaginatedBody<Collection>(response.data)) {
    return {
      data: response.data.data,
      total: response.data.total,
    }
  }

  const total = Number(
    response.headers["x-total-count"] ?? response.data.length
  )
  return { data: response.data, total }
}

function formBody(values: CollectionFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    coverImageUrl: values.coverImageUrl.trim() || undefined,
    displayOrder: Number(values.displayOrder || 0),
    status: values.status,
  }
}

export async function createCollection(
  api: AxiosInstance,
  values: CollectionFormValues
): Promise<Collection> {
  const { data } = await api.post<Collection>(
    "/admin/collections",
    formBody(values)
  )
  return data
}

export async function getCollection(
  api: AxiosInstance,
  id: string
): Promise<CollectionDetail> {
  const { data } = await api.get<CollectionDetail>(`/admin/collections/${id}`)
  return data
}

export async function updateCollection(
  api: AxiosInstance,
  id: string,
  values: CollectionFormValues
): Promise<Collection> {
  const { data } = await api.patch<Collection>(
    `/admin/collections/${id}`,
    formBody(values)
  )
  return data
}

export async function publishCollection(
  api: AxiosInstance,
  id: string
): Promise<Collection> {
  const { data } = await api.patch<Collection>(
    `/admin/collections/${id}/publish`
  )
  return data
}

export async function archiveCollection(
  api: AxiosInstance,
  id: string
): Promise<Collection> {
  const { data } = await api.delete<Collection>(`/admin/collections/${id}`)
  return data
}

export async function addCollectionBranch(
  api: AxiosInstance,
  id: string,
  branchId: string,
  displayOrder?: number
) {
  const { data } = await api.post(`/admin/collections/${id}/branches`, {
    branchId,
    displayOrder,
  })
  return data
}

export async function removeCollectionBranch(
  api: AxiosInstance,
  id: string,
  branchId: string
) {
  const { data } = await api.delete(
    `/admin/collections/${id}/branches/${branchId}`
  )
  return data
}

export async function reorderCollectionBranches(
  api: AxiosInstance,
  id: string,
  branchIds: string[]
) {
  const { data } = await api.patch(`/admin/collections/${id}/order`, {
    branchIds,
  })
  return data
}
