import type { AxiosInstance } from "axios"

import type { Amenity, Cuisine, Neighborhood, Tag } from "./types"

export async function listCuisines(api: AxiosInstance): Promise<Cuisine[]> {
  const { data } = await api.get<Cuisine[]>("/cuisines")
  return data
}

export async function listTags(api: AxiosInstance): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>("/tags")
  return data
}

export async function listAmenities(api: AxiosInstance): Promise<Amenity[]> {
  const { data } = await api.get<Amenity[]>("/amenities")
  return data
}

export async function listNeighborhoods(
  api: AxiosInstance
): Promise<Neighborhood[]> {
  const { data } = await api.get<Neighborhood[]>("/neighborhoods")
  return data
}
