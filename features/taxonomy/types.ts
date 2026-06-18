export type TaxonomyStatus = "active" | "archived"
export type TagCategory = "vibe" | "diet" | "time" | "practical"

export type TaxonomyItem = {
  id: string
  name: string
  slug: string
  status: TaxonomyStatus
  createdAt: string
  updatedAt: string
}

export type Cuisine = TaxonomyItem
export type Amenity = TaxonomyItem
export type Neighborhood = TaxonomyItem
export type Tag = TaxonomyItem & { category: TagCategory }

export type TaxonomyKind = "neighborhoods" | "cuisines" | "tags" | "amenities"

export type CreateTaxonomyItemBody = {
  name: string
}

export type UpdateTaxonomyItemBody = {
  name?: string
  status?: TaxonomyStatus
}

export type CreateTagBody = CreateTaxonomyItemBody & {
  category: TagCategory
}

export type UpdateTagBody = UpdateTaxonomyItemBody & {
  category?: TagCategory
}
