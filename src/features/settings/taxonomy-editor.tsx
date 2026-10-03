import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { useTaxonomy, type TaxonomyKind } from "@/features/places/queries"
import type { TaxonRow } from "@/features/places/types"

import { useTaxonomyAction, type TagCategory } from "./queries"

const KINDS: { value: TaxonomyKind; label: string; singular: string }[] = [
  { value: "neighborhoods", label: "Neighborhoods", singular: "neighborhood" },
  { value: "cuisines", label: "Cuisines", singular: "cuisine" },
  { value: "food-categories", label: "Food categories", singular: "food category" },
  { value: "tags", label: "Tags", singular: "tag" },
  { value: "amenities", label: "Amenities", singular: "amenity" },
]

const TAG_CATEGORIES: { value: TagCategory; label: string }[] = [
  { value: "vibe", label: "Vibe" },
  { value: "diet", label: "Diet" },
  { value: "time", label: "Time" },
  { value: "practical", label: "Practical" },
]

export function TaxonomyEditor() {
  const [kind, setKind] = useState<TaxonomyKind>("neighborhoods")
  const meta = KINDS.find((k) => k.value === kind) ?? KINDS[0]
  const list = useTaxonomy(kind)
  const act = useTaxonomyAction(kind)
  const [name, setName] = useState("")
  const [category, setCategory] = useState<TagCategory>("vibe")
  const isTags = kind === "tags"

  const onError = (error: Error) =>
    toast.add({ title: "That didn't go through", description: error.message, type: "error" })

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        value={[kind]}
        onValueChange={(v) => v[0] && setKind(v[0] as TaxonomyKind)}
        variant="outline"
        size="sm"
        spacing={1}
        className="flex-wrap"
      >
        {KINDS.map((k) => (
          <ToggleGroupItem key={k.value} value={k.value}>
            {k.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          act.mutate(
            { action: "create", name: name.trim(), ...(isTags ? { category } : {}) },
            {
              onSuccess: () => {
                toast.add({ title: "Added", description: name.trim(), type: "success" })
                setName("")
              },
              onError,
            }
          )
        }}
      >
        <Input
          aria-label={`New ${meta.singular}`}
          placeholder={`New ${meta.singular}`}
          className="w-64"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {isTags ? (
          <Select items={TAG_CATEGORIES} value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger aria-label="Tag group" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TAG_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}
        <Button type="submit" variant="outline" disabled={!name.trim() || act.isPending}>
          Add
        </Button>
      </form>

      <ApiErrorAlert error={list.error} title="Couldn't load the list" />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {isTags ? <TableHead>Group</TableHead> : null}
              <TableHead className="w-40 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isPending
              ? Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-5" />
                    </TableCell>
                  </TableRow>
                ))
              : list.data?.map((row) => (
                  <TaxonRowView key={row.id} row={row} isTags={isTags} kind={kind} />
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function TaxonRowView({ row, isTags, kind }: { row: TaxonRow; isTags: boolean; kind: TaxonomyKind }) {
  const act = useTaxonomyAction(kind)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(row.name)
  const archived = row.status === "archived"

  const onError = (error: Error) =>
    toast.add({ title: "That didn't go through", description: error.message, type: "error" })

  return (
    <TableRow className={archived ? "text-muted-foreground" : undefined}>
      <TableCell>
        {editing ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              act.mutate(
                { action: "update", id: row.id, name: name.trim() },
                { onSuccess: () => setEditing(false), onError }
              )
            }}
          >
            <Input
              aria-label="Name"
              className="h-8 w-56"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!name.trim() || act.isPending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setName(row.name)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <span className="flex items-center gap-2">
            {row.name}
            {archived ? <Badge variant="outline">Archived</Badge> : null}
          </span>
        )}
      </TableCell>
      {isTags ? (
        <TableCell className="capitalize text-muted-foreground">{row.category}</TableCell>
      ) : null}
      <TableCell className="text-right">
        {editing ? null : (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Rename
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={act.isPending}
              onClick={() =>
                act.mutate({ action: "update", id: row.id, status: archived ? "active" : "archived" }, { onError })
              }
            >
              {archived ? "Restore" : "Archive"}
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}
