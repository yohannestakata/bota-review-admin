import { SignOutButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No admin access</h1>
      <p className="max-w-md text-muted-foreground">
        Your account isn&apos;t an editor or admin. Ask an existing admin to
        grant you access, then sign in again.
      </p>
      <SignOutButton redirectUrl="/login">
        <Button variant="outline">Sign out</Button>
      </SignOutButton>
    </div>
  )
}
