import { UserButton } from "@clerk/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { NavLink, useLocation } from "react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useInbox } from "@/features/inbox/queries"

import { NAV } from "./nav"

export function AppSidebar() {
  const { pathname } = useLocation()
  const inbox = useInbox()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<NavLink to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary font-heading font-semibold text-primary-foreground">
                B
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Bota</span>
                <span className="text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active =
                  "end" in item && item.end
                    ? pathname === item.to
                    : pathname.startsWith(item.to)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<NavLink to={item.to} />}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.to === "/" && inbox.total > 0 ? (
                      <SidebarMenuBadge>{inbox.total}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
