import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import { getPlace, PlaceDetailView } from "@/features/places"
import { placeKeys } from "@/features/places/keys"
import { serverApi } from "@/lib/server-api"

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const queryClient = new QueryClient()
  try {
    const api = await serverApi()
    await queryClient.prefetchQuery({
      queryKey: placeKeys.detail(id),
      queryFn: () => getPlace(api, id),
    })
  } catch {
    // Auth/role is enforced by the layout; if prefetch fails the client retries.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlaceDetailView placeId={id} />
    </HydrationBoundary>
  )
}
