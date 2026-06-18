import type { AxiosInstance } from "axios"

import type { Collection, CollectionFormValues, Paginated } from "./types"

export async function listCollections(
  api: AxiosInstance
): Promise<Paginated<Collection>> {
  const response = await api.get<Collection[]>("/admin/collections", {
    params: { page: 1, limit: 100 },
  })
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
