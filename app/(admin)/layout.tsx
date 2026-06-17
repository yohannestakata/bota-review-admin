import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getMe, isAdminRole } from "@/features/auth"
import { apiErrorMessage } from "@/lib/api-client"
import { serverApi } from "@/lib/server-api"

// Auth-gated and per-user, so never statically prerendered.
export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware guarantees a signed-in user; here we additionally require an
  // editor/admin role (the source of truth is the backend user record).
  let allowed = false
  try {
    const api = await serverApi()
    const me = await getMe(api)
    allowed = isAdminRole(me.role)
    if (!allowed) {
      console.warn(`[admin gate] denied: role="${me.role}" is not editor/admin`)
    }
  } catch (error) {
    // A failure here usually means the backend rejected the token (e.g. the
    // admin origin isn't in CLERK_AUTHORIZED_PARTIES), not a role denial.
    console.error(`[admin gate] /me request failed: ${apiErrorMessage(error)}`)
    allowed = false
  }
  if (!allowed) {
    redirect("/unauthorized")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
