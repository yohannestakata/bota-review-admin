import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import { ClaimsView } from "@/features/claims"
import { listClaims } from "@/features/claims/api"
import { serverApi } from "@/lib/server-api"

export default async function ClaimsPage() {
  // Prefetch the default "pending" tab so the client renders real data
  // immediately (no skeleton); other tabs fetch on the client.
  const queryClient = new QueryClient()
  try {
    const api = await serverApi()
    await queryClient.prefetchQuery({
      queryKey: ["claims", "list", "pending"],
      queryFn: () => listClaims(api, "pending"),
    })
  } catch {
    // Auth/role is enforced by the layout; if prefetch fails the client retries.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClaimsView />
    </HydrationBoundary>
  )
}
