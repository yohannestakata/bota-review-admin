"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  approveReply,
  approveReview,
  listReplies,
  listReviews,
  rejectReply,
  rejectReview,
} from "./api"
import type { RejectionReason, ReplyQueue, ReviewQueue } from "./types"

export const reviewKeys = {
  all: ["reviews"] as const,
  queue: (queue: ReviewQueue) => ["reviews", queue] as const,
}

export const replyKeys = {
  all: ["review-replies"] as const,
  queue: (queue: ReplyQueue) => ["review-replies", queue] as const,
}

export function useReviews(queue: ReviewQueue) {
  const api = useApi()
  return useQuery({
    queryKey: reviewKeys.queue(queue),
    queryFn: () => listReviews(api, queue),
  })
}

export function useApproveReview() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveReview(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      queryClient.invalidateQueries({ queryKey: ["branches"] })
    },
  })
}

export function useRejectReview() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; rejectionReason: RejectionReason }) =>
      rejectReview(api, vars.id, vars.rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      queryClient.invalidateQueries({ queryKey: ["branches"] })
    },
  })
}

export function useReplies(queue: ReplyQueue) {
  const api = useApi()
  return useQuery({
    queryKey: replyKeys.queue(queue),
    queryFn: () => listReplies(api, queue),
  })
}

export function useApproveReply() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveReply(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: replyKeys.all })
    },
  })
}

export function useRejectReply() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; rejectionReason: RejectionReason }) =>
      rejectReply(api, vars.id, vars.rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: replyKeys.all })
    },
  })
}
