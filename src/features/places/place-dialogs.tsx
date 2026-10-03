import { useState } from "react"
import { useNavigate } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { PLACE_TYPES } from "./labels"
import { useArchivePlace, useCreateBranch, useUpdatePlace } from "./queries"
import type { PlaceDetail, PlaceType } from "./types"

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

export function EditPlaceDialog({ place, open, onOpenChange }: DialogProps & { place: PlaceDetail }) {
  const [name, setName] = useState(place.name)
  const [type, setType] = useState(place.type)
  const [description, setDescription] = useState(place.description ?? "")
  const update = useUpdatePlace(place.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            update.mutate(
              { name: name.trim(), type, description: description.trim() || null },
              {
                onSuccess: () => {
                  onOpenChange(false)
                  toast.add({ title: "Saved", type: "success" })
                },
              }
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit place</DialogTitle>
            <DialogDescription>Shared by every branch.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="place-name">Name</FieldLabel>
              <Input id="place-name" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} />
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
            <Field>
              <FieldLabel htmlFor="place-description">Description</FieldLabel>
              <Textarea
                id="place-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <FieldDescription>A sentence or two on what makes it worth a visit.</FieldDescription>
            </Field>
          </FieldGroup>
          <ApiErrorAlert error={update.error} title="Couldn't save" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || update.isPending}>
              {update.isPending ? <Spinner data-icon="inline-start" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ArchivePlaceDialog({ place, open, onOpenChange }: DialogProps & { place: PlaceDetail }) {
  const archive = useArchivePlace(place.id)
  const navigate = useNavigate()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {place.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The place and all {place.branches.length} of its branches disappear from the app. Nothing is deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              archive.mutate(undefined, {
                onSuccess: () => {
                  toast.add({ title: "Archived", description: place.name, type: "success" })
                  void navigate("/places")
                },
                onError: (error) =>
                  toast.add({ title: "That didn't go through", description: error.message, type: "error" }),
              })
            }
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AddBranchDialog({
  placeId,
  open,
  onOpenChange,
  onCreated,
}: DialogProps & { placeId: string; onCreated: (branchId: string) => void }) {
  const [label, setLabel] = useState("")
  const [address, setAddress] = useState("")
  const create = useCreateBranch()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate(
              { placeId, label: label.trim(), addressText: address.trim() },
              {
                onSuccess: (branch) => {
                  onOpenChange(false)
                  setLabel("")
                  setAddress("")
                  onCreated(branch.id)
                },
              }
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>Add a branch</DialogTitle>
            <DialogDescription>Starts as a draft. Fill in the pin, cuisine and a photo to publish.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-branch-label">Branch name</FieldLabel>
              <Input
                id="new-branch-label"
                placeholder="Bole"
                value={label}
                maxLength={120}
                onChange={(e) => setLabel(e.target.value)}
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-branch-address">Address</FieldLabel>
              <Input
                id="new-branch-address"
                value={address}
                maxLength={240}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <ApiErrorAlert error={create.error} title="Couldn't add the branch" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!label.trim() || !address.trim() || create.isPending}>
              {create.isPending ? <Spinner data-icon="inline-start" /> : null}
              Add branch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
