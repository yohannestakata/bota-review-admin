// Shapes of the admin moderation queues (backend admin endpoints).

export type TrustLevel = "new" | "trusted" | "flagged"
/** A rejection reason's key (an editable list in Settings). */
export type RejectionReason = string

export type Person = {
  id: string
  displayName: string
  avatarUrl: string | null
  trustLevel: TrustLevel
}

export type BranchRef = {
  id: string
  label: string
  slug: string
  placeName: string | null
}

export type ReviewRow = {
  id: string
  rating: number
  text: string
  visitDate: string | null
  moderationStatus: string
  requiresSpotCheck: boolean
  reportCount: number
  isFlagged: boolean
  createdAt: string
  branch: BranchRef
  user: Person
}

export type ReplyRow = {
  id: string
  authorRole: "owner" | "user"
  body: string
  reportCount: number
  isFlagged: boolean
  createdAt: string
  user: Person
  review: { id: string; text: string; rating: number }
  branch: BranchRef
}

export type PhotoRow = {
  id: string
  url: string
  width: number
  height: number
  category: string
  createdAt: string
  branch: BranchRef
  uploader: Person
}

export type SubmissionType =
  | "field_correction"
  | "place_missing"
  | "temporarily_closed"
  | "permanently_closed"

export type SubmissionRow = {
  id: string
  type: SubmissionType
  priority: "low" | "normal" | "high"
  fieldName: string | null
  currentValue: string | null
  suggestedValue: string | null
  details: Record<string, unknown> | null
  note: string | null
  createdAt: string
  branch: BranchRef | null
  user: Person
}

export type ClaimRow = {
  id: string
  contactName: string
  contactRole: "owner" | "manager" | "marketing"
  contactPhone: string
  contactEmail: string
  note: string | null
  verificationMethod:
    "business_email" | "social_media" | "phone_call" | "manual_review"
  /** A claim platform's key (an editable list). */
  verificationPlatform: string | null
  verificationEvidence: string | null
  createdAt: string
  branch: BranchRef & { phone: string | null }
  claimant: {
    id: string
    displayName: string
    email: string | null
    trustLevel: TrustLevel
  }
}

/** Why something is in the inbox. */
export type InboxReason = "new" | "reported" | "spot-check"

export type InboxItem =
  | {
      kind: "review"
      key: string
      reason: InboxReason
      createdAt: string
      data: ReviewRow
    }
  | {
      kind: "reply"
      key: string
      reason: InboxReason
      createdAt: string
      data: ReplyRow
    }
  | {
      kind: "photo"
      key: string
      reason: InboxReason
      createdAt: string
      data: PhotoRow
    }
  | {
      kind: "submission"
      key: string
      reason: InboxReason
      createdAt: string
      data: SubmissionRow
    }
  | {
      kind: "claim"
      key: string
      reason: InboxReason
      createdAt: string
      data: ClaimRow
    }

export type InboxKind = InboxItem["kind"]
