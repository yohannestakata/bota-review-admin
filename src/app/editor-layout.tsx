import { UserButton } from "@clerk/react"
import { Navigate, Outlet, useLocation } from "react-router"

import { useDocumentTitle } from "@/hooks/use-document-title"

/**
 * Editors curate data and nothing else: just the sheet, no sidebar. Any other
 * address takes them to it.
 */
export function EditorLayout() {
  const { pathname } = useLocation()
  useDocumentTitle("Sheet")

  if (!pathname.startsWith("/sheet")) return <Navigate to="/sheet" replace />

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <h1 className="font-heading font-medium">Bota data sheet</h1>
        <div className="ml-auto">
          <UserButton />
        </div>
      </header>
      <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
