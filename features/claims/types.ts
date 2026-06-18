export type ClaimStatus = "pending" | "verified" | "rejected"

export type ClaimContactRole = "owner" | "manager" | "marketing"

export type AdminClaim = {
  id: string
  branchId: string
  claimantUserId: string
  contactName: string
  contactRole: ClaimContactRole
  contactPhone: string
  contactEmail: string
  note: string | null
  status: ClaimStatus
  rejectionReason: string | null
  reviewedByUserId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  branch: {
    id: string
    label: string
    slug: string
    verificationStatus: string
  }
  claimant: {
    id: string
    displayName: string | null
    email: string | null
    role: string
    trustLevel: string
  }
}
