import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useNavigate } from "react-router"

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { PLACE_TYPES } from "./labels"
import { useCreatePlace } from "./queries"
import type { PlaceType } from "./types"

export function NewPlaceDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<PlaceType>("restaurant")
  const create = useCreatePlace()
  const navigate = useNavigate()

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
        New place
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) create.reset()
        }}
      >
        <DialogContent>
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              create.mutate(
                { name: name.trim(), type },
                {
                  onSuccess: (place) => {
                    setOpen(false)
                    setName("")
                    void navigate(`/places/${place.id}`)
                  },
                }
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>New place</DialogTitle>
              <DialogDescription>
                Starts as a draft. Add a branch with its address and location next.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-place-name">Name</FieldLabel>
                <Input
                  id="new-place-name"
                  value={name}
                  maxLength={160}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Type</FieldLabel>
                <ToggleGroup
                  value={[type]}
                  onValueChange={(v) => v[0] && setType(v[0] as PlaceType)}
                  variant="outline"
                  spacing={1}
                  className="flex-wrap"
                >
                  {PLACE_TYPES.map((t) => (
                    <ToggleGroupItem key={t.value} value={t.value}>
                      {t.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </FieldGroup>
            <ApiErrorAlert error={create.error} title="Couldn't create the place" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || create.isPending}>
                {create.isPending ? <Spinner data-icon="inline-start" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
