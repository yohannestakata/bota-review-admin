import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Button } from "@/components/ui/button"
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useDebounced } from "@/hooks/use-debounced"

import { useLookup } from "@/features/places/queries"
import type { PlaceType } from "@/features/places/types"

import { useAddRow, usePlaceMatches } from "./queries"

const NEW_PLACE = "new"

/**
 * Adds a row: a location of a place that's already in Bota, or a new place.
 * Typing the name shows places it may already be, so a chain's new branch
 * doesn't become a duplicate place.
 */
export function AddRowDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [placeChoice, setPlaceChoice] = useState(NEW_PLACE)
  const [pickedType, setType] = useState<PlaceType | null>(null)
  const [label, setLabel] = useState("")
  const [address, setAddress] = useState("")
  const [tried, setTried] = useState(false)
  const placeTypes = useLookup("place-types")
  const type = pickedType ?? placeTypes.active[0]?.id ?? ""
  const add = useAddRow()

  const q = useDebounced(name.trim())
  const found = usePlaceMatches(q).data
  const matches = (q.length >= 2 && found) || []
  const existing = matches.find((p) => p.id === placeChoice)
  // A match that's gone since (the name changed) falls back to a new place.
  const choice = existing ? existing.id : NEW_PLACE

  function reset() {
    setName("")
    setPlaceChoice(NEW_PLACE)
    setType(null)
    setLabel("")
    setAddress("")
    setTried(false)
    add.reset()
  }

  function submit() {
    if (add.isPending) return
    setTried(true)
    const missing = [
      !name.trim() && "place name",
      !label.trim() && "location name",
      !address.trim() && "address",
    ].filter(Boolean)
    if (missing.length) {
      toast.add({ title: `Add the ${missing.join(", ")}`, type: "error" })
      return
    }
    add.mutate(
      {
        place: existing ? { id: existing.id } : { name: name.trim(), type },
        label: label.trim(),
        addressText: address.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false)
          reset()
          toast.add({ title: "Row added as a draft", type: "success" })
          onAdded()
        },
      }
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <HugeiconsIcon
          aria-hidden="true"
          icon={Add01Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Add row
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DialogContent>
          <form
            className="flex flex-col gap-6"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <DialogHeader>
              <DialogTitle>Add row</DialogTitle>
              <DialogDescription>
                One location of a place. It starts as a draft; fill in the rest
                in the sheet.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="add-row-name">Place name</FieldLabel>
                <Input
                  id="add-row-name"
                  value={name}
                  maxLength={160}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={(tried && !name.trim()) || undefined}
                  autoFocus
                />
              </Field>
              {matches.length > 0 ? (
                <Field>
                  <FieldLabel>Already in Bota?</FieldLabel>
                  <ToggleGroup
                    value={[choice]}
                    onValueChange={(v) => v[0] && setPlaceChoice(v[0])}
                    variant="outline"
                    spacing={1}
                    className="flex-wrap"
                  >
                    <ToggleGroupItem value={NEW_PLACE}>
                      No, a new place
                    </ToggleGroupItem>
                    {matches.map((p) => (
                      <ToggleGroupItem key={p.id} value={p.id}>
                        {p.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldDescription>
                    {existing
                      ? `Adds another location of ${existing.name}.`
                      : "Pick the place if this is another of its locations."}
                  </FieldDescription>
                </Field>
              ) : null}
              {existing ? null : (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <ToggleGroup
                    value={[type]}
                    onValueChange={(v) => v[0] && setType(v[0] as PlaceType)}
                    variant="outline"
                    spacing={1}
                    className="flex-wrap"
                  >
                    {placeTypes.active.map((t) => (
                      <ToggleGroupItem key={t.id} value={t.id}>
                        {t.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="add-row-label">Location name</FieldLabel>
                <Input
                  id="add-row-label"
                  value={label}
                  maxLength={120}
                  placeholder="Bole, Main branch…"
                  onChange={(e) => setLabel(e.target.value)}
                  aria-invalid={(tried && !label.trim()) || undefined}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="add-row-address">Address</FieldLabel>
                <Input
                  id="add-row-address"
                  value={address}
                  maxLength={240}
                  onChange={(e) => setAddress(e.target.value)}
                  aria-invalid={(tried && !address.trim()) || undefined}
                />
              </Field>
            </FieldGroup>
            <ApiErrorAlert error={add.error} title="Couldn't add the row" />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {add.isPending ? <Spinner data-icon="inline-start" /> : null}
                Add row
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
