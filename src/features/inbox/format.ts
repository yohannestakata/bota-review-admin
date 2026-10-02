import { formatDistanceToNowStrict } from "date-fns"

import type { BranchRef, InboxItem, RejectionReason, SubmissionType } from "./types"

export function placeLabel(branch: BranchRef | null | undefined) {
  if (!branch) return "New place"
  return branch.placeName ? `${branch.placeName} · ${branch.label}` : branch.label
}

export function ago(iso: string) {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export const KIND_LABEL: Record<InboxItem["kind"], string> = {
  review: "Review",
  reply: "Reply",
  photo: "Photo",
  submission: "Edit",
  claim: "Claim",
}

export const SUBMISSION_LABEL: Record<SubmissionType, string> = {
  field_correction: "Correction",
  place_missing: "New place",
  temporarily_closed: "Temporarily closed",
  permanently_closed: "Permanently closed",
}

export const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "fake_visit", label: "Fake visit" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "personal_attack", label: "Personal attack" },
  { value: "off_topic", label: "Off topic" },
]

/** One-line summary for the list. */
export function summary(item: InboxItem): string {
  switch (item.kind) {
    case "review":
      return `${"★".repeat(item.data.rating)} ${item.data.text}`
    case "reply":
      return item.data.body
    case "photo":
      return `${item.data.category} photo`
    case "submission": {
      const s = item.data
      if (s.type === "place_missing") {
        const name = (s.details as { placeName?: string } | null)?.placeName
        return name ? `Add “${name}”` : "Add a new place"
      }
      if (s.type === "field_correction" && s.fieldName) {
        return `${s.fieldName}: ${s.suggestedValue ?? "—"}`
      }
      return SUBMISSION_LABEL[s.type]
    }
    case "claim":
      return `${item.data.contactName}, ${item.data.contactRole}`
  }
}

export function title(item: InboxItem): string {
  switch (item.kind) {
    case "submission":
      return item.data.type === "place_missing"
        ? "New place"
        : placeLabel(item.data.branch)
    case "claim":
      return placeLabel(item.data.branch)
    default:
      return placeLabel(item.data.branch)
  }
}
