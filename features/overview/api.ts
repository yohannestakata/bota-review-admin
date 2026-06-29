import type { AxiosInstance } from "axios"

import type { AdminClaim } from "@/features/claims/types"
import type { AdminPhoto } from "@/features/photos/types"
import type { AdminReplyPending, AdminReview } from "@/features/reviews/types"
import type { SubmissionListItem } from "@/features/submissions/types"
import type { OverviewActivity, OverviewData, OverviewMetric } from "./types"

async function countArray<T>(
  request: Promise<{ data: T[] }>
): Promise<number | null> {
  try {
    const response = await request
    return response.data.length
  } catch {
    return null
  }
}

async function countPaginated<T>(
  request: Promise<{ data: T[]; headers: Record<string, unknown> }>
): Promise<number | null> {
  try {
    const response = await request
    return Number(response.headers["x-total-count"] ?? response.data.length)
  } catch {
    return null
  }
}

async function getArray<T>(request: Promise<{ data: T[] }>): Promise<T[]> {
  try {
    const response = await request
    return response.data
  } catch {
    return []
  }
}

async function getPaginated<T>(
  request: Promise<{ data: T[] }>
): Promise<T[]> {
  try {
    const response = await request
    return response.data
  } catch {
    return []
  }
}

function metric(
  key: string,
  label: string,
  value: number | null,
  href: string,
  detail: string,
  tone: OverviewMetric["tone"] = "default"
): OverviewMetric {
  return { key, label, value, href, detail, tone }
}

function submissionActivity(item: SubmissionListItem): OverviewActivity {
  const details = item.details
  const placeMissing =
    item.type === "place_missing" &&
    details !== null &&
    "placeName" in details
  return {
    id: item.id,
    label: placeMissing
      ? String(details.placeName)
      : (item.branch?.label ?? "Submission"),
    detail: item.type.replaceAll("_", " "),
    href: `/submissions?status=pending`,
    createdAt: item.createdAt,
    priority: item.priority,
  }
}

function reviewActivity(item: AdminReview): OverviewActivity {
  return {
    id: item.id,
    label: item.branch.label ?? "Review",
    detail: `${item.rating}/5 review from ${item.user.displayName ?? "Unknown"}`,
    href: "/reviews",
    createdAt: item.createdAt,
  }
}

function replyActivity(item: AdminReplyPending): OverviewActivity {
  return {
    id: item.id,
    label: item.branch.label ?? "Reply",
    detail: `Reply from ${item.user.displayName ?? item.authorRole}`,
    href: "/review-replies",
    createdAt: item.createdAt,
  }
}

function claimActivity(item: AdminClaim): OverviewActivity {
  return {
    id: item.id,
    label: item.branch.label ?? "Business claim",
    detail: `${item.contactName} · ${item.contactRole.replaceAll("_", " ")}`,
    href: "/claims",
    createdAt: item.createdAt,
  }
}

function photoActivity(item: AdminPhoto): OverviewActivity {
  return {
    id: item.id,
    label: item.branch.label ?? "Photo",
    detail: item.category,
    href: "/photos",
    createdAt: item.createdAt,
  }
}

export async function getOverview(api: AxiosInstance): Promise<OverviewData> {
  const [
    pendingSubmissionsCount,
    pendingReviewsCount,
    spotCheckReviewsCount,
    reportedReviewsCount,
    pendingRepliesCount,
    reportedRepliesCount,
    pendingPhotosCount,
    pendingClaimsCount,
    draftBranchesCount,
    placesCount,
    collectionsCount,
    usersCount,
    pendingSubmissions,
    pendingReviews,
    pendingReplies,
    pendingClaims,
    pendingPhotos,
  ] = await Promise.all([
    countPaginated<SubmissionListItem>(
      api.get("/admin/submissions", {
        params: { status: "pending", page: 1, limit: 1 },
      })
    ),
    countArray<AdminReview>(api.get("/admin/reviews/pending")),
    countArray<AdminReview>(api.get("/admin/reviews/spot-check")),
    countArray<AdminReview>(api.get("/admin/reviews/reported")),
    countArray<AdminReplyPending>(api.get("/admin/reviews/replies/pending")),
    countArray<AdminReplyPending>(api.get("/admin/reviews/replies/reported")),
    countArray<AdminPhoto>(api.get("/admin/photos/pending")),
    countArray<AdminClaim>(api.get("/admin/claims", { params: { status: "pending" } })),
    countPaginated(api.get("/admin/branches", { params: { status: "draft", page: 1, limit: 1 } })),
    countPaginated(api.get("/admin/places", { params: { page: 1, limit: 1 } })),
    countPaginated(api.get("/admin/collections", { params: { page: 1, limit: 1 } })),
    countPaginated(api.get("/admin/users", { params: { page: 1, limit: 1 } })),
    getPaginated<SubmissionListItem>(
      api.get("/admin/submissions", {
        params: { status: "pending", page: 1, limit: 5 },
      })
    ),
    getArray<AdminReview>(api.get("/admin/reviews/pending")),
    getArray<AdminReplyPending>(api.get("/admin/reviews/replies/pending")),
    getArray<AdminClaim>(api.get("/admin/claims", { params: { status: "pending" } })),
    getArray<AdminPhoto>(api.get("/admin/photos/pending")),
  ])

  const metrics = [
    metric(
      "submissions",
      "Pending submissions",
      pendingSubmissionsCount,
      "/submissions?status=pending",
      "User-submitted corrections and missing places",
      pendingSubmissionsCount ? "warning" : "muted"
    ),
    metric(
      "moderation",
      "Review moderation",
      sumNullable(pendingReviewsCount, spotCheckReviewsCount, reportedReviewsCount),
      "/reviews",
      "Pending, spot-check, and reported reviews",
      sumNullable(pendingReviewsCount, spotCheckReviewsCount, reportedReviewsCount)
        ? "danger"
        : "muted"
    ),
    metric(
      "photos",
      "Pending photos",
      pendingPhotosCount,
      "/photos",
      "Photos waiting for approval",
      pendingPhotosCount ? "warning" : "muted"
    ),
    metric(
      "claims",
      "Business claims",
      pendingClaimsCount,
      "/claims",
      "Ownership claims requiring admin review",
      pendingClaimsCount ? "danger" : "muted"
    ),
    metric(
      "branches",
      "Draft branches",
      draftBranchesCount,
      "/branches?status=draft",
      "Branches not yet published",
      draftBranchesCount ? "warning" : "muted"
    ),
    metric(
      "catalog",
      "Catalog records",
      sumNullable(placesCount, collectionsCount),
      "/places",
      `${placesCount ?? "-"} places · ${collectionsCount ?? "-"} collections`,
      "default"
    ),
    metric(
      "replies",
      "Reply moderation",
      sumNullable(pendingRepliesCount, reportedRepliesCount),
      "/review-replies",
      "Owner/user replies waiting for review",
      sumNullable(pendingRepliesCount, reportedRepliesCount) ? "warning" : "muted"
    ),
    metric(
      "users",
      "Users",
      usersCount,
      "/users",
      "Registered accounts visible to admins",
      "default"
    ),
  ]

  const workQueue = [
    ...pendingSubmissions.map(submissionActivity),
    ...pendingReviews.slice(0, 5).map(reviewActivity),
    ...pendingReplies.slice(0, 5).map(replyActivity),
    ...pendingClaims.slice(0, 5).map(claimActivity),
    ...pendingPhotos.slice(0, 5).map(photoActivity),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 12)

  return { metrics, workQueue }
}

function sumNullable(...values: (number | null)[]) {
  if (values.every((value) => value === null)) return null
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
}
