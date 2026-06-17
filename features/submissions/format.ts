import type { SubmissionPriority, SubmissionType } from "./types"

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

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
