import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import {
  listAmenities,
  listCuisines,
  listNeighborhoods,
  listTags,
  TaxonomyView,
  taxonomyKeys,
} from "@/features/taxonomy"
import { serverApi } from "@/lib/server-api"

export default async function TaxonomyPage() {
  const queryClient = new QueryClient()
  try {
    const api = await serverApi()
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: taxonomyKeys.list("cuisines"),
        queryFn: () => listCuisines(api),
      }),
      queryClient.prefetchQuery({
        queryKey: taxonomyKeys.list("tags"),
        queryFn: () => listTags(api),
      }),
      queryClient.prefetchQuery({
        queryKey: taxonomyKeys.list("amenities"),
        queryFn: () => listAmenities(api),
      }),
      queryClient.prefetchQuery({
        queryKey: taxonomyKeys.list("neighborhoods"),
        queryFn: () => listNeighborhoods(api),
      }),
    ])
  } catch {
    // Auth/role is enforced by the layout; if prefetch fails the client retries.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaxonomyView />
    </HydrationBoundary>
  )
}
