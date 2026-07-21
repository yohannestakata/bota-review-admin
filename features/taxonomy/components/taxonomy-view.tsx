"use client"

import { PencilIcon, PlusIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiErrorMessage } from "@/lib/api-client"
import {
  useAmenities,
  useCreateTag,
  useCreateTaxonomyItem,
  useCuisines,
  useFoodCategories,
  useNeighborhoods,
  useTags,
  useUpdateTag,
  useUpdateTaxonomyItem,
} from "../queries"
import type {
  Tag,
  TagCategory,
  TaxonomyItem,
  TaxonomyKind,
  TaxonomyStatus,
} from "../types"

type BasicKind = Exclude<TaxonomyKind, "tags">

const TAG_CATEGORIES: TagCategory[] = ["vibe", "diet", "time", "practical"]
const STATUSES: TaxonomyStatus[] = ["active", "archived"]

const SINGULAR_LABELS: Record<BasicKind, string> = {
  neighborhoods: "neighborhood",
  cuisines: "cuisine",
  "food-categories": "food category",
  amenities: "amenity",
}

function sortByName<T extends { name: string }>(items: T[] | undefined) {
  return [...(items ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  )
}

function StatusBadge({ status }: { status: TaxonomyStatus }) {
  return (
    <Badge variant={status === "active" ? "default" : "secondary"}>
      {status}
    </Badge>
  )
}

function TaxonomySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  )
}

function BasicItemDialog({
  kind,
  item,
  open,
  onOpenChange,
}: {
  kind: BasicKind
  item: TaxonomyItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateTaxonomyItem(kind)
  const update = useUpdateTaxonomyItem(kind)
  const [name, setName] = useState("")
  const [status, setStatus] = useState<TaxonomyStatus>("active")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(item?.name ?? "")
    setStatus(item?.status ?? "active")
  }, [item, open])

  const busy = create.isPending || update.isPending
  const title = item
    ? `Edit ${SINGULAR_LABELS[kind]}`
    : `Add ${SINGULAR_LABELS[kind]}`

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return

    if (item) {
      update.mutate(
        { id: item.id, body: { name: trimmed, status } },
        {
          onSuccess: () => {
            toast.success("Saved")
            onOpenChange(false)
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        }
      )
      return
    }

    create.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success("Created")
          onOpenChange(false)
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Taxonomy labels are used on branch profiles and filters.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor={`${kind}-name`} className="text-sm font-medium">
              Name
            </label>
            <Input
              id={`${kind}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit()
              }}
            />
          </div>
          {item ? (
            <div className="grid gap-2">
              <label htmlFor={`${kind}-status`} className="text-sm font-medium">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaxonomyStatus)}
              >
                <SelectTrigger id={`${kind}-status`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="capitalize"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={busy || !name.trim()} onClick={submit}>
            {item ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TagDialog({
  item,
  open,
  onOpenChange,
}: {
  item: Tag | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateTag()
  const update = useUpdateTag()
  const [name, setName] = useState("")
  const [category, setCategory] = useState<TagCategory>("vibe")
  const [status, setStatus] = useState<TaxonomyStatus>("active")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(item?.name ?? "")
    setCategory(item?.category ?? "vibe")
    setStatus(item?.status ?? "active")
  }, [item, open])

  const busy = create.isPending || update.isPending

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return

    if (item) {
      update.mutate(
        { id: item.id, body: { name: trimmed, category, status } },
        {
          onSuccess: () => {
            toast.success("Saved")
            onOpenChange(false)
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        }
      )
      return
    }

    create.mutate(
      { name: trimmed, category },
      {
        onSuccess: () => {
          toast.success("Created")
          onOpenChange(false)
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit tag" : "Add tag"}</DialogTitle>
          <DialogDescription>
            Tags describe branch vibe, diet fit, timing, and practical details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="tag-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit()
              }}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="tag-category" className="text-sm font-medium">
              Category
            </label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as TagCategory)}
            >
              <SelectTrigger id="tag-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAG_CATEGORIES.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="capitalize"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {item ? (
            <div className="grid gap-2">
              <label htmlFor="tag-status" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaxonomyStatus)}
              >
                <SelectTrigger id="tag-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="capitalize"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={busy || !name.trim()} onClick={submit}>
            {item ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BasicTaxonomyPanel({
  kind,
  items,
  isPending,
  isError,
  error,
}: {
  kind: BasicKind
  items: TaxonomyItem[] | undefined
  isPending: boolean
  isError: boolean
  error: unknown
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TaxonomyItem | null>(null)
  const sorted = useMemo(() => sortByName(items), [items])

  function openCreate() {
    setSelectedItem(null)
    setDialogOpen(true)
  }

  function openEdit(item: TaxonomyItem) {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">{apiErrorMessage(error)}</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>

      {isPending ? (
        <TaxonomySkeleton />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.slug}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      <PencilIcon className="size-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      <BasicItemDialog
        kind={kind}
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

function TagsPanel({
  items,
  isPending,
  isError,
  error,
}: {
  items: Tag[] | undefined
  isPending: boolean
  isError: boolean
  error: unknown
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Tag | null>(null)
  const sorted = useMemo(() => sortByName(items), [items])

  function openCreate() {
    setSelectedItem(null)
    setDialogOpen(true)
  }

  function openEdit(item: Tag) {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">{apiErrorMessage(error)}</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>

      {isPending ? (
        <TaxonomySkeleton />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.slug}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      <PencilIcon className="size-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      <TagDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

export function TaxonomyView({
  defaultValue = "cuisines",
}: {
  defaultValue?: TaxonomyKind
}) {
  const neighborhoods = useNeighborhoods()
  const cuisines = useCuisines()
  const foodCategories = useFoodCategories()
  const tags = useTags()
  const amenities = useAmenities()

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <Tabs defaultValue={defaultValue}>
        <TabsList>
          <TabsTrigger value="cuisines">Cuisines</TabsTrigger>
          <TabsTrigger value="food-categories">Food categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="neighborhoods">Neighborhoods</TabsTrigger>
        </TabsList>
        <TabsContent value="cuisines">
          <BasicTaxonomyPanel
            kind="cuisines"
            items={cuisines.data}
            isPending={cuisines.isPending}
            isError={cuisines.isError}
            error={cuisines.error}
          />
        </TabsContent>
        <TabsContent value="food-categories">
          <BasicTaxonomyPanel
            kind="food-categories"
            items={foodCategories.data}
            isPending={foodCategories.isPending}
            isError={foodCategories.isError}
            error={foodCategories.error}
          />
        </TabsContent>
        <TabsContent value="tags">
          <TagsPanel
            items={tags.data}
            isPending={tags.isPending}
            isError={tags.isError}
            error={tags.error}
          />
        </TabsContent>
        <TabsContent value="amenities">
          <BasicTaxonomyPanel
            kind="amenities"
            items={amenities.data}
            isPending={amenities.isPending}
            isError={amenities.isError}
            error={amenities.error}
          />
        </TabsContent>
        <TabsContent value="neighborhoods">
          <BasicTaxonomyPanel
            kind="neighborhoods"
            items={neighborhoods.data}
            isPending={neighborhoods.isPending}
            isError={neighborhoods.isError}
            error={neighborhoods.error}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
