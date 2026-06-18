"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  dismissSubmission,
  getSubmission,
  listSubmissions,
  reviewSubmission,
} from "./api"
import { submissionKeys } from "./keys"
import type { ListSubmissionsParams } from "./types"

export function useSubmissions(params: ListSubmissionsParams) {
  const api = useApi()
  return useQuery({
    queryKey: submissionKeys.list(params),
    queryFn: () => listSubmissions(api, params),
    placeholderData: keepPreviousData,
  })
}

// Pending submissions attached to a single branch — drives the branch detail
// aside. Fetches a generous page so the aside shows the full queue.
export function useBranchSubmissions(branchId: string) {
  const api = useApi()
  const params = { branchId, status: "pending" as const, page: 1, limit: 100 }
  return useQuery({
    queryKey: submissionKeys.list(params),
    queryFn: () => listSubmissions(api, params),
  })
}

export function useSubmission(id: string | null) {
  const api = useApi()
  return useQuery({
    queryKey: id ? ["submissions", "detail", id] : ["submissions", "detail"],
    queryFn: () => getSubmission(api, id ?? ""),
    enabled: Boolean(id),
  })
}

export function useReviewSubmission() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; note?: string }) =>
      reviewSubmission(api, vars.id, vars.note),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
  })
}

export function useDismissSubmission() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; reason?: string }) =>
      dismissSubmission(api, vars.id, vars.reason),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
  })
}
