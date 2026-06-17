export type UserRole = "user" | "editor" | "admin" | "business_owner"

// The signed-in user's own record (GET /me).
export type CurrentUser = {
  id: string
  clerkId: string
  role: UserRole
  trustLevel: string
  status: "active" | "suspended"
}

const ADMIN_ROLES: UserRole[] = ["editor", "admin"]

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}
