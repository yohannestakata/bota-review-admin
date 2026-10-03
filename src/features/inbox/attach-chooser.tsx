import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { usePlace, usePlaceSearch } from "@/features/places/queries"

const NEW = "new"

// Words that say what a place is, not which one ("Tomoca Coffee").
const GENERIC = new Set([
  "the",
  "cafe",
  "café",
  "coffee",
  "restaurant",
  "bar",
  "bakery",
  "burger",
  "pizza",
  "juice",
  "house",
  "hotel",
  "and",
])

const words = (name: string) =>
  name
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3)

/** The word most likely to find the same business under another name. */
function searchWord(name: string) {
  const all = words(name)
  return all.find((w) => !GENERIC.has(w)) ?? all[0] ?? ""
}

/**
 * For a suggested new place: add it as a new place, or as a branch of one
 * already on Bota (the submitter's pick, or a place with a similar name).
 */
export function AttachChooser({
  placeName,
  suggestedId,
  value,
  onChange,
}: {
  placeName: string
  suggestedId?: string
  value: string
  onChange: (placeId: string) => void
}) {
  const suggested = usePlace(suggestedId)
  const search = usePlaceSearch(searchWord(placeName))
  const mine = new Set(words(placeName))
  const matches = (search.data ?? [])
    .filter((p) => p.id !== suggestedId)
    .map((p) => ({
      p,
      shared: words(p.name).filter((w) => mine.has(w)).length,
    }))
    .filter((m) => m.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 3)
    .map((m) => m.p)
  const options = [
    ...(suggested.data
      ? [{ id: suggested.data.id, name: suggested.data.name }]
      : []),
    ...matches.map((p) => ({ id: p.id, name: p.name })),
  ]
  if (options.length === 0) return null

  return (
    <Field>
      <FieldLabel>Add as</FieldLabel>
      <ToggleGroup
        value={[value || NEW]}
        onValueChange={(v) => v[0] && onChange(v[0] === NEW ? "" : v[0])}
        variant="outline"
        size="sm"
        spacing={1}
        className="flex-wrap"
      >
        <ToggleGroupItem value={NEW}>A new place</ToggleGroupItem>
        {options.map((o) => (
          <ToggleGroupItem key={o.id} value={o.id}>
            Branch of {o.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldDescription>
        {suggested.data
          ? `They said it's a location of ${suggested.data.name}.`
          : "Looks like it might already be on Bota. Adding it as a branch avoids a duplicate."}
      </FieldDescription>
    </Field>
  )
}
