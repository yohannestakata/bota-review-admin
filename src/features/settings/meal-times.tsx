import { Fragment } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { PLACE_TYPES } from "@/features/places/labels"
import { useTaxonomy } from "@/features/places/queries"
import { TaxonMultiPicker } from "@/features/places/taxon-picker"
import type { PlaceType, Taxon } from "@/features/places/types"

import {
  useMealTimes,
  useSetMealTime,
  type MealLinks,
  type MealTime,
} from "./queries"

const hour = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`

/**
 * What counts as a breakfast (lunch, …) place: the home screen's meal-time
 * rail and the "For you" time-of-day nudge both use these links.
 */
export function MealTimes() {
  const slots = useMealTimes()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal times</CardTitle>
        <CardDescription>
          What fills the home screen's meal-time list and gets a lift in For you
          at each time of day. A place counts if it has any of the tags or food
          categories, or is one of the types.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiErrorAlert error={slots.error} title="Couldn't load meal times" />
        {slots.isPending ? (
          <Skeleton className="h-96" />
        ) : (
          <FieldGroup>
            {slots.data?.map((slot, i) => (
              <Fragment key={slot.key}>
                {i > 0 ? <FieldSeparator /> : null}
                <SlotFields slot={slot} />
              </Fragment>
            ))}
          </FieldGroup>
        )}
      </CardContent>
    </Card>
  )
}

function SlotFields({ slot }: { slot: MealTime }) {
  const tags = useTaxonomy("tags")
  const categories = useTaxonomy("food-categories")
  const save = useSetMealTime()
  const pick = (ids: string[], list: Taxon[] | undefined) =>
    ids.flatMap((id) => list?.find((t) => t.id === id) ?? [])

  const links: MealLinks = {
    tagIds: slot.tagIds,
    foodCategoryIds: slot.foodCategoryIds,
    placeTypes: slot.placeTypes,
  }
  const update = (change: Partial<MealLinks>) =>
    save.mutate(
      { slot: slot.key, links: { ...links, ...change } },
      {
        onError: (error) =>
          toast.add({
            title: `Couldn't save ${slot.name.toLowerCase()}`,
            description: error.message,
            type: "error",
          }),
      }
    )

  return (
    <FieldSet>
      <FieldLegend>{slot.name}</FieldLegend>
      <FieldDescription>
        {hour(slot.from)} to {hour(slot.until)}, shown as “{slot.title}”.
      </FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${slot.key}-tags`}>Tags</FieldLabel>
          <TaxonMultiPicker
            id={`${slot.key}-tags`}
            kind="tags"
            value={pick(slot.tagIds, tags.data)}
            onChange={(value) => update({ tagIds: value.map((t) => t.id) })}
            placeholder="Add tags…"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${slot.key}-categories`}>
            Food categories
          </FieldLabel>
          <TaxonMultiPicker
            id={`${slot.key}-categories`}
            kind="food-categories"
            value={pick(slot.foodCategoryIds, categories.data)}
            onChange={(value) =>
              update({ foodCategoryIds: value.map((t) => t.id) })
            }
            placeholder="Add food categories…"
          />
        </Field>
        <Field>
          <FieldLabel>Place types</FieldLabel>
          <ToggleGroup
            multiple
            aria-label={`${slot.name} place types`}
            value={slot.placeTypes}
            onValueChange={(value) =>
              update({ placeTypes: value as PlaceType[] })
            }
            variant="outline"
            size="sm"
            spacing={1}
            className="flex-wrap"
          >
            {PLACE_TYPES.map((t) => (
              <ToggleGroupItem key={t.value} value={t.value}>
                {t.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>
            Every place of that type, so best for cafés and bakeries at
            breakfast.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
