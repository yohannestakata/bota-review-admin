import { SignIn, useAuth, useClerk } from "@clerk/react"
import { useQuery } from "@tanstack/react-query"
import { Outlet } from "react-router"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { ApiError, useApi } from "@/lib/api"

type AuthCheck = { ok: true; user: { id: string; role: string } }

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      {children}
    </div>
  )
}

/**
 * Signed out → Clerk sign-in. Signed in → the API confirms the account is an
 * admin before anything else loads.
 */
export function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const api = useApi()
  const check = useQuery({
    queryKey: ["auth-check"],
    queryFn: async () => (await api<AuthCheck>("/admin/auth-check")).data,
    enabled: isLoaded && isSignedIn === true,
    retry: false,
    staleTime: 5 * 60_000,
  })

  if (!isLoaded || (isSignedIn && check.isPending)) {
    return (
      <FullScreen>
        <Spinner />
      </FullScreen>
    )
  }

  if (!isSignedIn) {
    return (
      <FullScreen>
        <SignIn routing="hash" />
      </FullScreen>
    )
  }

  if (check.isError) {
    const forbidden =
      check.error instanceof ApiError && check.error.status === 403
    return (
      <FullScreen>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {forbidden ? "This account isn't an admin" : "Can't reach Bota"}
            </EmptyTitle>
            <EmptyDescription>
              {forbidden
                ? "Sign in with an admin account to continue."
                : "Check that the API is running, then try again."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {forbidden ? (
              <Button variant="outline" onClick={() => void signOut()}>
                Sign out
              </Button>
            ) : (
              <Button onClick={() => void check.refetch()}>Try again</Button>
            )}
          </EmptyContent>
        </Empty>
      </FullScreen>
    )
  }

  return <Outlet />
}
