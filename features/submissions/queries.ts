"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import { dismissSubmission, listSubmissions, reviewSubmission } from "./api"
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

export function useReviewSubmission() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reviewSubmission(api, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
  })
}

export function useDismissSubmission() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dismissSubmission(api, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
  })
}
