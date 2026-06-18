"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  approvePhoto,
  assignCover,
  listBranchPhotos,
  listPendingPhotos,
  rejectPhoto,
  uploadBranchPhoto,
} from "./api"
import type { PhotoCategory } from "./types"

export const photoKeys = {
  pending: ["photos", "pending"] as const,
  branch: (id: string) => ["photos", "branch", id] as const,
}

export function useBranchPhotos(branchId: string) {
  const api = useApi()
  return useQuery({
    queryKey: photoKeys.branch(branchId),
    queryFn: () => listBranchPhotos(api, branchId),
  })
}

export function usePendingPhotos() {
  const api = useApi()
  return useQuery({
    queryKey: photoKeys.pending,
    queryFn: () => listPendingPhotos(api),
  })
}

export function useUploadBranchPhoto(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { file: File; category: PhotoCategory }) =>
      uploadBranchPhoto(api, branchId, vars.file, vars.category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.branch(branchId) })
      queryClient.invalidateQueries({ queryKey: ["branches"] })
    },
  })
}

export function useAssignCover(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photoId: string) => assignCover(api, branchId, photoId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: photoKeys.branch(branchId) }),
  })
}

export function useApprovePhoto() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approvePhoto(api, id),
    onSuccess: (photo) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.pending })
      queryClient.invalidateQueries({
        queryKey: photoKeys.branch(photo.branchId),
      })
    },
  })
}

export function useRejectPhoto() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rejectPhoto(api, id),
    onSuccess: (photo) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.pending })
      queryClient.invalidateQueries({
        queryKey: photoKeys.branch(photo.branchId),
      })
    },
  })
}
