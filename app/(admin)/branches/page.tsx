import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"

import { BranchesView } from "@/features/branches"
import { listBranches } from "@/features/branches/api"
import { BRANCHES_PAGE_SIZE, branchKeys } from "@/features/branches/keys"
import type { BranchStatus } from "@/features/branches/types"
import { serverApi } from "@/lib/server-api"

const VALID_STATUS: BranchStatus[] = ["draft", "published", "archived"]

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const status = VALID_STATUS.includes(sp.status as BranchStatus)
    ? (sp.status as BranchStatus)
    : undefined

  // Prefetch the first page on the server so the client renders real data
  // immediately (no skeleton); later pages/search fetch on the client.
  const params = { status, q: undefined, page: 1, limit: BRANCHES_PAGE_SIZE }
  const queryClient = new QueryClient()
  try {
    const api = await serverApi()
    await queryClient.prefetchQuery({
      queryKey: branchKeys.list(params),
      queryFn: () => listBranches(api, params),
    })
  } catch {
    // Auth/role is enforced by the layout; if prefetch fails the client retries.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <BranchesView />
      </Suspense>
    </HydrationBoundary>
  )
}
