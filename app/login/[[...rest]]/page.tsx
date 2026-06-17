import { SignIn } from "@clerk/nextjs"

// Catch-all so Clerk can handle its sub-routes (factor steps, OAuth callback).
// The sign-in URL is configured via NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login.
export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
      <SignIn fallbackRedirectUrl="/" />
    </div>
  )
}
