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

export async function getSubmission(
  api: AxiosInstance,
  id: string
): Promise<Submission> {
  const { data } = await api.get<Submission>(`/admin/submissions/${id}`)
  return data
}

// Approving applies the submission server-side: a field_correction writes its
// value to the branch; a place_missing creates a draft place + branch (attached
// to `placeId` when deduping against an existing place, otherwise brand-new).
export async function reviewSubmission(
  api: AxiosInstance,
  id: string,
  note?: string,
  placeId?: string
): Promise<Submission> {
  const { data } = await api.patch<Submission>(
    `/admin/submissions/${id}/review`,
    {
      ...(note ? { note } : {}),
      ...(placeId ? { placeId } : {}),
    }
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
