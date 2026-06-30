"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  archiveBranch,
  createBranch,
  getBranch,
  listBranches,
  publishBranch,
  unpublishBranch,
  updateBranch,
} from "./api"
import { branchKeys } from "./keys"
import type {
  CreateBranchBody,
  ListBranchesParams,
  UpdateBranchBody,
} from "./types"

export function useBranches(params: ListBranchesParams) {
  const api = useApi()
  return useQuery({
    queryKey: branchKeys.list(params),
    queryFn: () => listBranches(api, params),
    placeholderData: keepPreviousData,
  })
}

export function useBranch(id: string) {
  const api = useApi()
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => getBranch(api, id),
  })
}

export function useCreateBranch() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateBranchBody) => createBranch(api, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

export function useSaveBranch(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateBranchBody) => updateBranch(api, id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(id) })
    },
  })
}

function useBranchMutation(
  action: (api: ReturnType<typeof useApi>, id: string) => Promise<unknown>
) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => action(api, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: branchKeys.all }),
  })
}

export function usePublishBranch() {
  return useBranchMutation(publishBranch)
}

export function useUnpublishBranch() {
  return useBranchMutation(unpublishBranch)
}

export function useArchiveBranch() {
  return useBranchMutation(archiveBranch)
}
