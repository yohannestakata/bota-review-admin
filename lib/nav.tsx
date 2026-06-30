import {
  Building2Icon,
  ImageIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  MapPinnedIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  StarIcon,
  StoreIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import type { UserRole } from "@/features/auth"

export type NavItem = {
  title: string
  url: string
  icon: ReactNode
  roles?: UserRole[]
}
export type NavGroup = { label: string; items: NavItem[] }

// Single source of truth for the admin information architecture. The sidebar
// renders these groups; the header derives the current section title from them.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Manage",
    items: [
      { title: "Overview", url: "/", icon: <LayoutDashboardIcon /> },
      { title: "Submissions", url: "/submissions", icon: <InboxIcon /> },
      { title: "Branches", url: "/branches", icon: <StoreIcon /> },
      { title: "Places", url: "/places", icon: <Building2Icon /> },
    ],
  },
  {
    label: "Moderation",
    items: [
      { title: "Reviews", url: "/reviews", icon: <StarIcon /> },
      {
        title: "Review replies",
        url: "/review-replies",
        icon: <MessageSquareIcon />,
      },
      { title: "Photos", url: "/photos", icon: <ImageIcon /> },
      {
        title: "Business claims",
        url: "/claims",
        icon: <ShieldCheckIcon />,
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Collections", url: "/collections", icon: <LayoutGridIcon /> },
      { title: "Taxonomy", url: "/taxonomy", icon: <TagsIcon /> },
      {
        title: "Neighborhoods",
        url: "/neighborhoods",
        icon: <MapPinnedIcon />,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Users", url: "/users", icon: <UsersIcon />, roles: ["admin"] },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

export function filterNavGroupsForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || item.roles.includes(role)
    ),
  })).filter((group) => group.items.length > 0)
}

export function isNavItemActive(itemUrl: string, pathname: string): boolean {
  if (itemUrl === "/") return pathname === "/"
  return pathname === itemUrl || pathname.startsWith(`${itemUrl}/`)
}

export function titleForPath(pathname: string): string {
  const exact = NAV_ITEMS.find((item) => item.url === pathname)
  if (exact) return exact.title
  const nested = NAV_ITEMS.filter((item) => item.url !== "/").find((item) =>
    pathname.startsWith(item.url)
  )
  return nested?.title ?? "Overview"
}
