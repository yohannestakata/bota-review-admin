export type ReviewQueue = "pending" | "spot-check" | "reported"

export type ReviewStatus = "pending" | "approved" | "rejected" | "archived"

export type RejectionReason =
  | "spam"
  | "fake_visit"
  | "inappropriate"
  | "personal_attack"
  | "off_topic"

export type AdminReview = {
  id: string
  branchId: string
  userId: string
  rating: number
  text: string
  visitDate: string | null
  moderationStatus: ReviewStatus
  rejectionReason: RejectionReason | null
  moderatedAt: string | null
  requiresSpotCheck: boolean
  spotCheckedAt: string | null
  reportCount: number
  isFlagged: boolean
  createdAt: string
  updatedAt: string
  branch: {
    id: string
    label: string
    slug: string
    status: "draft" | "published" | "archived"
  }
  user: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    trustLevel: string
  }
}

export const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "fake_visit", label: "Fake visit" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "personal_attack", label: "Personal attack" },
  { value: "off_topic", label: "Off topic" },
]
