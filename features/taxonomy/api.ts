import type { AxiosInstance } from "axios"

import type {
  Amenity,
  CreateTagBody,
  CreateTaxonomyItemBody,
  Cuisine,
  FoodCategory,
  Neighborhood,
  Tag,
  TaxonomyKind,
  TaxonomyItem,
  UpdateTagBody,
  UpdateTaxonomyItemBody,
} from "./types"

export async function listCuisines(api: AxiosInstance): Promise<Cuisine[]> {
  const { data } = await api.get<Cuisine[]>("/admin/cuisines")
  return data
}

export async function listFoodCategories(
  api: AxiosInstance
): Promise<FoodCategory[]> {
  const { data } = await api.get<FoodCategory[]>("/admin/food-categories")
  return data
}

export async function listTags(api: AxiosInstance): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>("/admin/tags")
  return data
}

export async function listAmenities(api: AxiosInstance): Promise<Amenity[]> {
  const { data } = await api.get<Amenity[]>("/admin/amenities")
  return data
}

export async function listNeighborhoods(
  api: AxiosInstance
): Promise<Neighborhood[]> {
  const { data } = await api.get<Neighborhood[]>("/admin/neighborhoods")
  return data
}

export async function createTaxonomyItem(
  api: AxiosInstance,
  kind: Exclude<TaxonomyKind, "tags">,
  body: CreateTaxonomyItemBody
): Promise<TaxonomyItem> {
  const { data } = await api.post<TaxonomyItem>(`/admin/${kind}`, body)
  return data
}

export async function updateTaxonomyItem(
  api: AxiosInstance,
  kind: Exclude<TaxonomyKind, "tags">,
  id: string,
  body: UpdateTaxonomyItemBody
): Promise<TaxonomyItem> {
  const { data } = await api.patch<TaxonomyItem>(`/admin/${kind}/${id}`, body)
  return data
}

export async function createTag(
  api: AxiosInstance,
  body: CreateTagBody
): Promise<Tag> {
  const { data } = await api.post<Tag>("/admin/tags", body)
  return data
}

export async function updateTag(
  api: AxiosInstance,
  id: string,
  body: UpdateTagBody
): Promise<Tag> {
  const { data } = await api.patch<Tag>(`/admin/tags/${id}`, body)
  return data
}
