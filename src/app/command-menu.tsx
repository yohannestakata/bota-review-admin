import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { NAV } from "./nav"

/** ⌘K / Ctrl+K: jump anywhere. */
export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Go to">
      <CommandInput placeholder="Go to…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        <CommandGroup heading="Pages">
          {NAV.map((item) => (
            <CommandItem
              key={item.to}
              onSelect={() => {
                onOpenChange(false)
                void navigate(item.to)
              }}
            >
              <HugeiconsIcon icon={item.icon} strokeWidth={2} />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandMenu() {
  return useState(false)
}
