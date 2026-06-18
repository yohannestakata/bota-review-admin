export type BranchStatus = "draft" | "published" | "archived"

export type VerificationStatus =
  | "unverified"
  | "editor_verified"
  | "business_verified"

export type TaxonomyRef = { id: string; name: string; slug: string }

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

// One [open, close] interval in 24h "HH:MM". A day with no intervals is closed.
export type HoursInterval = [string, string]
export type BranchHours = Partial<Record<DayKey, HoursInterval[]>>

export type AdminBranch = {
  id: string
  label: string | null
  slug: string
  addressText: string | null
  latitude: string | null
  longitude: string | null
  phone: string | null
  hours: BranchHours | null
  priceLevel: number | null
  status: BranchStatus
  verificationStatus: VerificationStatus
  rating: string
  reviewCount: number
  createdAt: string
  updatedAt: string
  place: {
    id: string
    slug: string
    type: string
    status: string
    name: string | null
    description: string | null
  }
  neighborhood: { id: string; name: string | null; slug: string | null } | null
  cuisines: TaxonomyRef[]
  tags: (TaxonomyRef & { category: string })[]
  amenities: TaxonomyRef[]
}

export type ListBranchesParams = {
  status?: BranchStatus
  q?: string
  page?: number
  limit?: number
}

export type Paginated<T> = { data: T[]; total: number }

export type UpdateBranchBody = {
  label?: string
  addressText?: string
  latitude?: string
  longitude?: string
  phone?: string
  hours?: BranchHours
  priceLevel?: number
  neighborhoodId?: string
  cuisineIds?: string[]
  tagIds?: string[]
  amenityIds?: string[]
}
