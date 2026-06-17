import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"

import { SubmissionsView } from "@/features/submissions"
import { listSubmissions } from "@/features/submissions/api"
import {
  SUBMISSIONS_PAGE_SIZE,
  submissionKeys,
} from "@/features/submissions/keys"
import type {
  SubmissionStatus,
  SubmissionType,
} from "@/features/submissions/types"
import { serverApi } from "@/lib/server-api"

const VALID_STATUS: SubmissionStatus[] = ["pending", "reviewed", "dismissed"]
const VALID_TYPE: SubmissionType[] = [
  "field_correction",
  "place_missing",
  "temporarily_closed",
  "permanently_closed",
]

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const sp = await searchParams
  const status: SubmissionStatus = VALID_STATUS.includes(
    sp.status as SubmissionStatus
  )
    ? (sp.status as SubmissionStatus)
    : "pending"
  const type = VALID_TYPE.includes(sp.type as SubmissionType)
    ? (sp.type as SubmissionType)
    : undefined

  // Prefetch the first page on the server so the client renders real data
  // immediately (no skeleton); later pages/filters fetch on the client.
  const params = {
    status,
    type,
    q: undefined,
    page: 1,
    limit: SUBMISSIONS_PAGE_SIZE,
  }
  const queryClient = new QueryClient()
  try {
    const api = await serverApi()
    await queryClient.prefetchQuery({
      queryKey: submissionKeys.list(params),
      queryFn: () => listSubmissions(api, params),
    })
  } catch {
    // Auth/role is enforced by the layout; if prefetch fails the client retries.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <SubmissionsView />
      </Suspense>
    </HydrationBoundary>
  )
}
