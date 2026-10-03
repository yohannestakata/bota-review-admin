import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { HoursEditor, hoursComplete } from "./hours-editor"
import { useUpdateBranch } from "./queries"
import { TaxonMultiPicker, TaxonPicker } from "./taxon-picker"
import type { Branch, BranchPatch, Hours, Taxon } from "./types"

type Draft = {
  label: string
  addressText: string
  directions: string
  neighborhood: Taxon | null
  latitude: string
  longitude: string
  phone: string
  priceLevel: number | null
  hours: Hours
  cuisines: Taxon[]
  foodCategories: Taxon[]
  tags: Taxon[]
  amenities: Taxon[]
}

const toDraft = (b: Branch): Draft => ({
  label: b.label,
  addressText: b.addressText,
  directions: b.customDirections ?? "",
  neighborhood: b.neighborhood,
  latitude: b.latitude ?? "",
  longitude: b.longitude ?? "",
  phone: b.phone ?? "",
  priceLevel: b.priceLevel,
  hours: b.hours ?? {},
  cuisines: b.cuisines,
  foodCategories: b.foodCategories,
  tags: b.tags,
  amenities: b.amenities,
})

const ids = (list: Taxon[]) =>
  list
    .map((t) => t.id)
    .sort()
    .join()

/** Only what changed, so a save never clobbers fields nobody touched. */
function diff(before: Draft, after: Draft): BranchPatch {
  const patch: BranchPatch = {}
  if (after.label.trim() !== before.label) patch.label = after.label.trim()
  if (after.addressText.trim() !== before.addressText)
    patch.addressText = after.addressText.trim()
  if (after.directions.trim() !== before.directions)
    patch.directions = after.directions.trim()
  if (after.neighborhood?.id !== before.neighborhood?.id)
    patch.neighborhoodId = after.neighborhood?.id ?? null
  if (after.latitude.trim() !== before.latitude)
    patch.latitude = after.latitude.trim() || null
  if (after.longitude.trim() !== before.longitude)
    patch.longitude = after.longitude.trim() || null
  if (after.phone.trim() !== before.phone)
    patch.phone = after.phone.trim() || null
  if (after.priceLevel !== before.priceLevel)
    patch.priceLevel = after.priceLevel
  if (JSON.stringify(after.hours) !== JSON.stringify(before.hours))
    patch.hours = after.hours
  if (ids(after.cuisines) !== ids(before.cuisines))
    patch.cuisineIds = after.cuisines.map((t) => t.id)
  if (ids(after.foodCategories) !== ids(before.foodCategories))
    patch.foodCategoryIds = after.foodCategories.map((t) => t.id)
  if (ids(after.tags) !== ids(before.tags))
    patch.tagIds = after.tags.map((t) => t.id)
  if (ids(after.amenities) !== ids(before.amenities))
    patch.amenityIds = after.amenities.map((t) => t.id)
  return patch
}

const PRICE_LEVELS = ["1", "2", "3", "4"]

function validCoordinate(value: string, limit: number) {
  if (!value.trim()) return true
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) <= limit
}

/** Branch details. Keyed by the branch's updatedAt, so a save resets the draft. */
export function BranchForm({ branch }: { branch: Branch }) {
  const [initial] = useState(() => toDraft(branch))
  const [draft, setDraft] = useState(initial)
  const update = useUpdateBranch(branch.id)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const patch = diff(initial, draft)
  const dirty = Object.keys(patch).length > 0
  const coordsOk =
    validCoordinate(draft.latitude, 90) && validCoordinate(draft.longitude, 180)
  const canSave =
    dirty &&
    coordsOk &&
    hoursComplete(draft.hours) &&
    Boolean(draft.label.trim() && draft.addressText.trim())

  const lat = Number(draft.latitude)
  const lng = Number(draft.longitude)
  const hasPin =
    draft.latitude.trim() !== "" && draft.longitude.trim() !== "" && coordsOk

  return (
    <form
      // Enter in a picker picks an option; it must never save the whole form.
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          (e.target as HTMLElement).getAttribute("role") === "combobox"
        )
          e.preventDefault()
      }}
      onSubmit={(e) => {
        e.preventDefault()
        update.mutate(patch, {
          onSuccess: () => toast.add({ title: "Saved", type: "success" }),
        })
      }}
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Where it is</FieldLegend>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="branch-label">Branch name</FieldLabel>
                    <Input
                      id="branch-label"
                      value={draft.label}
                      maxLength={120}
                      onChange={(e) => set("label", e.target.value)}
                    />
                    <FieldDescription>
                      Usually the area, like Bole or Piassa. Changes the link.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="branch-neighborhood">
                      Neighborhood
                    </FieldLabel>
                    <TaxonPicker
                      id="branch-neighborhood"
                      kind="neighborhoods"
                      value={draft.neighborhood}
                      onChange={(v) => set("neighborhood", v)}
                      placeholder="Pick a neighborhood"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="branch-address">Address</FieldLabel>
                  <Input
                    id="branch-address"
                    value={draft.addressText}
                    maxLength={240}
                    onChange={(e) => set("addressText", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="branch-directions">
                    Directions
                  </FieldLabel>
                  <Textarea
                    id="branch-directions"
                    value={draft.directions}
                    maxLength={160}
                    rows={2}
                    placeholder={
                      branch.generatedDirections ??
                      "Behind Edna Mall, 2nd floor"
                    }
                    onChange={(e) => set("directions", e.target.value)}
                  />
                  <FieldDescription>
                    {branch.generatedDirections
                      ? "Leave empty to use the generated directions, shown faded in the box."
                      : "How to find it once you're close."}
                  </FieldDescription>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    data-invalid={
                      !validCoordinate(draft.latitude, 90) || undefined
                    }
                  >
                    <FieldLabel htmlFor="branch-lat">Latitude</FieldLabel>
                    <Input
                      id="branch-lat"
                      inputMode="decimal"
                      value={draft.latitude}
                      aria-invalid={
                        !validCoordinate(draft.latitude, 90) || undefined
                      }
                      onChange={(e) => set("latitude", e.target.value)}
                    />
                  </Field>
                  <Field
                    data-invalid={
                      !validCoordinate(draft.longitude, 180) || undefined
                    }
                  >
                    <FieldLabel htmlFor="branch-lng">Longitude</FieldLabel>
                    <Input
                      id="branch-lng"
                      inputMode="decimal"
                      value={draft.longitude}
                      aria-invalid={
                        !validCoordinate(draft.longitude, 180) || undefined
                      }
                      onChange={(e) => set("longitude", e.target.value)}
                    />
                  </Field>
                </div>
                {hasPin ? (
                  <FieldDescription>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Check the pin on Google Maps
                    </a>
                  </FieldDescription>
                ) : null}
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldLegend>What it is</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="branch-cuisines">Cuisines</FieldLabel>
                  <TaxonMultiPicker
                    id="branch-cuisines"
                    kind="cuisines"
                    value={draft.cuisines}
                    onChange={(v) => set("cuisines", v)}
                    placeholder="Ethiopian, Italian…"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="branch-categories">
                    Food categories
                  </FieldLabel>
                  <TaxonMultiPicker
                    id="branch-categories"
                    kind="food-categories"
                    value={draft.foodCategories}
                    onChange={(v) => set("foodCategories", v)}
                    placeholder="Burgers, coffee…"
                  />
                  <FieldDescription>
                    Publishing needs at least one cuisine or food category.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="branch-tags">Tags</FieldLabel>
                  <TaxonMultiPicker
                    id="branch-tags"
                    kind="tags"
                    value={draft.tags}
                    onChange={(v) => set("tags", v)}
                    placeholder="Date night, vegan options…"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="branch-amenities">Amenities</FieldLabel>
                  <TaxonMultiPicker
                    id="branch-amenities"
                    kind="amenities"
                    value={draft.amenities}
                    onChange={(v) => set("amenities", v)}
                    placeholder="Wi-Fi, parking…"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Price</FieldLabel>
                    <ToggleGroup
                      value={draft.priceLevel ? [String(draft.priceLevel)] : []}
                      onValueChange={(v) =>
                        set("priceLevel", v[0] ? Number(v[0]) : null)
                      }
                      variant="outline"
                      spacing={1}
                    >
                      {PRICE_LEVELS.map((level) => (
                        <ToggleGroupItem
                          key={level}
                          value={level}
                          aria-label={`Price level ${level}`}
                        >
                          {"$".repeat(Number(level))}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <FieldDescription>
                      Click the selected one again to clear it.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="branch-phone">Phone</FieldLabel>
                    <Input
                      id="branch-phone"
                      type="tel"
                      value={draft.phone}
                      maxLength={60}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldLegend>Opening hours</FieldLegend>
              <HoursEditor
                value={draft.hours}
                onChange={(v) => set("hours", v)}
              />
            </FieldSet>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <ApiErrorAlert error={update.error} title="Couldn't save" />
          <Field orientation="horizontal" className="justify-end">
            {dirty ? (
              <FieldDescription className="mr-auto">
                Unsaved changes
              </FieldDescription>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={!dirty}
              onClick={() => setDraft(initial)}
            >
              Discard
            </Button>
            <Button type="submit" disabled={!canSave || update.isPending}>
              {update.isPending ? <Spinner data-icon="inline-start" /> : null}
              Save changes
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </form>
  )
}
