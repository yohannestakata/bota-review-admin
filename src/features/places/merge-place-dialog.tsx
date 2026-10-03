import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { useMergePlace, usePlace, usePlaceSearch } from "./queries"
import type { PlaceBranchSummary, PlaceListItem } from "./types"

const NEW = "new"
// Branches this close are almost certainly the same venue.
const SAME_SPOT_M = 150

function metres(a: PlaceBranchSummary, b: PlaceBranchSummary) {
  if (!a.latitude || !a.longitude || !b.latitude || !b.longitude)
    return Infinity
  const dy = (Number(a.latitude) - Number(b.latitude)) * 111320
  const dx = (Number(a.longitude) - Number(b.longitude)) * 109950
  return Math.sqrt(dx * dx + dy * dy)
}

const placeName = (p: PlaceListItem) => p.name

/**
 * Merges two places that are one business: choose which to keep, then for
 * each branch of the other, whether it's a new branch of the kept place or
 * the same as one of its existing branches (whose reviews, photos and saves
 * it then joins).
 */
export function MergePlaceDialog({
  placeId,
  open,
  onOpenChange,
  initialTargetId,
  initialQuery = "",
  onMerged,
}: {
  placeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The place it duplicates, when already known (from the Fix list). */
  initialTargetId?: string
  initialQuery?: string
  onMerged?: (keptPlaceId: string) => void
}) {
  const [q, setQ] = useState(initialQuery)
  const [picked, setPicked] = useState<PlaceListItem | null>(null)
  const [keepThis, setKeepThis] = useState(false)
  // Choices the admin changed; the rest follow the defaults below.
  const [choices, setChoices] = useState<Record<string, string>>({})
  const search = usePlaceSearch(initialTargetId ? "" : q)
  const options = (search.data ?? []).filter((p) => p.id !== placeId)
  const otherId =
    initialTargetId ??
    picked?.id ??
    options.find((p) => p.name === initialQuery)?.id
  const self = usePlace(placeId)
  const other = usePlace(otherId)
  const merge = useMergePlace()

  const keep = keepThis ? self.data : other.data
  const away = keepThis ? other.data : self.data
  const keepBranches =
    keep?.branches.filter((b) => b.status !== "archived") ?? []
  const awayBranches =
    away?.branches.filter((b) => b.status !== "archived") ?? []

  const choiceFor = (branch: PlaceBranchSummary) => {
    const chosen = choices[branch.id]
    if (chosen && (chosen === NEW || keepBranches.some((k) => k.id === chosen)))
      return chosen
    const nearest = [...keepBranches].sort(
      (x, y) => metres(branch, x) - metres(branch, y)
    )[0]
    return nearest && metres(branch, nearest) < SAME_SPOT_M ? nearest.id : NEW
  }

  const branchOptions = [
    { value: NEW, label: "Add as a new branch" },
    ...keepBranches.map((k) => ({ value: k.id, label: `Same as ${k.label}` })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (!keep || !away) return
            merge.mutate(
              {
                sourceId: away.id,
                intoPlaceId: keep.id,
                branches: awayBranches.map((b) => {
                  const choice = choiceFor(b)
                  return {
                    branchId: b.id,
                    intoBranchId: choice === NEW ? null : choice,
                  }
                }),
              },
              {
                onSuccess: (result) => {
                  onOpenChange(false)
                  toast.add({
                    title: `Merged into ${keep.name}`,
                    description: [
                      result.moved
                        ? `${result.moved} new ${result.moved === 1 ? "branch" : "branches"}`
                        : "",
                      result.merged
                        ? `${result.merged} joined existing ${result.merged === 1 ? "branch" : "branches"}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(", "),
                    type: "success",
                  })
                  onMerged?.(keep.id)
                },
              }
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>Merge duplicate places</DialogTitle>
            <DialogDescription>
              For one business added twice. The other place is archived; links
              keep working.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            {initialTargetId ? null : (
              <Field>
                <FieldLabel htmlFor="merge-target">Duplicate of</FieldLabel>
                <Combobox
                  items={options}
                  value={picked}
                  inputValue={q}
                  onInputValueChange={setQ}
                  onValueChange={(p: PlaceListItem | null) => setPicked(p)}
                  itemToStringLabel={placeName}
                  filter={null}
                >
                  <ComboboxInput
                    id="merge-target"
                    placeholder="Search places…"
                    showTrigger={false}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>
                      {q.trim().length < 2
                        ? "Type at least 2 letters."
                        : search.isFetching
                          ? "Searching…"
                          : "No places match."}
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(p: PlaceListItem) => (
                        <ComboboxItem key={p.id} value={p}>
                          {p.name} · {p.branchCount}{" "}
                          {p.branchCount === 1 ? "branch" : "branches"}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            )}

            {self.data && other.data ? (
              <>
                <Field>
                  <FieldLabel>Keep</FieldLabel>
                  <ToggleGroup
                    value={[keepThis ? "this" : "other"]}
                    onValueChange={(v) => v[0] && setKeepThis(v[0] === "this")}
                    variant="outline"
                    spacing={1}
                    className="flex-wrap"
                  >
                    <ToggleGroupItem value="other">
                      {other.data.name}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="this">
                      {self.data.name}
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <FieldDescription>
                    Usually the one with the plain chain name.
                  </FieldDescription>
                </Field>

                <FieldSet>
                  <FieldLegend variant="label">
                    {away?.name}'s branches
                  </FieldLegend>
                  <FieldDescription>
                    A new branch of {keep?.name}, or the same spot as one it
                    already has (its reviews and photos join that branch).
                  </FieldDescription>
                  <FieldGroup>
                    {awayBranches.map((branch) => (
                      <Field key={branch.id} orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{branch.label}</FieldTitle>
                          <FieldDescription>
                            {branch.addressText}
                          </FieldDescription>
                        </FieldContent>
                        <Select
                          items={branchOptions}
                          value={choiceFor(branch)}
                          onValueChange={(value) =>
                            value &&
                            setChoices((prev) => ({
                              ...prev,
                              [branch.id]: String(value),
                            }))
                          }
                        >
                          <SelectTrigger
                            aria-label={`What ${branch.label} becomes`}
                            className="w-56"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {branchOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    ))}
                  </FieldGroup>
                </FieldSet>
              </>
            ) : otherId ? (
              <Skeleton className="h-40" />
            ) : null}
          </FieldGroup>

          <ApiErrorAlert error={merge.error} title="Couldn't merge" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!keep || !away || merge.isPending}>
              {merge.isPending ? <Spinner data-icon="inline-start" /> : null}
              Merge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
