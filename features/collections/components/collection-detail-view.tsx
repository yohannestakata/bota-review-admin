"use client"

import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ExternalLinkIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useBranches } from "@/features/branches"
import { priceLabel, STATUS_VARIANT } from "@/features/branches/format"
import { apiErrorMessage } from "@/lib/api-client"
import {
  useAddCollectionBranch,
  useArchiveCollection,
  useCollection,
  useCreateCollection,
  usePublishCollection,
  useRemoveCollectionBranch,
  useReorderCollectionBranches,
  useUpdateCollection,
} from "../queries"
import type {
  CollectionDetail,
  CollectionFormValues,
  CollectionStatus,
} from "../types"

const COLLECTION_STATUSES: CollectionStatus[] = [
  "draft",
  "published",
  "archived",
]

function emptyForm(): CollectionFormValues {
  return {
    name: "",
    description: "",
    coverImageUrl: "",
    displayOrder: "0",
    status: "draft",
  }
}

function formFromCollection(
  collection: CollectionDetail
): CollectionFormValues {
  return {
    name: collection.name,
    description: collection.description ?? "",
    coverImageUrl: collection.coverImageUrl ?? "",
    displayOrder: String(collection.displayOrder),
    status: collection.status,
  }
}

export function CollectionDetailView({
  collectionId,
}: {
  collectionId?: string
}) {
  const router = useRouter()
  const isNew = !collectionId
  const id = collectionId ?? ""
  const collectionQuery = useCollection(id, !isNew)
  const create = useCreateCollection()
  const update = useUpdateCollection()
  const publish = usePublishCollection()
  const archive = useArchiveCollection()
  const addBranch = useAddCollectionBranch(id)
  const removeBranch = useRemoveCollectionBranch(id)
  const reorderBranches = useReorderCollectionBranches(id)
  const [form, setForm] = useState<CollectionFormValues>(emptyForm)
  const [branchSearch, setBranchSearch] = useState("")
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const branchOptions = useBranches({
    q: branchSearch.trim() || undefined,
    page: 1,
    limit: 50,
  })

  const collection = collectionQuery.data
  useEffect(() => {
    // Sync the form after the async detail payload arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (collection) setForm(formFromCollection(collection))
  }, [collection])

  const memberIds = useMemo(
    () => new Set((collection?.branches ?? []).map((branch) => branch.id)),
    [collection]
  )
  const availableBranches = (branchOptions.data?.data ?? []).filter(
    (branch) => !memberIds.has(branch.id)
  )
  const busy =
    create.isPending ||
    update.isPending ||
    publish.isPending ||
    archive.isPending ||
    addBranch.isPending ||
    removeBranch.isPending ||
    reorderBranches.isPending

  const set = <K extends keyof CollectionFormValues>(
    key: K,
    value: CollectionFormValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  function saveMetadata() {
    if (isNew) {
      create.mutate(form, {
        onSuccess: (created) => {
          toast.success("Collection created")
          router.push(`/collections/${created.id}`)
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      })
      return
    }

    update.mutate(
      { id, values: form },
      {
        onSuccess: () => toast.success("Collection saved"),
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  function addSelectedBranch() {
    if (!selectedBranchId || !collection) return
    addBranch.mutate(
      {
        branchId: selectedBranchId,
        displayOrder: collection.branches.length,
      },
      {
        onSuccess: () => {
          toast.success("Branch added")
          setSelectedBranchId("")
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  function moveBranch(index: number, direction: -1 | 1) {
    if (!collection) return
    const next = [...collection.branches]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [branch] = next.splice(index, 1)
    next.splice(target, 0, branch)
    reorderBranches.mutate(
      next.map((item) => item.id),
      {
        onSuccess: () => toast.success("Collection order saved"),
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  if (!isNew && collectionQuery.isError) {
    return (
      <div className="p-4 text-sm text-destructive lg:p-6">
        {apiErrorMessage(collectionQuery.error)}
      </div>
    )
  }

  if (!isNew && collectionQuery.isPending) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          nativeButton={false}
          render={<Link href="/collections" />}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h2 className="text-xl font-semibold">
          {isNew ? "New collection" : collection?.name}
        </h2>
        {!isNew && collection ? (
          <Badge variant={STATUS_VARIANT[collection.status]}>
            {collection.status}
          </Badge>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {!isNew && collection?.status !== "published" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                publish.mutate(id, {
                  onSuccess: () => toast.success("Collection published"),
                  onError: (error) => toast.error(apiErrorMessage(error)),
                })
              }
            >
              Publish
            </Button>
          ) : null}
          {!isNew && collection?.status !== "archived" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                archive.mutate(id, {
                  onSuccess: () => toast.success("Collection archived"),
                  onError: (error) => toast.error(apiErrorMessage(error)),
                })
              }
            >
              Archive
            </Button>
          ) : null}
          <Button
            size="sm"
            disabled={busy || !form.name.trim()}
            onClick={saveMetadata}
          >
            {create.isPending || update.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,42rem)_minmax(24rem,1fr)]">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Collection</FieldLegend>
            <FieldDescription>
              Curated home-screen rail metadata and publishing state.
            </FieldDescription>
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
                  rows={4}
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="collection-cover">
                  Cover image URL
                </FieldLabel>
                <Input
                  id="collection-cover"
                  value={form.coverImageUrl}
                  onChange={(event) => set("coverImageUrl", event.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="collection-order">
                    Display order
                  </FieldLabel>
                  <Input
                    id="collection-order"
                    inputMode="numeric"
                    value={form.displayOrder}
                    onChange={(event) =>
                      set("displayOrder", event.target.value)
                    }
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
                      {COLLECTION_STATUSES.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="capitalize"
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>

          {!isNew ? (
            <>
              <FieldSeparator />
              <FieldSet>
                <FieldLegend>Add branch</FieldLegend>
                <FieldDescription>
                  Search across admin branches, then add the selected branch to
                  this rail.
                </FieldDescription>
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Search branches"
                    value={branchSearch}
                    onChange={(event) => setBranchSearch(event.target.value)}
                  />
                  <Select
                    value={selectedBranchId}
                    onValueChange={(value) => setSelectedBranchId(value ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.place.name}
                          {branch.label ? ` · ${branch.label}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    disabled={busy || !selectedBranchId}
                    onClick={addSelectedBranch}
                  >
                    <PlusIcon className="size-4" />
                    Add
                  </Button>
                </div>
                {branchOptions.isError ? (
                  <p className="text-sm text-destructive">
                    {apiErrorMessage(branchOptions.error)}
                  </p>
                ) : null}
              </FieldSet>
            </>
          ) : null}
        </FieldGroup>

        {!isNew && collection ? (
          <FieldSet>
            <FieldLegend>Branches</FieldLegend>
            <FieldDescription>
              Published collections need at least six published branches.
            </FieldDescription>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-2 rounded-md border p-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium">{collection.branchCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Published</div>
                  <div className="font-medium">
                    {collection.publishedBranchCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Needed</div>
                  <div className="font-medium">
                    {Math.max(0, 6 - collection.publishedBranchCount)}
                  </div>
                </div>
              </div>
              {collection.branches.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No branches in this collection.
                </div>
              ) : (
                collection.branches.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="grid gap-3 rounded-md border p-3 sm:grid-cols-[auto_1fr_auto]"
                  >
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy || index === 0}
                        onClick={() => moveBranch(index, -1)}
                      >
                        <ArrowUpIcon className="size-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={
                          busy || index === collection.branches.length - 1
                        }
                        onClick={() => moveBranch(index, 1)}
                      >
                        <ArrowDownIcon className="size-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {branch.placeName}
                          {branch.label ? ` · ${branch.label}` : ""}
                        </span>
                        <Badge variant={STATUS_VARIANT[branch.status]}>
                          {branch.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {branch.neighborhood?.name ?? "No neighborhood"} ·{" "}
                        {priceLabel(branch.priceLevel)} · {branch.reviewCount}{" "}
                        reviews
                      </div>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        nativeButton={false}
                        render={<Link href={`/branches/${branch.id}`} />}
                      >
                        <ExternalLinkIcon className="size-4" />
                        <span className="sr-only">Open branch</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() =>
                          removeBranch.mutate(branch.id, {
                            onSuccess: () => toast.success("Branch removed"),
                            onError: (error) =>
                              toast.error(apiErrorMessage(error)),
                          })
                        }
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">Remove branch</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </FieldSet>
        ) : null}
      </div>
    </div>
  )
}
