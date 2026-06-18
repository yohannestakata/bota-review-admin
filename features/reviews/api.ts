import type { AxiosInstance } from "axios"

import type { AdminReview, RejectionReason, ReviewQueue } from "./types"

const QUEUE_PATH: Record<ReviewQueue, string> = {
  pending: "pending",
  "spot-check": "spot-check",
  reported: "reported",
}

export async function listReviews(
  api: AxiosInstance,
  queue: ReviewQueue
): Promise<AdminReview[]> {
  const { data } = await api.get<AdminReview[]>(
    `/admin/reviews/${QUEUE_PATH[queue]}`
  )
  return data
}

export async function approveReview(
  api: AxiosInstance,
  id: string
): Promise<AdminReview> {
  const { data } = await api.patch<AdminReview>(`/admin/reviews/${id}/approve`)
  return data
}

export async function rejectReview(
  api: AxiosInstance,
  id: string,
  rejectionReason: RejectionReason
): Promise<AdminReview> {
  const { data } = await api.patch<AdminReview>(`/admin/reviews/${id}/reject`, {
    rejectionReason,
  })
  return data
}
