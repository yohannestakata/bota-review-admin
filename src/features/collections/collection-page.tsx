import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Image01Icon,
  Cancel01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { UnsavedChanges } from "@/components/unsaved-changes"
import { StatusBadge } from "@/components/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyMedia } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

import { BranchAdder } from "./branch-adder"
import {
  MIN_PUBLISHED,
  useCollection,
  useCollectionAction,
  type CollectionDetail,
} from "./queries"

export function CollectionPage() {
  const { id = "" } = useParams()
  const collection = useCollection(id)

  if (collection.isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }
  if (collection.error) {
    return (
      <div className="p-6">
        <ApiErrorAlert
          error={collection.error}
          title="Couldn't load this collection"
        />
      </div>
    )
  }
  return (
    <CollectionEditor key={collection.data.id} collection={collection.data} />
  )
}

function CollectionEditor({ collection }: { collection: CollectionDetail }) {
  const act = useCollectionAction(collection.id)
  const navigate = useNavigate()
  const [archiving, setArchiving] = useState(false)
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? "")
  const [cover, setCover] = useState(collection.coverImageUrl ?? "")

  const dirty =
    name.trim() !== collection.name ||
    description.trim() !== (collection.description ?? "") ||
    cover.trim() !== (collection.coverImageUrl ?? "")
  const coverOk = !cover.trim() || /^https:\/\/\S+$/.test(cover.trim())
  const short = MIN_PUBLISHED - collection.publishedBranchCount
  const ids = collection.branches.map((b) => b.id)

  const onError = (error: Error) =>
    toast.add({
      title: "That didn't go through",
      description: error.message,
      type: "error",
    })

  const move = (index: number, by: -1 | 1) => {
    const next = [...ids]
    const [moved] = next.splice(index, 1)
    next.splice(index + by, 0, moved)
    act.mutate({ action: "order", branchIds: next }, { onError })
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/collections" />}>
              Collections
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{collection.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Item>
        <ItemContent>
          <ItemTitle>
            {collection.name}
            <StatusBadge status={collection.status} />
          </ItemTitle>
          {collection.status !== "published" && short > 0 ? (
            <ItemDescription>
              Add {short} more live {short === 1 ? "place" : "places"} to
              publish.
            </ItemDescription>
          ) : null}
        </ItemContent>
        <ItemActions>
          {collection.status === "published" ? (
            <Button
              variant="outline"
              disabled={act.isPending}
              onClick={() =>
                act.mutate(
                  { action: "update", body: { status: "draft" } },
                  { onError }
                )
              }
            >
              Unpublish
            </Button>
          ) : (
            <Button
              disabled={short > 0 || act.isPending}
              onClick={() =>
                act.mutate(
                  { action: "publish" },
                  {
                    onSuccess: () =>
                      toast.add({
                        title: "Live in the app",
                        type: "success",
                      }),
                    onError,
                  }
                )
              }
            >
              Publish
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon" aria-label="More" />
              }
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setArchiving(true)}
              >
                Archive collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemActions>
      </Item>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          act.mutate(
            {
              action: "update",
              body: {
                name: name.trim(),
                description: description.trim() || null,
                coverImageUrl: cover.trim() || null,
              },
            },
            { onSuccess: () => toast.add({ title: "Saved", type: "success" }) }
          )
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Shown at the top of the collection in the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="collection-name">Name</FieldLabel>
                <Input
                  id="collection-name"
                  value={name}
                  maxLength={120}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="collection-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="collection-description"
                  rows={2}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <Field data-invalid={!coverOk || undefined}>
                <FieldLabel htmlFor="collection-cover">
                  Cover image link
                </FieldLabel>
                <Input
                  id="collection-cover"
                  type="url"
                  placeholder="https://"
                  value={cover}
                  aria-invalid={!coverOk || undefined}
                  onChange={(e) => setCover(e.target.value)}
                />
                <FieldDescription>
                  Optional. A wide photo works best.
                </FieldDescription>
              </Field>
              <AspectRatio ratio={16 / 9}>
                {/* Shown when there's no cover, or while it loads. */}
                <Empty className="absolute inset-0">
                  <EmptyMedia>
                    <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
                  </EmptyMedia>
                </Empty>
                {cover.trim() && coverOk ? (
                  <img
                    src={cover.trim()}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : null}
              </AspectRatio>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            {act.error && act.variables?.action === "update" ? (
              <ApiErrorAlert error={act.error} title="Couldn't save" />
            ) : null}
            <Field orientation="horizontal" className="justify-end">
              <Button
                type="submit"
                disabled={!dirty || !name.trim() || !coverOk || act.isPending}
              >
                {act.isPending && act.variables.action === "update" ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Save
              </Button>
            </Field>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Places</CardTitle>
          <CardDescription>
            {collection.branches.length}{" "}
            {collection.branches.length === 1 ? "place" : "places"},{" "}
            {collection.publishedBranchCount} live. Shown in this order.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BranchAdder
            exclude={new Set(ids)}
            onAdd={(b) =>
              act.mutate(
                { action: "add", branchId: b.id, displayOrder: ids.length },
                {
                  onSuccess: () =>
                    toast.add({
                      title: "Added",
                      description: b.place.name,
                      type: "success",
                    }),
                  onError,
                }
              )
            }
          />
          <ItemGroup>
            {collection.branches.map((b, i) => (
              <Item key={b.id} variant="outline" size="sm">
                {b.coverPhotoUrl ? (
                  <ItemMedia variant="image">
                    <img src={b.coverPhotoUrl} alt="" />
                  </ItemMedia>
                ) : (
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
                  </ItemMedia>
                )}
                <ItemContent>
                  <ItemTitle>
                    <Link to={`/places/${b.placeId}?branch=${b.id}`}>
                      {b.placeName}
                    </Link>
                    {b.status !== "published" ? (
                      <StatusBadge status={b.status} />
                    ) : null}
                  </ItemTitle>
                  <ItemDescription>
                    {b.label}
                    {b.neighborhood && b.neighborhood.name !== b.label
                      ? `, ${b.neighborhood.name}`
                      : ""}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move up"
                    disabled={i === 0 || act.isPending}
                    onClick={() => move(i, -1)}
                  >
                    <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move down"
                    disabled={i === ids.length - 1 || act.isPending}
                    onClick={() => move(i, 1)}
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${b.placeName}`}
                    disabled={act.isPending}
                    onClick={() =>
                      act.mutate(
                        { action: "remove", branchId: b.id },
                        { onError }
                      )
                    }
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>

      <UnsavedChanges when={dirty} />
      <AlertDialog open={archiving} onOpenChange={setArchiving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {collection.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the app. The places in it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                act.mutate(
                  { action: "archive" },
                  {
                    onSuccess: () => {
                      toast.add({
                        title: "Archived",
                        description: collection.name,
                        type: "success",
                      })
                      void navigate("/collections")
                    },
                    onError,
                  }
                )
              }
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
