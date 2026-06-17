import type { AxiosInstance } from "axios"

import type {
  ListSubmissionsParams,
  Submission,
  SubmissionListItem,
} from "./types"

export async function listSubmissions(
  api: AxiosInstance,
  params: ListSubmissionsParams
): Promise<SubmissionListItem[]> {
  const { data } = await api.get<SubmissionListItem[]>("/admin/submissions", {
    params,
  })
  return data
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
  id: string
): Promise<Submission> {
  const { data } = await api.patch<Submission>(
    `/admin/submissions/${id}/dismiss`
  )
  return data
}
