import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api"

import { HoursEditor, hoursComplete } from "@/features/places/hours-editor"
import { DAYS } from "@/features/places/labels"
import { useTaxonomy, type TaxonomyKind } from "@/features/places/queries"
import { TaxonPicker } from "@/features/places/taxon-picker"
import type { Hours, Taxon } from "@/features/places/types"

/** Tells them a save didn't go through, with the API's reasons if it gave any. */
export function saveFailed(error: unknown, what: string) {
  const fields =
    error instanceof ApiError && error.fields
      ? Object.values(error.fields)
          .map((f) => f.message)
          .join(" ")
      : ""
  toast.add({
    title: `Couldn't save ${what}`,
    description:
      fields || (error instanceof Error ? error.message : "Try again."),
    type: "error",
  })
}

/**
 * A text cell. Saves when you leave it or press Enter; Escape puts back what
 * was saved. A required cell left empty, or a save that fails, keeps what
 * was typed and rings red until it's fixed.
 */
export function TextCell({
  label,
  value,
  onSave,
  required,
  maxLength,
  placeholder,
  parse,
  className,
}: {
  /** What the cell holds, for screen readers and messages ("Address"). */
  label: string
  value: string
  onSave: (value: string) => Promise<unknown>
  required?: boolean
  maxLength?: number
  placeholder?: string
  /** Checks and reshapes the typed text; return an error message to refuse it. */
  parse?: (value: string) => { error: string } | { value: string }
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)
  // Follow saves from elsewhere (another row of the same place) when not mid-edit.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
    setInvalid(false)
  }

  async function commit() {
    const typed = draft.trim()
    if (typed === value.trim()) {
      setInvalid(false)
      return
    }
    if (required && !typed) {
      setInvalid(true)
      toast.add({ title: `${label} can't be empty`, type: "error" })
      return
    }
    const parsed = parse && typed ? parse(typed) : { value: typed }
    if ("error" in parsed) {
      setInvalid(true)
      toast.add({ title: parsed.error, type: "error" })
      return
    }
    try {
      await onSave(parsed.value)
      setInvalid(false)
    } catch (error) {
      setInvalid(true)
      saveFailed(error, label.toLowerCase())
    }
  }

  return (
    <Input
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={className}
      maxLength={maxLength}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
        if (e.key === "Escape") {
          setDraft(value)
          setInvalid(false)
          // Blurring after the reset saves nothing: it matches again.
          requestAnimationFrame(() => (e.target as HTMLInputElement).blur())
        }
      }}
    />
  )
}

/** A pick-one cell; saves as soon as something is picked. */
export function SelectCell<T extends string>({
  label,
  value,
  items,
  onSave,
  className,
}: {
  label: string
  value: T
  items: { value: T; label: string }[]
  onSave: (value: T) => Promise<unknown>
  className?: string
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next && next !== value)
          onSave(next as T).catch((error) =>
            saveFailed(error, label.toLowerCase())
          )
      }}
    >
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/** "9.0108, 38.7613" — the way Google Maps copies a dropped pin. */
export function parseCoordinates(text: string) {
  const parts = text
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number)
  const [lat, lng] = parts
  if (
    parts.length !== 2 ||
    lat === undefined ||
    lng === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return { error: "Paste the pin as “latitude, longitude”" }
  return { value: `${lat}, ${lng}` }
}

export function formatCoordinates(lat: string | null, lng: string | null) {
  return lat && lng ? `${Number(lat)}, ${Number(lng)}` : ""
}

/** "Mon–Sun 08:00–22:00", or each distinct stretch of days. */
function hoursSummary(hours: Hours | null) {
  if (!hours || !Object.values(hours).some((r) => r?.length)) return ""
  const text = (key: (typeof DAYS)[number]["key"]) =>
    (hours[key] ?? []).map(([a, b]) => `${a}–${b}`).join(", ") || "Closed"
  const runs: { from: string; to: string; text: string }[] = []
  for (const day of DAYS) {
    const t = text(day.key)
    const last = runs.at(-1)
    if (last && last.text === t) last.to = day.label.slice(0, 3)
    else
      runs.push({
        from: day.label.slice(0, 3),
        to: day.label.slice(0, 3),
        text: t,
      })
  }
  return runs
    .map((r) => `${r.from === r.to ? r.from : `${r.from}–${r.to}`} ${r.text}`)
    .join("; ")
}

/**
 * Opening hours. A week of them is a small form, so it opens in a dialog wide
 * enough for the branch editor's own hours editor (a popover from the cell
 * was too narrow and ran off the screen).
 */
export function HoursCell({
  label,
  value,
  onSave,
}: {
  /** Which row it is ("Tomoca · Piassa"), for the dialog's title. */
  label: string
  value: Hours | null
  onSave: (value: Hours) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Hours>(value ?? {})
  const [saving, setSaving] = useState(false)
  const summary = hoursSummary(value)

  async function save() {
    if (saving) return
    if (!hoursComplete(draft)) {
      toast.add({
        title: "Fill in every opening and closing time",
        type: "error",
      })
      return
    }
    setSaving(true)
    try {
      await onSave(draft)
      setOpen(false)
    } catch (error) {
      saveFailed(error, "hours")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start font-normal"
        aria-label={summary ? `Hours: ${summary}` : "Add hours"}
        onClick={() => {
          setDraft(value ?? {})
          setOpen(true)
        }}
      >
        <span
          className={summary ? "truncate" : "truncate text-muted-foreground"}
        >
          {summary || "Add hours"}
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Opening hours</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>
          <HoursEditor value={draft} onChange={setDraft} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()}>
              {saving ? <Spinner data-icon="inline-start" /> : null}
              Save hours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Keeps a pick on screen while it saves; follows the saved value again once
 * nothing is waiting, so quick picks in a row don't flicker.
 */
function usePendingValue<T>(value: T) {
  const [draft, setDraft] = useState(value)
  const [pending, setPending] = useState(0)
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue && pending === 0) {
    setLastValue(value)
    setDraft(value)
  }
  const save = (next: T, run: (next: T) => Promise<unknown>, what: string) => {
    setDraft(next)
    setPending((n) => n + 1)
    run(next)
      .catch((error) => {
        setDraft(value)
        saveFailed(error, what)
      })
      .finally(() => setPending((n) => n - 1))
  }
  return [draft, save] as const
}

/**
 * Pick several (cuisines, tags…). One line in the row, like every other cell;
 * the choices open as a searchable list, and each tick saves.
 */
export function TaxaCell({
  kind,
  label,
  value,
  onSave,
}: {
  kind: TaxonomyKind
  label: string
  value: Taxon[]
  onSave: (value: Taxon[]) => Promise<unknown>
}) {
  const [draft, save] = usePendingValue(value)
  const { data = [] } = useTaxonomy(kind)
  const chosen = new Set(draft.map((t) => t.id))
  // What's picked first, then the rest A to Z; retired ones only if picked.
  const options = [
    ...draft,
    ...data.filter((t) => t.status === "active" && !chosen.has(t.id)),
  ]
  const summary = draft.map((t) => t.name).join(", ")

  const toggle = (taxon: Taxon) =>
    save(
      chosen.has(taxon.id)
        ? draft.filter((t) => t.id !== taxon.id)
        : [...draft, taxon],
      onSave,
      label.toLowerCase()
    )

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-start font-normal"
            aria-label={
              summary ? `${label}: ${summary}` : `Add ${label.toLowerCase()}`
            }
          />
        }
      >
        <span
          className={summary ? "truncate" : "truncate text-muted-foreground"}
        >
          {summary || `Add ${label.toLowerCase()}`}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandGroup>
              {options.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.name} ${t.id}`}
                  data-checked={chosen.has(t.id)}
                  onSelect={() => toggle(t)}
                >
                  {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** Pick one (the area); saves as soon as it's picked or cleared. */
export function TaxonCell({
  kind,
  label,
  value,
  onSave,
}: {
  kind: TaxonomyKind
  label: string
  value: Taxon | null
  onSave: (value: Taxon | null) => Promise<unknown>
}) {
  const [draft, save] = usePendingValue(value)
  return (
    <TaxonPicker
      kind={kind}
      value={draft}
      onChange={(next) => {
        if (next?.id !== draft?.id) save(next, onSave, label.toLowerCase())
      }}
      placeholder={`Pick ${label.toLowerCase()}`}
    />
  )
}
