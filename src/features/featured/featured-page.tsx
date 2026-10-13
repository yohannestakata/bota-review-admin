import { MoreHorizontalIcon, StarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Link } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { useMe } from "@/app/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BranchAdder } from "@/features/collections/branch-adder"
import { TaxonPicker } from "@/features/places/taxon-picker"
import type { Branch, Taxon } from "@/features/places/types"

import {
  useCreatePlacement,
  usePlacementAction,
  usePlacements,
  type Placement,
} from "./queries"

const STATUS: Record<
  Placement["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  active: { label: "Running", variant: "default" },
  upcoming: { label: "Booked", variant: "secondary" },
  ended: { label: "Ended", variant: "outline" },
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

/** yyyy-mm-dd for a date input, in local time. */
const inputDate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

/**
 * Featured: places that pay to be shown first, on Home or at the top of a
 * cuisine's search. The app always labels them "Featured".
 */
export function FeaturedPage() {
  const placements = usePlacements()
  const action = usePlacementAction()
  const me = useMe()
  const isAdmin = me?.role === "admin"
  const [creating, setCreating] = useState(false)

  const run = (id: string, kind: "end" | "remove", done: string) =>
    action.mutate(
      { id, action: kind },
      {
        onSuccess: () => toast.add({ title: done, type: "success" }),
        onError: () =>
          toast.add({ title: "That didn't go through", type: "error" }),
      }
    )

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Featured</CardTitle>
          <CardDescription>
            Places that pay to be shown first: a Featured rail on Home, or the
            top of search for a cuisine. Always labelled “Featured” in the app.
            Shown and opened count only while each ran, and leave out staff and
            test accounts.
          </CardDescription>
          {isAdmin ? (
            <CardAction>
              <Button onClick={() => setCreating(true)}>Feature a place</Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <ApiErrorAlert
            error={placements.error}
            title="Couldn't load placements"
          />
          {placements.isPending ? (
            <Skeleton className="h-48" />
          ) : placements.data && placements.data.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={StarIcon}
                    strokeWidth={2}
                  />
                </EmptyMedia>
                <EmptyTitle>Nothing featured yet</EmptyTitle>
                <EmptyDescription>
                  When a business pays for a spot, feature them here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Place</TableHead>
                  <TableHead>Where</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Shown</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium whitespace-normal">
                      <Link to={`/places/${p.placeId}?branch=${p.branchId}`}>
                        {p.placeName} · {p.branchLabel}
                      </Link>
                      {p.note ? (
                        <p className="text-sm font-normal text-muted-foreground">
                          {p.note}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {p.slot === "home"
                        ? "Home"
                        : `Search: ${p.cuisineName ?? "—"}`}
                    </TableCell>
                    <TableCell>
                      {day(p.startsAt)} – {day(p.endsAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS[p.status].variant}>
                        {STATUS[p.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.shown.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.opened.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && p.status !== "ended" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Actions"
                              />
                            }
                          >
                            <HugeiconsIcon
                              aria-hidden="true"
                              icon={MoreHorizontalIcon}
                              strokeWidth={2}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => run(p.id, "end", "Ended")}
                              >
                                End now
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => run(p.id, "remove", "Removed")}
                              >
                                Cancel booking
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {creating ? (
        <NewPlacementDialog onClose={() => setCreating(false)} />
      ) : null}
    </div>
  )
}

function NewPlacementDialog({ onClose }: { onClose: () => void }) {
  const create = useCreatePlacement()
  const today = new Date()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [slot, setSlot] = useState<"home" | "search">("home")
  const [cuisine, setCuisine] = useState<Taxon | null>(null)
  const [starts, setStarts] = useState(inputDate(today))
  const [ends, setEnds] = useState(
    inputDate(new Date(today.getTime() + 30 * 86_400_000))
  )
  const [note, setNote] = useState("")

  // Whole days, local time: from the start of the first to the end of the last.
  const startsAt = new Date(`${starts}T00:00:00`)
  const endsAt = new Date(`${ends}T23:59:59`)
  const valid =
    branch !== null &&
    (slot === "home" || cuisine !== null) &&
    !Number.isNaN(startsAt.getTime()) &&
    endsAt > startsAt

  function save() {
    if (!branch || !valid) return
    create.mutate(
      {
        branchId: branch.id,
        slot,
        ...(slot === "search" && cuisine ? { cuisineId: cuisine.id } : {}),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.add({ title: "Featured", type: "success" })
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feature a place</DialogTitle>
          <DialogDescription>
            It shows with a “Featured” label for these dates.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Place</FieldLabel>
            {branch ? (
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {branch.place.name} · {branch.label}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBranch(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <BranchAdder exclude={new Set()} onAdd={setBranch} />
            )}
          </Field>
          <Field>
            <FieldLabel>Where</FieldLabel>
            <ToggleGroup
              value={[slot]}
              onValueChange={(v) => v[0] && setSlot(v[0] as "home" | "search")}
              variant="outline"
              spacing={1}
            >
              <ToggleGroupItem value="home">Home</ToggleGroupItem>
              <ToggleGroupItem value="search">Search</ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>
              {slot === "home"
                ? "A Featured rail on everyone's Home."
                : "First in search when someone picks or types this cuisine (at most two places)."}
            </FieldDescription>
          </Field>
          {slot === "search" ? (
            <Field>
              <FieldLabel htmlFor="featured-cuisine">Cuisine</FieldLabel>
              <TaxonPicker
                id="featured-cuisine"
                kind="cuisines"
                value={cuisine}
                onChange={setCuisine}
                placeholder="Pick a cuisine"
              />
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="featured-starts">From</FieldLabel>
              <Input
                id="featured-starts"
                type="date"
                value={starts}
                onChange={(e) => setStarts(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="featured-ends">Until (including)</FieldLabel>
              <Input
                id="featured-ends"
                type="date"
                value={ends}
                min={starts}
                onChange={(e) => setEnds(e.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="featured-note">Note</FieldLabel>
            <Textarea
              id="featured-note"
              rows={2}
              maxLength={500}
              value={note}
              placeholder="Who paid, how much, Telebirr reference…"
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <ApiErrorAlert error={create.error} title="Couldn't feature it" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || create.isPending} onClick={save}>
            Feature it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
