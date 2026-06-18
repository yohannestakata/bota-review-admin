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

export type Paginated<T> = { data: T[]; total: number }

export type CollectionFormValues = {
  name: string
  description: string
  coverImageUrl: string
  displayOrder: string
  status: CollectionStatus
}
