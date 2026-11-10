import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { SearchInput } from "@/components/search-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { useLookup, useTaxonomy } from "@/features/places/queries"
import { TaxonMultiPicker } from "@/features/places/taxon-picker"
import type { PlaceType, Taxon } from "@/features/places/types"
import { useUrlFilters } from "@/hooks/use-url-filters"

import {
  useSearchPhraseAction,
  useSearchPhrases,
  type SearchPhrase,
  type SearchPhraseChange,
} from "./queries"

const onError = (error: Error) =>
  toast.add({
    title: "That didn't go through",
    description: error.message,
    type: "error",
  })

/**
 * Words people search with that places don't say about themselves
 * ("birthday", "ልደት", "date night"): what a search for them also finds.
 */
export function SearchWords() {
  const list = useSearchPhrases()
  const act = useSearchPhraseAction()
  const { get, set } = useUrlFilters()
  const q = get("q").toLowerCase()
  const rows = (list.data ?? []).filter((row) =>
    row.phrase.toLowerCase().includes(q)
  )
  const [phrase, setPhrase] = useState("")
  const [open, setOpen] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search words</CardTitle>
        <CardDescription>
          Words people search with that places don't say about themselves, in
          any language. A search made of these (with words like “dinner” or
          “spot” around them) also finds places with any of the linked tags,
          food categories or types. Words that mean the same are searched as
          well, even inside longer searches.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SearchInput
          value={get("q")}
          onChange={(value) => set("q", value)}
          placeholder="Find a search word…"
          className="w-64"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const value = phrase.trim()
            act.mutate(
              { action: "create", phrase: value },
              {
                onSuccess: (result) => {
                  setPhrase("")
                  setOpen(result.data.id)
                },
                onError,
              }
            )
          }}
        >
          <Field orientation="horizontal">
            <Input
              aria-label="New search word"
              required
              autoComplete="off"
              placeholder="New search word…"
              className="w-64"
              maxLength={80}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={act.isPending}>
              Add
            </Button>
          </Field>
        </form>

        <ApiErrorAlert error={list.error} title="Couldn't load search words" />
        {list.isPending ? (
          <Skeleton className="h-64" />
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {rows.map((row) => (
              <PhraseRow
                key={row.id}
                row={row}
                open={open === row.id}
                onToggle={() => setOpen(open === row.id ? null : row.id)}
              />
            ))}
            {rows.length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">
                {q ? "Nothing matches." : "No search words yet."}
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function PhraseRow({
  row,
  open,
  onToggle,
}: {
  row: SearchPhrase
  open: boolean
  onToggle: () => void
}) {
  const tags = useTaxonomy("tags")
  const categories = useTaxonomy("food-categories")
  const placeTypes = useLookup("place-types")
  const act = useSearchPhraseAction()
  const archived = row.status === "archived"
  const save = (change: SearchPhraseChange, done?: () => void) =>
    act.mutate(
      { action: "update", id: row.id, change },
      { onError, onSuccess: done }
    )
  const pick = (ids: string[], list: Taxon[] | undefined) =>
    ids.flatMap((id) => list?.find((t) => t.id === id) ?? [])

  // What it finds, in a line: "Great for groups, Lively · also birthday".
  const finds = [
    ...pick(row.tagIds, tags.data).map((t) => t.name),
    ...pick(row.foodCategoryIds, categories.data).map((t) => t.name),
    ...row.placeTypes.map((key) => placeTypes.nameOf(key)),
  ]
  const summary = [
    finds.length ? finds.join(", ") : null,
    row.alsoSearch.length ? `also ${row.alsoSearch.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <li className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-medium">
            {row.phrase}
            {archived ? <Badge variant="outline">Archived</Badge> : null}
          </div>
          <div className="truncate text-sm text-muted-foreground">
            {summary || "Finds nothing extra yet"}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onToggle}>
          {open ? "Done" : "Edit"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={act.isPending}
          onClick={() =>
            save({ status: archived ? "active" : "archived" }, () =>
              archived
                ? undefined
                : toast.add({
                    title: "Archived",
                    description: `Searches for “${row.phrase}” work as before it was added.`,
                    actionProps: {
                      children: "Undo",
                      onClick: () => save({ status: "active" }),
                    },
                  })
            )
          }
        >
          {archived ? "Restore" : "Archive"}
        </Button>
      </div>

      {open ? (
        <FieldGroup>
          <PhraseName row={row} onSave={(phrase) => save({ phrase })} />
          <AlsoSearch row={row} onSave={(alsoSearch) => save({ alsoSearch })} />
          <Field>
            <FieldLabel htmlFor={`${row.id}-tags`}>Tags</FieldLabel>
            <TaxonMultiPicker
              id={`${row.id}-tags`}
              kind="tags"
              value={pick(row.tagIds, tags.data)}
              onChange={(value) => save({ tagIds: value.map((t) => t.id) })}
              placeholder="Add tags…"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${row.id}-categories`}>
              Food categories
            </FieldLabel>
            <TaxonMultiPicker
              id={`${row.id}-categories`}
              kind="food-categories"
              value={pick(row.foodCategoryIds, categories.data)}
              onChange={(value) =>
                save({ foodCategoryIds: value.map((t) => t.id) })
              }
              placeholder="Add food categories…"
            />
          </Field>
          <Field>
            <FieldLabel>Place types</FieldLabel>
            <ToggleGroup
              multiple
              aria-label={`${row.phrase} place types`}
              value={row.placeTypes}
              onValueChange={(value) =>
                save({ placeTypes: value as PlaceType[] })
              }
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap"
            >
              {placeTypes.active.map((t) => (
                <ToggleGroupItem key={t.id} value={t.id}>
                  {t.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>
              Every place of that type, e.g. Bakery for “cake”.
            </FieldDescription>
          </Field>
        </FieldGroup>
      ) : null}
    </li>
  )
}

/** The word itself, saved when it changes and the field is left. */
function PhraseName({
  row,
  onSave,
}: {
  row: SearchPhrase
  onSave: (phrase: string) => void
}) {
  const [value, setValue] = useState(row.phrase)
  return (
    <Field>
      <FieldLabel htmlFor={`${row.id}-phrase`}>Search word</FieldLabel>
      <Input
        id={`${row.id}-phrase`}
        className="w-64"
        maxLength={80}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const next = value.trim()
          if (next && next !== row.phrase) onSave(next)
          else setValue(row.phrase)
        }}
      />
    </Field>
  )
}

/** Words that mean the same, comma-separated, saved when the field is left. */
function AlsoSearch({
  row,
  onSave,
}: {
  row: SearchPhrase
  onSave: (alsoSearch: string[]) => void
}) {
  const [value, setValue] = useState(row.alsoSearch.join(", "))
  return (
    <Field>
      <FieldLabel htmlFor={`${row.id}-also`}>Also search for</FieldLabel>
      <Input
        id={`${row.id}-also`}
        placeholder="e.g. birthday, celebration"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const next = [
            ...new Set(
              value
                .split(",")
                .map((word) => word.trim())
                .filter(Boolean)
            ),
          ]
          if (next.join(",") !== row.alsoSearch.join(",")) onSave(next)
          setValue(next.join(", "))
        }}
      />
      <FieldDescription>
        Words that mean the same, separated by commas. “bday cake” also searches
        “birthday cake”.
      </FieldDescription>
    </Field>
  )
}
