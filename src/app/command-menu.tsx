import { Store01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Spinner } from "@/components/ui/spinner"
import type { PlaceListItem } from "@/features/places/types"
import { useDebounced } from "@/hooks/use-debounced"
import { useApi } from "@/lib/api"

import { NAV } from "./nav"

function usePlaceSearch(q: string) {
  const api = useApi()
  return useQuery({
    queryKey: ["command-places", q],
    queryFn: async () =>
      (await api<PlaceListItem[]>("/admin/places", { query: { q, limit: 8 } }))
        .data,
    enabled: q.length >= 2,
    staleTime: 30_000,
  })
}

/** ⌘K / Ctrl+K: jump to a page or a place by name. */
export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const q = useDebounced(search.trim())
  const places = usePlaceSearch(q)

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

  const go = (to: string) => {
    onOpenChange(false)
    setSearch("")
    void navigate(to)
  }

  const pages = NAV.filter((item) =>
    item.label.toLowerCase().includes(search.trim().toLowerCase())
  )
  // Typing, waiting for the pause, or fetching: don't flash "Nothing matches".
  const typed = search.trim()
  const searching =
    typed.length >= 2 &&
    pages.length === 0 &&
    (typed !== q || places.isFetching)

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Go to"
      description="Jump to a page or a place"
    >
      {/* Places are matched by the API, so cmdk's own filtering is off. */}
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Go to a page or place…"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {searching ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <CommandEmpty>Nothing matches.</CommandEmpty>
          )}
          {pages.length > 0 ? (
            <CommandGroup heading="Pages">
              {pages.map((item) => (
                <CommandItem
                  key={item.to}
                  value={`page:${item.to}`}
                  onSelect={() => go(item.to)}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={item.icon}
                    strokeWidth={2}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {q.length >= 2 && places.data?.length ? (
            <CommandGroup heading="Places">
              {places.data.map((place) => (
                <CommandItem
                  key={place.id}
                  value={`place:${place.id}`}
                  onSelect={() => go(`/places/${place.id}`)}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={Store01Icon}
                    strokeWidth={2}
                  />
                  {place.name}
                  {place.branchCount > 1 ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {place.branchCount} branches
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

export function useCommandMenu() {
  return useState(false)
}
