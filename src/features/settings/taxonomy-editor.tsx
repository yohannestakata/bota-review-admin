import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { SearchInput } from "@/components/search-input"
import { useUrlFilters } from "@/hooks/use-url-filters"
import {
  LOOKUP_KINDS,
  useLookup,
  useTaxonomy,
  type TaxonomyKind,
} from "@/features/places/queries"
import type { TaxonRow } from "@/features/places/types"

import {
  useReorderLookup,
  useTaxonomyAction,
  type TagCategory,
} from "./queries"

const KINDS: { value: TaxonomyKind; label: string; singular: string }[] = [
  { value: "neighborhoods", label: "Neighborhoods", singular: "neighborhood" },
  { value: "cuisines", label: "Cuisines", singular: "cuisine" },
  {
    value: "food-categories",
    label: "Food categories",
    singular: "food category",
  },
  { value: "tags", label: "Tags", singular: "tag" },
  { value: "amenities", label: "Amenities", singular: "amenity" },
  { value: "tag-groups", label: "Tag groups", singular: "tag group" },
  {
    value: "photo-categories",
    label: "Photo categories",
    singular: "photo category",
  },
]

export function TaxonomyEditor() {
  const { get, set } = useUrlFilters()
  const kind = get("list", "neighborhoods") as TaxonomyKind
  const setKind = (next: TaxonomyKind) => {
    set("list", next === "neighborhoods" ? "" : next)
    set("q", "")
  }
  const meta = KINDS.find((k) => k.value === kind) ?? KINDS[0]
  const list = useTaxonomy(kind)
  const q = get("q").toLowerCase()
  const rows = (list.data ?? []).filter((row) =>
    row.name.toLowerCase().includes(q)
  )
  const act = useTaxonomyAction(kind)
  // Tag groups and photo categories have an order; the rest are A to Z.
  // Moving is off while a search narrows the list.
  const reorder = useReorderLookup(kind)
  const canReorder = LOOKUP_KINDS.includes(kind) && !q
  const sensors = useSensors(
    // A small move starts a drag, so clicks on the handle still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Keyboard: Space to pick up, arrows to move, Space to drop.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  // Screen readers hear names ("Menu"), not internal keys ("menu").
  const nameOf = (id: string | number) =>
    rows.find((row) => row.id === id)?.name ?? String(id)
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} is over ${nameOf(over.id)}.`
        : `${nameOf(active.id)} isn't over a row.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} dropped at ${nameOf(over.id)}.`
        : `${nameOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
  }
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = rows.findIndex((row) => row.id === active.id)
    const to = rows.findIndex((row) => row.id === over.id)
    reorder.mutate(arrayMove(rows, from, to), {
      onError: (error) =>
        toast.add({
          title: "Couldn't save the order",
          description: error.message,
          type: "error",
        }),
    })
  }
  const [name, setName] = useState("")
  // Tag groups are their own list now; new tags default to the first one.
  const groups = useLookup("tag-groups")
  const groupItems = groups.active.map((g) => ({ value: g.id, label: g.name }))
  const [pickedGroup, setPickedGroup] = useState<TagCategory | null>(null)
  const category = pickedGroup ?? groupItems[0]?.value ?? ""
  const isTags = kind === "tags"

  const onError = (error: Error) =>
    toast.add({
      title: "That didn't go through",
      description: error.message,
      type: "error",
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lists</CardTitle>
        <CardDescription>
          The options editors pick from and people filter by in the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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

        <SearchInput
          value={get("q")}
          onChange={(value) => set("q", value)}
          placeholder={`Find a ${meta.singular}…`}
          className="w-64"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            act.mutate(
              {
                action: "create",
                name: name.trim(),
                ...(isTags ? { category } : {}),
              },
              {
                onSuccess: () => {
                  toast.add({
                    title: "Added",
                    description: name.trim(),
                    type: "success",
                  })
                  setName("")
                },
                onError,
              }
            )
          }}
        >
          <Field orientation="horizontal">
            <Input
              aria-label={`New ${meta.singular}`}
              required
              autoComplete="off"
              placeholder={`New ${meta.singular}…`}
              className="w-64"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {isTags ? (
              <Select
                items={groupItems}
                value={category}
                onValueChange={(v) => v && setPickedGroup(String(v))}
              >
                <SelectTrigger aria-label="Tag group" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {groupItems.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : null}
            <Button type="submit" variant="outline" disabled={act.isPending}>
              Add
            </Button>
          </Field>
        </form>

        <ApiErrorAlert error={list.error} title="Couldn't load the list" />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{ announcements }}
        >
          <SortableContext
            items={rows.map((row) => row.id)}
            strategy={verticalListSortingStrategy}
          >
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
                  : rows.map((row) => (
                      <TaxonRowView
                        key={row.id}
                        row={row}
                        isTags={isTags}
                        kind={kind}
                        groupName={groups.nameOf}
                        sortable={canReorder}
                      />
                    ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  )
}

function TaxonRowView({
  row,
  isTags,
  kind,
  groupName,
  sortable,
}: {
  row: TaxonRow
  isTags: boolean
  kind: TaxonomyKind
  groupName: (key: string | null | undefined) => string
  /** Ordered lists get a drag handle. */
  sortable: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !sortable })
  const act = useTaxonomyAction(kind)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(row.name)
  const archived = row.status === "archived"

  const onError = (error: Error) =>
    toast.add({
      title: "That didn't go through",
      description: error.message,
      type: "error",
    })

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: transition,
      }}
      className={isDragging ? "relative z-10 bg-background" : undefined}
    >
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
              required
              autoComplete="off"
              className="w-56"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="sm" disabled={act.isPending}>
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
            {sortable ? (
              <Button
                ref={setActivatorNodeRef}
                size="icon-sm"
                variant="ghost"
                className="cursor-grab touch-none"
                aria-label={`Drag to reorder ${row.name}`}
                {...attributes}
                {...listeners}
              >
                <HugeiconsIcon
                  icon={DragDropVerticalIcon}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Button>
            ) : null}
            {row.name}
            {archived ? <Badge variant="outline">Archived</Badge> : null}
          </span>
        )}
      </TableCell>
      {isTags ? <TableCell>{groupName(row.category)}</TableCell> : null}
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
                act.mutate(
                  {
                    action: "update",
                    id: row.id,
                    status: archived ? "active" : "archived",
                  },
                  {
                    onError,
                    // Archiving hides it from every picker and filter; offer a way back.
                    onSuccess: () =>
                      archived
                        ? undefined
                        : toast.add({
                            title: "Archived",
                            description: row.name,
                            actionProps: {
                              children: "Undo",
                              onClick: () =>
                                act.mutate(
                                  {
                                    action: "update",
                                    id: row.id,
                                    status: "active",
                                  },
                                  { onError }
                                ),
                            },
                          }),
                  }
                )
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
