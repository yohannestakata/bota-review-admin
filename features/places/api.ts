import type { AxiosInstance } from "axios"

import type {
  AdminPlace,
  AdminPlaceDetail,
  ListPlacesParams,
  Paginated,
  UpdatePlaceBody,
} from "./types"

export async function listPlaces(
  api: AxiosInstance,
  params: ListPlacesParams
): Promise<Paginated<AdminPlace>> {
  const response = await api.get<AdminPlace[]>("/admin/places", { params })
  const total = Number(
    response.headers["x-total-count"] ?? response.data.length
  )
  return { data: response.data, total }
}

export async function getPlace(
  api: AxiosInstance,
  id: string
): Promise<AdminPlaceDetail> {
  const { data } = await api.get<AdminPlaceDetail>(`/admin/places/${id}`)
  return data
}

export async function updatePlace(
  api: AxiosInstance,
  id: string,
  body: UpdatePlaceBody
) {
  const { data } = await api.patch<AdminPlace>(`/admin/places/${id}`, body)
  return data
}
