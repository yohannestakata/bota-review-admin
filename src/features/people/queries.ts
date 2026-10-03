import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/api"
import { toPage } from "@/lib/paginated"

export type Role = "user" | "editor" | "admin" | "business_owner"
export type TrustLevel = "new" | "trusted" | "flagged"
export type UserStatus = "active" | "suspended"

export type User = {
  id: string
  email: string | null
  displayName: string
  avatarUrl: string | null
  role: Role
  trustLevel: TrustLevel
  status: UserStatus
  createdAt: string
}

export const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "user", label: "Member", description: "Writes reviews and adds photos." },
  { value: "business_owner", label: "Business owner", description: "Can reply as their business." },
  { value: "editor", label: "Editor", description: "Has editing rights in the API, but only admins can sign in here." },
  { value: "admin", label: "Admin", description: "Everything, including people and settings." },
]

export const TRUST: { value: TrustLevel; label: string; description: string }[] = [
  { value: "new", label: "New", description: "Posts wait for review until 3 are approved." },
  { value: "trusted", label: "Trusted", description: "Posts go live right away." },
  { value: "flagged", label: "Flagged", description: "Posts wait for review, and trust takes longer to earn." },
]

const PAGE_SIZE = 25

export function useUsers(params: { q: string; role?: Role; status?: UserStatus; trustLevel?: TrustLevel; page: number }) {
  const api = useApi()
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () =>
      toPage(await api<User[]>("/admin/users", { query: { ...params, limit: PAGE_SIZE } }), params.page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })
}

export function useUserAction() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input:
        | { id: string; action: "role"; role: Role }
        | { id: string; action: "trust"; trustLevel: TrustLevel }
        | { id: string; action: "suspend" | "reinstate" }
    ) => {
      const base = `/admin/users/${input.id}`
      switch (input.action) {
        case "role":
          return api(`${base}/role`, { method: "PATCH", body: { role: input.role } })
        case "trust":
          return api(`${base}/trust-level`, { method: "PATCH", body: { trustLevel: input.trustLevel } })
        default:
          return api(`${base}/${input.action}`, { method: "PATCH" })
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })
}
