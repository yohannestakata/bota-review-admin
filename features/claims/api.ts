import type { AxiosInstance } from "axios"

import type { AdminClaim, ClaimStatus } from "./types"

export async function listClaims(
  api: AxiosInstance,
  status?: ClaimStatus
): Promise<AdminClaim[]> {
  const { data } = await api.get<AdminClaim[]>("/admin/claims", {
    params: { status },
  })
  return data
}

export async function verifyClaim(
  api: AxiosInstance,
  id: string
): Promise<AdminClaim> {
  const { data } = await api.patch<AdminClaim>(`/admin/claims/${id}/verify`)
  return data
}

export async function rejectClaim(
  api: AxiosInstance,
  id: string,
  rejectionReason: string
): Promise<AdminClaim> {
  const { data } = await api.patch<AdminClaim>(`/admin/claims/${id}/reject`, {
    rejectionReason,
  })
  return data
}
