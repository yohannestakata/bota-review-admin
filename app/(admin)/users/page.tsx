import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import { listUsers, UsersView } from "@/features/users"
import { USERS_PAGE_SIZE, userKeys } from "@/features/users/keys"
import { serverApi } from "@/lib/server-api"

export default async function UsersPage() {
  const params = { page: 1, limit: USERS_PAGE_SIZE }
  const queryClient = new QueryClient()
  try {
    const api = await serverApi()
    await queryClient.prefetchQuery({
      queryKey: userKeys.list(params),
      queryFn: () => listUsers(api, params),
    })
  } catch {
    // Auth/role is enforced by the layout; if prefetch fails the client retries.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersView />
    </HydrationBoundary>
  )
}
