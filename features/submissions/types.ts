export type SubmissionType =
  | "field_correction"
  | "place_missing"
  | "temporarily_closed"
  | "permanently_closed"

export type SubmissionStatus = "pending" | "reviewed" | "dismissed"

export type SubmissionPriority = "low" | "normal" | "high"

export type BranchStatus = "draft" | "published" | "archived"

export type SubmissionHoursEntry = {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
  open: string
  close: string
}

export type SubmissionHourChange =
  | {
      operation: "set"
      day: SubmissionHoursEntry["day"]
      open: string
      close: string
    }
  | { operation: "close"; day: SubmissionHoursEntry["day"] }

export type SubmissionTaxonomyChanges = {
  add: string[]
  remove: string[]
}

export type SubmissionMenuItem = {
  name: string
  category?: string
  price?: number
  imageUrl?: string
  publicId?: string
  photoIsNew?: boolean
}

export type SubmissionMenuChange =
  | { operation: "add"; item: SubmissionMenuItem }
  | { operation: "update"; itemId: string; item: SubmissionMenuItem }
  | { operation: "remove"; itemId: string; itemName: string }

export type PlaceMissingDetails = {
  placeName: string
  // Set when the submitter recognised the place already exists and is adding a
  // new location to it. Absent = they intend a brand-new place.
  existingPlaceId?: string
  neighborhood?: string
  description?: string
  contactPhone?: string
  contactEmail?: string
  latitude?: number
  longitude?: number
  type?: "restaurant" | "cafe" | "bakery" | "bar"
  hours?: SubmissionHoursEntry[]
  hourChanges?: SubmissionHourChange[]
  menu?: SubmissionMenuItem[]
  menuChanges?: SubmissionMenuChange[]
  cuisines?: string[]
  tags?: string[]
  amenities?: string[]
  tagChanges?: SubmissionTaxonomyChanges
  amenityChanges?: SubmissionTaxonomyChanges
  photos?: { publicId: string; url: string; width: number; height: number }[]
  reportedPhotoId?: string
  reportedPhotoUrl?: string
}

// Raw submission row (returned by review/dismiss).
export type Submission = {
  id: string
  branchId: string | null
  userId: string
  type: SubmissionType
  priority: SubmissionPriority
  fieldName: string | null
  currentValue: string | null
  suggestedValue: string | null
  details: PlaceMissingDetails | Record<string, unknown> | null
  note: string | null
  status: SubmissionStatus
  reviewedByUserId: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
}

// Enriched row from the admin list (joins branch + user).
export type SubmissionListItem = Submission & {
  branch: {
    id: string
    label: string | null
    slug: string
    status: BranchStatus
  } | null
  user: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    trustLevel: string
  }
}

export type ListSubmissionsParams = {
  status?: SubmissionStatus
  type?: SubmissionType
  branchId?: string
  q?: string
  page?: number
  limit?: number
}

export type Paginated<T> = { data: T[]; total: number }
