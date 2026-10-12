import {
  ChartLineData01Icon,
  InboxIcon,
  Layers01Icon,
  Settings02Icon,
  Store01Icon,
  UserGroupIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"

export const NAV = [
  { to: "/", label: "Inbox", icon: InboxIcon, end: true },
  { to: "/growth", label: "Growth", icon: ChartLineData01Icon },
  { to: "/places", label: "Places", icon: Store01Icon },
  { to: "/fix", label: "Fix list", icon: Wrench01Icon },
  { to: "/collections", label: "Collections", icon: Layers01Icon },
  { to: "/people", label: "People", icon: UserGroupIcon },
  { to: "/settings", label: "Settings", icon: Settings02Icon },
] as const
