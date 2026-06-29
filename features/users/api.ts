import type { AxiosInstance } from "axios"

import type {
  AdminUser,
  ListUsersParams,
  Paginated,
  UserRole,
  UserTrustLevel,
} from "./types"

export async function listUsers(
  api: AxiosInstance,
  params: ListUsersParams
): Promise<Paginated<AdminUser>> {
  const response = await api.get<AdminUser[]>("/admin/users", { params })
  const total = Number(
    response.headers["x-total-count"] ?? response.data.length
  )
  return { data: response.data, total }
}

export async function updateUserRole(
  api: AxiosInstance,
  id: string,
  role: UserRole
): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}/role`, {
    role,
  })
  return data
}

export async function updateUserTrustLevel(
  api: AxiosInstance,
  id: string,
  trustLevel: UserTrustLevel
): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(
    `/admin/users/${id}/trust-level`,
    { trustLevel }
  )
  return data
}

export async function suspendUser(
  api: AxiosInstance,
  id: string
): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}/suspend`)
  return data
}

export async function reinstateUser(
  api: AxiosInstance,
  id: string
): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}/reinstate`)
  return data
}
