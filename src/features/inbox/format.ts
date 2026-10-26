import { formatDistanceToNowStrict } from "date-fns"

import type { BranchRef, InboxItem, SubmissionType } from "./types"

export function placeLabel(branch: BranchRef | null | undefined) {
  if (!branch) return "New place"
  return branch.placeName
    ? `${branch.placeName} · ${branch.label}`
    : branch.label
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

/** One-line summary for the list. */
export function summary(item: InboxItem): string {
  switch (item.kind) {
    case "review":
      return `${"★".repeat(item.data.rating)} ${item.data.text}`
    case "reply":
      return item.data.body
    case "photo":
      return `${item.data.category[0]?.toUpperCase() ?? ""}${item.data.category.slice(1)} photo`
    case "submission": {
      const s = item.data
      if (s.type === "place_missing") {
        const name = (s.details as { placeName?: string } | null)?.placeName
        return name ? `Add “${name}”` : "Add a new place"
      }
      if (s.type === "field_correction" && s.fieldName) {
        if (s.suggestedValue !== null)
          return `${s.fieldName}: ${s.suggestedValue}`
        // Hours, menus, tags and photos carry their changes in the details.
        const what = detailSummary(s.details)
        return what ? `${s.fieldName}: ${what}` : s.fieldName
      }
      return SUBMISSION_LABEL[s.type]
    }
    case "claim":
      return `${item.data.contactName}, ${item.data.contactRole}`
  }
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

/** What a correction's details change, e.g. "3 menu photos, 2 dishes". */
function detailSummary(details: unknown) {
  const d = (details ?? {}) as Record<string, unknown>
  const length = (key: string) =>
    Array.isArray(d[key]) ? (d[key] as unknown[]).length : 0
  const changes = (key: string) => {
    const c = d[key] as { add?: unknown[]; remove?: unknown[] } | undefined
    return (c?.add?.length ?? 0) + (c?.remove?.length ?? 0)
  }
  const photos = Array.isArray(d.photos)
    ? (d.photos as { category?: string }[])
    : []
  const menuPhotos = photos.filter((p) => p.category === "menu").length
  const otherPhotos = photos.length - menuPhotos
  const taxonomy =
    changes("foodCategoryChanges") +
    changes("cuisineChanges") +
    changes("tagChanges") +
    changes("amenityChanges")
  const dishes = length("menuChanges") || length("menu")
  const days = length("hourChanges") || length("hours")
  return [
    menuPhotos ? plural(menuPhotos, "menu photo", "menu photos") : null,
    otherPhotos ? plural(otherPhotos, "photo", "photos") : null,
    dishes ? plural(dishes, "dish", "dishes") : null,
    days ? plural(days, "day", "days") : null,
    taxonomy ? plural(taxonomy, "change", "changes") : null,
    d.reportedPhotoId ? "a photo reported" : null,
  ]
    .filter(Boolean)
    .join(", ")
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

/** Why a review's text was held for a check. */
export const HELD_LABEL: Record<string, string> = {
  slur: "Slur",
  strong_language: "Strong language",
  phone: "Phone number",
  link: "Link",
}
