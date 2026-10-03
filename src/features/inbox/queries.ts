import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"

import { useApi, type Api } from "@/lib/api"

import type {
  ClaimRow,
  InboxItem,
  PhotoRow,
  RejectionReason,
  ReplyRow,
  ReviewRow,
  SubmissionRow,
} from "./types"

export const inboxKey = ["inbox"] as const

// Submissions are paged by the API (max 50); the header carries the total.
const SUBMISSION_PAGE = 50

async function list<T>(
  api: Api,
  path: string,
  query?: Record<string, string | number>
) {
  return (await api<T[]>(path, { query })).data
}

/** Every moderation queue, merged into one list, oldest first. */
export function useInbox() {
  const api = useApi()
  const results = useQueries({
    queries: [
      {
        queryKey: [...inboxKey, "reviews", "pending"],
        queryFn: () => list<ReviewRow>(api, "/admin/reviews/pending"),
      },
      {
        queryKey: [...inboxKey, "reviews", "reported"],
        queryFn: () => list<ReviewRow>(api, "/admin/reviews/reported"),
      },
      {
        queryKey: [...inboxKey, "reviews", "spot-check"],
        queryFn: () => list<ReviewRow>(api, "/admin/reviews/spot-check"),
      },
      {
        queryKey: [...inboxKey, "replies", "pending"],
        queryFn: () => list<ReplyRow>(api, "/admin/reviews/replies/pending"),
      },
      {
        queryKey: [...inboxKey, "replies", "reported"],
        queryFn: () => list<ReplyRow>(api, "/admin/reviews/replies/reported"),
      },
      {
        queryKey: [...inboxKey, "photos"],
        queryFn: () => list<PhotoRow>(api, "/admin/photos/pending"),
      },
      {
        queryKey: [...inboxKey, "submissions"],
        queryFn: async () => {
          const res = await api<SubmissionRow[]>("/admin/submissions", {
            query: { status: "pending", limit: SUBMISSION_PAGE },
          })
          const total = Number(
            res.headers.get("X-Total-Count") ?? res.data.length
          )
          return { rows: res.data, total }
        },
      },
      {
        queryKey: [...inboxKey, "claims"],
        queryFn: () =>
          list<ClaimRow>(api, "/admin/claims", { status: "pending" }),
      },
    ],
  })

  const [
    pending,
    reported,
    spot,
    replies,
    reportedReplies,
    photos,
    submissions,
    claims,
  ] = results

  const items: InboxItem[] = []
  const seen = new Set<string>()
  const push = (item: InboxItem) => {
    // A review can be both pending and reported: list it once.
    if (seen.has(item.key)) return
    seen.add(item.key)
    items.push(item)
  }
  for (const r of reported.data ?? [])
    push({
      kind: "review",
      key: `review:${r.id}`,
      reason: "reported",
      createdAt: r.createdAt,
      data: r,
    })
  for (const r of pending.data ?? [])
    push({
      kind: "review",
      key: `review:${r.id}`,
      reason: "new",
      createdAt: r.createdAt,
      data: r,
    })
  for (const r of spot.data ?? [])
    push({
      kind: "review",
      key: `review:${r.id}`,
      reason: "spot-check",
      createdAt: r.createdAt,
      data: r,
    })
  for (const r of reportedReplies.data ?? [])
    push({
      kind: "reply",
      key: `reply:${r.id}`,
      reason: "reported",
      createdAt: r.createdAt,
      data: r,
    })
  for (const r of replies.data ?? [])
    push({
      kind: "reply",
      key: `reply:${r.id}`,
      reason: "new",
      createdAt: r.createdAt,
      data: r,
    })
  for (const p of photos.data ?? [])
    push({
      kind: "photo",
      key: `photo:${p.id}`,
      reason: "new",
      createdAt: p.createdAt,
      data: p,
    })
  for (const s of submissions.data?.rows ?? [])
    push({
      kind: "submission",
      key: `submission:${s.id}`,
      reason: "new",
      createdAt: s.createdAt,
      data: s,
    })
  for (const c of claims.data ?? [])
    push({
      kind: "claim",
      key: `claim:${c.id}`,
      reason: "new",
      createdAt: c.createdAt,
      data: c,
    })

  // Reports first (something's wrong on a live page), then oldest first.
  items.sort((a, b) =>
    a.reason === "reported" && b.reason !== "reported"
      ? -1
      : b.reason === "reported" && a.reason !== "reported"
        ? 1
        : a.createdAt.localeCompare(b.createdAt)
  )

  const hiddenSubmissions = Math.max(
    0,
    (submissions.data?.total ?? 0) - (submissions.data?.rows.length ?? 0)
  )

  return {
    items,
    // Show what has arrived; one slow queue shouldn't hide the rest.
    isLoading: results.every((r) => r.isPending),
    isLoadingMore: results.some((r) => r.isPending),
    isFetching: results.some((r) => r.isFetching),
    error: results.find((r) => r.error)?.error ?? null,
    /** Total waiting, including submissions beyond the first page. */
    total: items.length + hiddenSubmissions,
    hiddenSubmissions,
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  }
}

export type Decision =
  | {
      action: "approve"
      note?: string
      /** A new-place submission: add it as a branch of this place. */
      /** A place to add it to; null = a new place despite a suggestion. */
      placeId?: string | null
    }
  | { action: "reject"; reason?: RejectionReason; note?: string }

function endpoint(item: InboxItem, decision: Decision) {
  const approve = decision.action === "approve"
  switch (item.kind) {
    case "review":
      return approve
        ? { path: `/admin/reviews/${item.data.id}/approve` }
        : {
            path: `/admin/reviews/${item.data.id}/reject`,
            body: { rejectionReason: decision.reason },
          }
    case "reply":
      return approve
        ? { path: `/admin/reviews/replies/${item.data.id}/approve` }
        : {
            path: `/admin/reviews/replies/${item.data.id}/reject`,
            body: { rejectionReason: decision.reason },
          }
    case "photo":
      return {
        path: `/admin/photos/${item.data.id}/${approve ? "approve" : "reject"}`,
      }
    case "submission":
      return approve
        ? {
            path: `/admin/submissions/${item.data.id}/review`,
            body: {
              ...(decision.note ? { note: decision.note } : {}),
              ...(decision.placeId !== undefined
                ? { placeId: decision.placeId }
                : {}),
            },
          }
        : {
            path: `/admin/submissions/${item.data.id}/dismiss`,
            body: decision.note ? { reason: decision.note } : {},
          }
    case "claim":
      return approve
        ? { path: `/admin/claims/${item.data.id}/verify` }
        : {
            path: `/admin/claims/${item.data.id}/reject`,
            body: { rejectionReason: decision.note },
          }
  }
}

/** Approve or reject an inbox item; it leaves the list straight away. */
export function useDecide() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      item,
      decision,
    }: {
      item: InboxItem
      decision: Decision
    }) => {
      const { path, body } = endpoint(item, decision) as {
        path: string
        body?: unknown
      }
      // An approved new place comes back with its draft to finish.
      return (
        await api<{ draftPlaceId?: string | null; branchId?: string | null }>(
          path,
          { method: "PATCH", body }
        )
      ).data
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: inboxKey }),
  })
}
