export type SubmissionType =
  | "field_correction"
  | "place_missing"
  | "temporarily_closed"
  | "permanently_closed"

export type SubmissionStatus = "pending" | "reviewed" | "dismissed"

export type SubmissionPriority = "low" | "normal" | "high"

export type BranchStatus = "draft" | "published" | "archived"

export type PlaceMissingDetails = {
  placeName: string
  neighborhood?: string
  description?: string
  contactPhone?: string
  contactEmail?: string
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
  q?: string
  page?: number
  limit?: number
}

export type Paginated<T> = { data: T[]; total: number }
