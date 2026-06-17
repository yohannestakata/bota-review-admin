import type { BranchStatus, VerificationStatus } from "./types"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export const STATUS_TABS: { value: BranchStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

export const STATUS_VARIANT: Record<BranchStatus, BadgeVariant> = {
  draft: "outline",
  published: "default",
  archived: "secondary",
}

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  editor_verified: "Editor",
  business_verified: "Business",
}

export const VERIFICATION_VARIANT: Record<VerificationStatus, BadgeVariant> = {
  unverified: "outline",
  editor_verified: "secondary",
  business_verified: "default",
}

export function priceLabel(level: number | null): string {
  if (!level || level < 1) return "—"
  return "$".repeat(Math.min(level, 4))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
