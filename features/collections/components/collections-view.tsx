/* eslint-disable @next/next/no-img-element */
"use client"

import { ArchiveIcon, CheckIcon, PencilIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { apiErrorMessage } from "@/lib/api-client"
import {
  useArchiveCollection,
  useCollections,
  useCreateCollection,
  usePublishCollection,
  useUpdateCollection,
} from "../queries"
import type {
  Collection,
  CollectionFormValues,
  CollectionStatus,
} from "../types"

const STATUS_VARIANT: Record<
  CollectionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
}

function emptyForm(): CollectionFormValues {
  return {
    name: "",
    description: "",
    coverImageUrl: "",
    displayOrder: "0",
    status: "draft",
  }
}

function formFromCollection(collection: Collection): CollectionFormValues {
  return {
    name: collection.name,
    description: collection.description ?? "",
    coverImageUrl: collection.coverImageUrl ?? "",
    displayOrder: String(collection.displayOrder),
    status: collection.status,
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function readyToPublish(collection: Collection): boolean {
  return collection.publishedBranchCount >= 6
}

function CollectionDialog({
  collection,
  open,
  saving,
  onOpenChange,
  onSubmit,
}: {
  collection: Collection | null
  open: boolean
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CollectionFormValues) => void
}) {
  const [form, setForm] = useState<CollectionFormValues>(() =>
    collection ? formFromCollection(collection) : emptyForm()
  )

  function set<K extends keyof CollectionFormValues>(
    key: K,
    value: CollectionFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function reset(nextOpen: boolean) {
    if (nextOpen) {
      setForm(collection ? formFromCollection(collection) : emptyForm())
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {collection ? "Edit collection" : "New collection"}
          </DialogTitle>
          <DialogDescription>
            Collections appear as curated rails on the app home screen.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="collection-name">Name</FieldLabel>
            <Input
              id="collection-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="collection-description">
              Description
            </FieldLabel>
            <Textarea
              id="collection-description"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="collection-cover">Cover image URL</FieldLabel>
            <Input
              id="collection-cover"
              value={form.coverImageUrl}
              onChange={(event) => set("coverImageUrl", event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="collection-order">Display order</FieldLabel>
              <Input
                id="collection-order"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(event) => set("displayOrder", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="collection-status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  set("status", value as CollectionStatus)
                }
              >
                <SelectTrigger id="collection-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button
            disabled={saving || !form.name.trim()}
            onClick={() => onSubmit(form)}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CollectionCard({
  collection,
  busy,
  onArchive,
  onEdit,
  onPublish,
}: {
  collection: Collection
  busy: boolean
  onArchive: (collection: Collection) => void
  onEdit: (collection: Collection) => void
  onPublish: (collection: Collection) => void
}) {
  const canPublish = readyToPublish(collection)

  return (
    <Card className="overflow-hidden p-0">
      {collection.coverImageUrl ? (
        <img
          src={collection.coverImageUrl}
          alt=""
          className="aspect-[5/2] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[5/2] items-center justify-center bg-muted text-sm text-muted-foreground">
          No cover
        </div>
      )}
      <CardHeader className="p-4">
        <CardTitle className="min-w-0">
          <span className="block truncate text-sm">{collection.name}</span>
        </CardTitle>
        <CardAction>
          <Badge
            variant={STATUS_VARIANT[collection.status]}
            className="capitalize"
          >
            {collection.status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 px-4">
        {collection.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {collection.description}
          </p>
        ) : null}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Branches</div>
            <div className="font-semibold tabular-nums">
              {collection.branchCount}
            </div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Published</div>
            <div className="font-semibold tabular-nums">
              {collection.publishedBranchCount}
            </div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Order</div>
            <div className="font-semibold tabular-nums">
              {collection.displayOrder}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Updated {formatDate(collection.updatedAt)}
        </div>
        {!canPublish ? (
          <p className="text-xs text-muted-foreground">
            Needs at least 6 published branches before publishing.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 p-4">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/collections/${collection.id}`} />}
        >
          Manage
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(collection)}>
          <PencilIcon className="size-4" />
          Edit
        </Button>
        <Button
          size="sm"
          disabled={busy || collection.status === "published" || !canPublish}
          onClick={() => onPublish(collection)}
        >
          <CheckIcon className="size-4" />
          Publish
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || collection.status === "archived"}
          onClick={() => onArchive(collection)}
        >
          <ArchiveIcon className="size-4" />
          Archive
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CollectionsView() {
  const { data, isPending, isError, error } = useCollections()
  const create = useCreateCollection()
  const update = useUpdateCollection()
  const publish = usePublishCollection()
  const archive = useArchiveCollection()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const collections = data?.data ?? []
  const busy =
    create.isPending ||
    update.isPending ||
    publish.isPending ||
    archive.isPending

  function openEdit(collection: Collection) {
    setEditing(collection)
    setDialogOpen(true)
  }

  function onSubmit(values: CollectionFormValues) {
    if (editing) {
      update.mutate(
        { id: editing.id, values },
        {
          onSuccess: () => {
            toast.success("Collection saved")
            setDialogOpen(false)
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        }
      )
      return
    }

    create.mutate(values, {
      onSuccess: () => {
        toast.success("Collection created")
        setDialogOpen(false)
      },
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  function onPublish(collection: Collection) {
    publish.mutate(collection.id, {
      onSuccess: () => toast.success("Collection published"),
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  function onArchive(collection: Collection) {
    archive.mutate(collection.id, {
      onSuccess: () => toast.success("Collection archived"),
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline">{collections.length} collections</Badge>
        <Button nativeButton={false} render={<Link href="/collections/new" />}>
          <PlusIcon className="size-4" />
          New collection
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
      ) : isPending || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-96 rounded-lg" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No collections yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              busy={busy}
              onArchive={onArchive}
              onEdit={openEdit}
              onPublish={onPublish}
            />
          ))}
        </div>
      )}

      <CollectionDialog
        key={editing?.id ?? "new"}
        collection={editing}
        open={dialogOpen}
        saving={create.isPending || update.isPending}
        onOpenChange={setDialogOpen}
        onSubmit={onSubmit}
      />
    </div>
  )
}
