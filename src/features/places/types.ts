export type ContentStatus = "draft" | "published" | "archived"
/** A place type's key; the types are an editable list (Settings). */
export type PlaceType = string
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
export type Hours = Partial<Record<DayKey, [string, string][]>>

export type PlaceListItem = {
  id: string
  slug: string
  type: PlaceType
  status: ContentStatus
  name: string
  description: string | null
  avatarUrl: string | null
  branchCount: number
  updatedAt: string
}

export type PlaceBranchSummary = {
  id: string
  label: string
  slug: string
  addressText: string
  status: ContentStatus
  rating: string
  reviewCount: number
  neighborhood: Taxon | null
  latitude: string | null
  longitude: string | null
}

export type PlaceDetail = PlaceListItem & { branches: PlaceBranchSummary[] }

export type Taxon = { id: string; name: string; slug: string }
export type TaxonRow = Taxon & {
  status: "active" | "archived"
  category?: string
}

export type Branch = {
  id: string
  placeId: string
  label: string
  slug: string
  addressText: string
  directions: string | null
  customDirections: string | null
  generatedDirections: string | null
  latitude: string | null
  longitude: string | null
  phone: string | null
  hours: Hours | null
  priceLevel: number | null
  status: ContentStatus
  verificationStatus: "unverified" | "editor_verified" | "business_verified"
  rating: string
  reviewCount: number
  updatedAt: string
  place: {
    id: string
    slug: string
    type: PlaceType
    status: ContentStatus
    name: string
  }
  neighborhood: Taxon | null
  cuisines: Taxon[]
  foodCategories: Taxon[]
  tags: (Taxon & { category: string })[]
  amenities: Taxon[]
}

export type BranchPhoto = {
  id: string
  url: string
  width: number
  height: number
  category: string
  moderationStatus: "pending" | "approved" | "rejected"
  isCover: boolean
  reviewId: string | null
  createdAt: string
  uploader: { id: string; displayName: string }
}

/** A priced size of a menu item, in menu order. */
export type MenuItemSize = { label: string; price: string }

export type MenuItem = {
  id: string
  name: string
  description: string | null
  /** The lowest price; for an item with sizes, the smallest size's. */
  price: string
  sizes: MenuItemSize[] | null
  category: string | null
  imageUrl: string | null
  isAvailable: boolean
  displayOrder: number
}

export type Menu = { id: string; name: string; items: MenuItem[] }

export type BranchPatch = Partial<{
  label: string
  addressText: string
  directions: string
  neighborhoodId: string | null
  latitude: string | null
  longitude: string | null
  phone: string | null
  priceLevel: number | null
  hours: Hours
  cuisineIds: string[]
  foodCategoryIds: string[]
  tagIds: string[]
  amenityIds: string[]
}>
