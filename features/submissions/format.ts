import type {
  SubmissionListItem,
  SubmissionPriority,
  SubmissionType,
} from "./types"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export const SUBMISSION_TYPE_LABEL: Record<SubmissionType, string> = {
  field_correction: "Correction",
  place_missing: "Missing place",
  temporarily_closed: "Temp. closed",
  permanently_closed: "Perm. closed",
}

export const SUBMISSION_TYPE_VARIANT: Record<SubmissionType, BadgeVariant> = {
  field_correction: "secondary",
  place_missing: "default",
  temporarily_closed: "outline",
  permanently_closed: "destructive",
}

export const PRIORITY_VARIANT: Record<SubmissionPriority, BadgeVariant> = {
  high: "destructive",
  normal: "secondary",
  low: "outline",
}

export const STATUS_TABS: {
  value: "pending" | "reviewed" | "dismissed"
  label: string
}[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
]

export const TYPE_OPTIONS: { value: SubmissionType | "all"; label: string }[] =
  [
    { value: "all", label: "All types" },
    { value: "field_correction", label: "Corrections" },
    { value: "place_missing", label: "Missing places" },
    { value: "temporarily_closed", label: "Temporarily closed" },
    { value: "permanently_closed", label: "Permanently closed" },
  ]

export const DISMISS_REASONS = [
  "Already correct",
  "Incorrect",
  "Duplicate",
  "Spam",
  "Not enough info",
]

// The branch-detail anchor id to scroll to when resolving a submission.
export function branchSectionForSubmission(
  submission: SubmissionListItem
): string {
  if (submission.type === "place_missing") return "location"
  if (submission.type === "temporarily_closed") return "status"

  switch (normalizedField(submission.fieldName)) {
    case "name":
      return "place"
    case "hours":
      return "hours"
    case "menu/prices":
      return "location"
    case "photos":
      return "photos"
    case "tags/amenities":
      return "classification"
    case "wrong info":
    case "duplicate":
    default:
      return "location"
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// --- Review action resolution (shared by the detail dialog and branch aside) ---

export type ReviewAction = {
  label: string
  pendingLabel: string
  effect: string
  success: string
  variant?: "default" | "destructive"
}

const AUTO_APPLIED_FIELDS = [
  "phone",
  "address",
  "address text",
  "price",
  "price level",
  // Structured corrections — approve applies the typed details to the branch.
  "hours",
  "menu/prices",
  "tags/amenities",
]

export function normalizedField(fieldName: string | null): string {
  return fieldName?.trim().toLowerCase() ?? ""
}

export function fieldCorrectionEffect(fieldName: string | null): string {
  switch (normalizedField(fieldName)) {
    case "name":
      return "Review this manually. Use the place page when the shared place name should change."
    case "phone":
      return "Applies to the branch phone number."
    case "address":
    case "address text":
      return "Applies to the branch address."
    case "price":
    case "price level":
      return "Applies to the branch price level."
    case "hours":
      return "Applies the submitted hours to the branch."
    case "menu/prices":
      return "Replaces the branch menu with the submitted items (old one archived)."
    case "tags/amenities":
      return "Replaces the branch's tags & amenities with the submitted set."
    default:
      return "Open the branch to resolve this, or close it without changes."
  }
}

export function isAutoAppliedField(fieldName: string | null): boolean {
  return AUTO_APPLIED_FIELDS.includes(normalizedField(fieldName))
}

export function isManualReview(submission: SubmissionListItem): boolean {
  if (submission.type === "field_correction") {
    return !isAutoAppliedField(submission.fieldName)
  }
  // place_missing now applies on approve (creates a draft place + branch), so it
  // is handled by its own resolver, not the generic manual-review flow.
  return submission.type === "temporarily_closed"
}

export function reviewAction(submission: SubmissionListItem): ReviewAction {
  switch (submission.type) {
    case "field_correction":
      return isAutoAppliedField(submission.fieldName)
        ? {
            label: "Apply change",
            pendingLabel: "Applying…",
            effect: fieldCorrectionEffect(submission.fieldName),
            success: "Change applied",
          }
        : {
            label: "Resolve without changes",
            pendingLabel: "Resolving…",
            effect: fieldCorrectionEffect(submission.fieldName),
            success: "Resolved",
          }
    case "place_missing":
      return {
        label: "Create place",
        pendingLabel: "Creating…",
        effect:
          "Creates a draft place + branch from this tip. Add a location & photo, then publish.",
        success: "Draft place created",
      }
    case "temporarily_closed":
      return {
        label: "Resolve without changes",
        pendingLabel: "Resolving…",
        effect: "Handle the closure on this page, or close it without changes.",
        success: "Resolved",
      }
    case "permanently_closed":
      return {
        label: "Archive branch",
        pendingLabel: "Archiving…",
        effect: "Archives the branch.",
        success: "Branch archived",
        variant: "destructive",
      }
  }
}
