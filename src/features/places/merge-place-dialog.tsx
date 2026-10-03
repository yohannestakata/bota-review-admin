import { useState } from "react"
import { useNavigate } from "react-router"

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

import { useMergePlace, usePlaceSearch } from "./queries"
import type { PlaceDetail, PlaceListItem } from "./types"

const placeName = (p: PlaceListItem) => p.name

/**
 * Folds a duplicate place into its chain: its branches move to the chosen
 * place (renamed after the location in this place's name) and this one is
 * archived. `initialQuery` pre-fills the search, e.g. from the Fix list.
 */
export function MergePlaceDialog({
  place,
  open,
  onOpenChange,
  initialQuery = "",
}: {
  place: PlaceDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuery?: string
}) {
  const [q, setQ] = useState(initialQuery)
  const [target, setTarget] = useState<PlaceListItem | null>(null)
  const search = usePlaceSearch(q)
  const merge = useMergePlace(place.id)
  const navigate = useNavigate()
  const live = place.branches.filter((b) => b.status !== "archived").length
  const options = (search.data ?? []).filter((p) => p.id !== place.id)
  // From the Fix list, the chain's exact name is searched: pick it already.
  const selected =
    target ?? options.find((p) => p.name === initialQuery) ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (!selected) return
            merge.mutate(selected.id, {
              onSuccess: (result) => {
                onOpenChange(false)
                toast.add({
                  title: "Merged",
                  description: `${result.moved} ${result.moved === 1 ? "branch" : "branches"} moved to ${selected.name}`,
                  type: "success",
                })
                void navigate(`/places/${selected.id}`)
              },
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>Merge {place.name} into another place</DialogTitle>
            <DialogDescription>
              Use this when the same business was added twice. Its{" "}
              {live === 1 ? "branch moves" : `${live} branches move`} to the
              place you pick, with their reviews and photos, and this place is
              archived.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="merge-target">Merge into</FieldLabel>
            <Combobox
              items={options}
              value={selected}
              inputValue={q}
              onInputValueChange={setQ}
              onValueChange={(p: PlaceListItem | null) => setTarget(p)}
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
            <FieldDescription>
              Branches are renamed after the location in this place's name, like
              "Bole Millennium". Links keep working.
            </FieldDescription>
          </Field>
          <ApiErrorAlert error={merge.error} title="Couldn't merge" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selected || merge.isPending}>
              {merge.isPending ? <Spinner data-icon="inline-start" /> : null}
              Merge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
