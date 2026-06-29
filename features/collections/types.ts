export type CollectionStatus = "draft" | "published" | "archived"

export type Collection = {
  id: string
  slug: string
  name: string
  description: string | null
  coverImageUrl: string | null
  displayOrder: number
  status: CollectionStatus
  branchCount: number
  publishedBranchCount: number
  createdAt: string
  updatedAt: string
}

export type CollectionBranch = {
  id: string
  placeId: string
  placeName: string
  label: string | null
  status: "draft" | "published" | "archived"
  rating: string
  reviewCount: number
  priceLevel: number | null
  displayOrder: number
  neighborhood: { id: string; name: string | null; slug: string | null } | null
  cuisines: { id: string; name: string; slug: string }[]
  topTags: { id: string; name: string; slug: string; category: string }[]
}

export type CollectionDetail = Collection & {
  branches: CollectionBranch[]
}

export type Paginated<T> = { data: T[]; total: number }

export type CollectionFormValues = {
  name: string
  description: string
  coverImageUrl: string
  displayOrder: string
  status: CollectionStatus
}
