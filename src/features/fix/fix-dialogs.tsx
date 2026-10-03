import { lazy, Suspense, useState } from "react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  useBranch,
  useUpdateBranch,
  useUpdatePlace,
} from "@/features/places/queries"
import { TaxonMultiPicker } from "@/features/places/taxon-picker"
import type { Branch, Taxon } from "@/features/places/types"

const LocationPicker = lazy(() => import("@/features/places/location-picker"))

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

/** Loads the branch, then shows `children` with it. */
function WithBranch({
  branchId,
  children,
}: {
  branchId: string
  children: (branch: Branch) => React.ReactNode
}) {
  const branch = useBranch(branchId)
  if (branch.isPending) return <Skeleton className="h-48" />
  if (branch.error)
    return (
      <ApiErrorAlert error={branch.error} title="Couldn't load this branch" />
    )
  return children(branch.data)
}

function SaveFooter({
  pending,
  onCancel,
}: {
  pending: boolean
  onCancel: () => void
}) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save
      </Button>
    </DialogFooter>
  )
}

export function LocationDialog({
  branchId,
  title,
  open,
  onOpenChange,
}: DialogProps & { branchId: string; title: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Set the location of {title}</DialogTitle>
          <DialogDescription>
            Click the map or drag the pin to where it really is.
          </DialogDescription>
        </DialogHeader>
        <WithBranch branchId={branchId}>
          {(branch) => (
            <LocationForm branch={branch} onDone={() => onOpenChange(false)} />
          )}
        </WithBranch>
      </DialogContent>
    </Dialog>
  )
}

function LocationForm({
  branch,
  onDone,
}: {
  branch: Branch
  onDone: () => void
}) {
  const [latitude, setLatitude] = useState(branch.latitude ?? "")
  const [longitude, setLongitude] = useState(branch.longitude ?? "")
  const update = useUpdateBranch(branch.id)
  const changed =
    latitude !== (branch.latitude ?? "") ||
    longitude !== (branch.longitude ?? "")

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!changed) return onDone()
        update.mutate(
          { latitude, longitude },
          {
            onSuccess: () => {
              toast.add({ title: "Location saved", type: "success" })
              onDone()
            },
          }
        )
      }}
    >
      <Field>
        <FieldLabel>Location</FieldLabel>
        <Suspense fallback={<Skeleton className="aspect-video" />}>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat)
              setLongitude(lng)
            }}
          />
        </Suspense>
        <FieldDescription>{branch.addressText}</FieldDescription>
      </Field>
      <ApiErrorAlert error={update.error} title="Couldn't save" />
      <SaveFooter pending={update.isPending} onCancel={onDone} />
    </form>
  )
}

export function CuisineDialog({
  branchId,
  title,
  open,
  onOpenChange,
}: DialogProps & { branchId: string; title: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What {title} serves</DialogTitle>
          <DialogDescription>
            Pick at least one cuisine or food category.
          </DialogDescription>
        </DialogHeader>
        <WithBranch branchId={branchId}>
          {(branch) => (
            <CuisineForm branch={branch} onDone={() => onOpenChange(false)} />
          )}
        </WithBranch>
      </DialogContent>
    </Dialog>
  )
}

function CuisineForm({
  branch,
  onDone,
}: {
  branch: Branch
  onDone: () => void
}) {
  const [cuisines, setCuisines] = useState<Taxon[]>(branch.cuisines)
  const [categories, setCategories] = useState<Taxon[]>(branch.foodCategories)
  const [tried, setTried] = useState(false)
  const update = useUpdateBranch(branch.id)
  const empty = cuisines.length + categories.length === 0

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (empty) return setTried(true)
        update.mutate(
          {
            cuisineIds: cuisines.map((t) => t.id),
            foodCategoryIds: categories.map((t) => t.id),
          },
          {
            onSuccess: () => {
              toast.add({ title: "Saved", type: "success" })
              onDone()
            },
          }
        )
      }}
    >
      <FieldGroup>
        <Field data-invalid={(tried && empty) || undefined}>
          <FieldLabel htmlFor="fix-cuisines">Cuisines</FieldLabel>
          <TaxonMultiPicker
            id="fix-cuisines"
            kind="cuisines"
            value={cuisines}
            onChange={setCuisines}
            placeholder="Ethiopian, Italian…"
          />
        </Field>
        <Field data-invalid={(tried && empty) || undefined}>
          <FieldLabel htmlFor="fix-categories">Food categories</FieldLabel>
          <TaxonMultiPicker
            id="fix-categories"
            kind="food-categories"
            value={categories}
            onChange={setCategories}
            placeholder="Burgers, coffee…"
          />
          {tried && empty ? (
            <FieldDescription>
              Pick at least one cuisine or food category.
            </FieldDescription>
          ) : null}
        </Field>
      </FieldGroup>
      <ApiErrorAlert error={update.error} title="Couldn't save" />
      <SaveFooter pending={update.isPending} onCancel={onDone} />
    </form>
  )
}

export function RenameDialog({
  placeId,
  name,
  open,
  onOpenChange,
}: DialogProps & { placeId: string; name: string }) {
  const [value, setValue] = useState(name)
  const update = useUpdatePlace(placeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            update.mutate(
              { name: value.trim() },
              {
                onSuccess: () => {
                  toast.add({
                    title: "Renamed",
                    description: value.trim(),
                    type: "success",
                  })
                  onOpenChange(false)
                },
              }
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename {name}</DialogTitle>
            <DialogDescription>
              The name people see in the app, for every branch.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="fix-name">Name</FieldLabel>
            <Input
              id="fix-name"
              value={value}
              maxLength={160}
              required
              autoComplete="off"
              onChange={(e) => setValue(e.target.value)}
            />
          </Field>
          <ApiErrorAlert error={update.error} title="Couldn't rename" />
          <SaveFooter
            pending={update.isPending}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
