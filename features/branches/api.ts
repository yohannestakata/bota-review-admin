import type { AxiosInstance } from "axios"

import type {
  AdminBranch,
  CreateBranchBody,
  ListBranchesParams,
  Paginated,
  UpdateBranchBody,
} from "./types"

export async function listBranches(
  api: AxiosInstance,
  params: ListBranchesParams
): Promise<Paginated<AdminBranch>> {
  // Pagination lives in headers; the body is the page array.
  const response = await api.get<AdminBranch[]>("/admin/branches", { params })
  const total = Number(
    response.headers["x-total-count"] ?? response.data.length
  )
  return { data: response.data, total }
}

export async function getBranch(
  api: AxiosInstance,
  id: string
): Promise<AdminBranch> {
  const { data } = await api.get<AdminBranch>(`/admin/branches/${id}`)
  return data
}

export async function createBranch(
  api: AxiosInstance,
  body: CreateBranchBody
): Promise<AdminBranch> {
  const { data } = await api.post<AdminBranch>("/admin/branches", body)
  return data
}

export async function updateBranch(
  api: AxiosInstance,
  id: string,
  body: UpdateBranchBody
) {
  const { data } = await api.patch<AdminBranch>(`/admin/branches/${id}`, body)
  return data
}

export async function publishBranch(api: AxiosInstance, id: string) {
  const { data } = await api.patch<AdminBranch>(`/admin/branches/${id}/publish`)
  return data
}

export async function unpublishBranch(api: AxiosInstance, id: string) {
  const { data } = await api.patch<AdminBranch>(
    `/admin/branches/${id}/unpublish`
  )
  return data
}

export async function archiveBranch(api: AxiosInstance, id: string) {
  const { data } = await api.delete<AdminBranch>(`/admin/branches/${id}`)
  return data
}
