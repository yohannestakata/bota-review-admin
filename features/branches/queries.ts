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
  getBranch,
  listBranches,
  publishBranch,
  unpublishBranch,
  updateBranch,
  updatePlace,
} from "./api"
import { branchKeys } from "./keys"
import type {
  ListBranchesParams,
  UpdateBranchBody,
  UpdatePlaceBody,
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

// Saves place fields (name/type/description) and branch fields in one go.
export function useSaveBranch(id: string, placeId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: {
      place: UpdatePlaceBody
      branch: UpdateBranchBody
    }) => {
      if (Object.keys(vars.place).length > 0) {
        await updatePlace(api, placeId, vars.place)
      }
      return updateBranch(api, id, vars.branch)
    },
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
