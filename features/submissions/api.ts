import type { AxiosInstance } from "axios"

import type {
  ListSubmissionsParams,
  Paginated,
  Submission,
  SubmissionListItem,
} from "./types"

export async function listSubmissions(
  api: AxiosInstance,
  params: ListSubmissionsParams
): Promise<Paginated<SubmissionListItem>> {
  const response = await api.get<SubmissionListItem[]>("/admin/submissions", {
    params,
  })
  const total = Number(
    response.headers["x-total-count"] ?? response.data.length
  )
  return { data: response.data, total }
}

// Approving a field_correction applies its suggested value to the branch and
// records an audit entry (handled server-side).
export async function reviewSubmission(
  api: AxiosInstance,
  id: string
): Promise<Submission> {
  const { data } = await api.patch<Submission>(
    `/admin/submissions/${id}/review`
  )
  return data
}

export async function dismissSubmission(
  api: AxiosInstance,
  id: string,
  reason?: string
): Promise<Submission> {
  const { data } = await api.patch<Submission>(
    `/admin/submissions/${id}/dismiss`,
    reason ? { reason } : {}
  )
  return data
}
