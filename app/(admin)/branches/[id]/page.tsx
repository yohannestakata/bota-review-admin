import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import { BranchDetailView } from "@/features/branches"
import { getBranch } from "@/features/branches/api"
import { branchKeys } from "@/features/branches/keys"
import { serverApi } from "@/lib/server-api"

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const queryClient = new QueryClient()
  try {
    const api = await serverApi()
    await queryClient.prefetchQuery({
      queryKey: branchKeys.detail(id),
      queryFn: () => getBranch(api, id),
    })
  } catch {
    // Auth/role enforced by the layout; client refetches if prefetch fails.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BranchDetailView branchId={id} />
    </HydrationBoundary>
  )
}
