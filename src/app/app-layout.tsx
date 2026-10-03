import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Outlet, useLocation } from "react-router"

import { useDocumentTitle } from "@/hooks/use-document-title"

import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { AppSidebar } from "./app-sidebar"
import { CommandMenu, useCommandMenu } from "./command-menu"
import { NAV } from "./nav"

export function AppLayout() {
  const { pathname } = useLocation()
  const [commandOpen, setCommandOpen] = useCommandMenu()
  const current =
    NAV.find((item) =>
      "end" in item && item.end
        ? pathname === item.to
        : pathname.startsWith(item.to)
    )?.label ?? ""
  // List pages name the tab here; detail pages name it after the item.
  const isListPage = NAV.some((item) => item.to === pathname)
  useDocumentTitle(isListPage ? current : undefined)
  const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        >
          Skip to content
        </a>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <h1 className="font-heading font-medium">{current}</h1>
          <Button
            variant="outline"
            className="ml-auto text-muted-foreground"
            onClick={() => setCommandOpen(true)}
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={Search01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Go to…
            <KbdGroup>
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
        </header>
        <main
          id="main"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <Outlet />
        </main>
      </SidebarInset>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  )
}
