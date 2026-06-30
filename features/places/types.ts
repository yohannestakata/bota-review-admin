import type {
  BranchStatus,
  VerificationStatus,
} from "@/features/branches/types"

export type PlaceStatus = "draft" | "published" | "archived"

export type AdminPlace = {
  id: string
  slug: string
  type: string
  status: PlaceStatus
  name: string
  description: string | null
  branchCount: number
  createdAt: string
  updatedAt: string
}

export type AdminPlaceBranch = {
  id: string
  placeId: string
  label: string | null
  slug: string
  addressText: string | null
  latitude: string | null
  longitude: string | null
  priceLevel: number | null
  rating: string
  reviewCount: number
  status: BranchStatus
  verificationStatus: VerificationStatus
  updatedAt: string
  neighborhood: { id: string; name: string | null; slug: string | null } | null
}

export type AdminPlaceDetail = AdminPlace & {
  branches: AdminPlaceBranch[]
}

export type ListPlacesParams = {
  q?: string
  type?: string
  page?: number
  limit?: number
}

export type Paginated<T> = { data: T[]; total: number }

export type UpdatePlaceBody = {
  name?: string
  description?: string | null
  type?: string
  status?: PlaceStatus
}

export type CreatePlaceBody = {
  name: string
  description?: string
  type: string
  status?: PlaceStatus
}
