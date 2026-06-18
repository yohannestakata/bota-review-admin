"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import { listClaims, rejectClaim, verifyClaim } from "./api"
import type { ClaimStatus } from "./types"

export const claimKeys = {
  all: ["claims"] as const,
  list: (status?: ClaimStatus) => ["claims", "list", status ?? "all"] as const,
}

export function useClaims(status?: ClaimStatus) {
  const api = useApi()
  return useQuery({
    queryKey: claimKeys.list(status),
    queryFn: () => listClaims(api, status),
  })
}

export function useVerifyClaim() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => verifyClaim(api, id),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.all })
      queryClient.invalidateQueries({ queryKey: ["branches"] })
      queryClient.invalidateQueries({ queryKey: ["branches", claim.branchId] })
    },
  })
}

export function useRejectClaim() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; rejectionReason: string }) =>
      rejectClaim(api, vars.id, vars.rejectionReason),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.all })
      queryClient.invalidateQueries({ queryKey: ["branches"] })
      queryClient.invalidateQueries({ queryKey: ["branches", claim.branchId] })
    },
  })
}
