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

export const TYPE_OPTIONS: { value: SubmissionType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "field_correction", label: "Corrections" },
  { value: "place_missing", label: "Missing places" },
  { value: "temporarily_closed", label: "Temporarily closed" },
  { value: "permanently_closed", label: "Permanently closed" },
]

export const DISMISS_REASONS = [
  "Incorrect",
  "Duplicate",
  "Spam",
  "Not enough info",
]

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
  "name",
  "phone",
  "address",
  "address text",
  "price",
  "price level",
]

export function normalizedField(fieldName: string | null): string {
  return fieldName?.trim().toLowerCase() ?? ""
}

export function fieldCorrectionEffect(fieldName: string | null): string {
  switch (normalizedField(fieldName)) {
    case "name":
      return "Applies to the branch label. Use the place page if the shared place name should change."
    case "phone":
      return "Applies to the branch phone number."
    case "address":
    case "address text":
      return "Applies to the branch address."
    case "price":
    case "price level":
      return "Applies to the branch price level."
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
  return (
    submission.type === "place_missing" ||
    submission.type === "temporarily_closed"
  )
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
        label: "Resolve without changes",
        pendingLabel: "Resolving…",
        effect:
          "Enrich and publish the branch on this page, or close it without changes.",
        success: "Resolved",
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
