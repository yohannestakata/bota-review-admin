export type UserRole = "user" | "editor" | "admin" | "business_owner"
export type UserTrustLevel = "new" | "trusted" | "flagged"
export type UserStatus = "active" | "suspended"

export type AdminUser = {
  id: string
  clerkId: string
  email: string | null
  displayName: string
  avatarUrl: string | null
  role: UserRole
  trustLevel: UserTrustLevel
  consecutiveApprovals: number
  status: UserStatus
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ListUsersParams = {
  q?: string
  role?: UserRole
  trustLevel?: UserTrustLevel
  status?: UserStatus
  page?: number
  limit?: number
}

export type Paginated<T> = { data: T[]; total: number }
