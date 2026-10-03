import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useUrlFilters } from "@/hooks/use-url-filters"

import { MIN_PUBLISHED, useCollections, useCreateCollection } from "./queries"

export function CollectionsPage() {
  const { set, page } = useUrlFilters()
  const collections = useCollections(page)
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex flex-col gap-4 p-6">
      <Item>
        <ItemContent>
          <ItemDescription>
            Curated lists on the home screen, like Best coffee in Bole. Shown in
            this order.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button onClick={() => setCreating(true)}>
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            New collection
          </Button>
        </ItemActions>
      </Item>

      <ApiErrorAlert
        error={collections.error}
        title="Couldn't load collections"
      />

      {collections.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : collections.data?.rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No collections yet</EmptyTitle>
            <EmptyDescription>
              Group great places around a theme.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreating(true)}>New collection</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.data?.rows.map((c) => (
            <Card key={c.id}>
              {c.coverImageUrl ? (
                <img
                  src={c.coverImageUrl}
                  alt=""
                  className="aspect-video object-cover"
                />
              ) : null}
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
                <CardAction>
                  <StatusBadge status={c.status} />
                </CardAction>
              </CardHeader>
              <CardFooter className="mt-auto justify-between gap-2">
                <CardDescription>
                  {c.publishedBranchCount} live of {c.branchCount}
                  {c.status !== "published" &&
                  c.publishedBranchCount < MIN_PUBLISHED
                    ? `, needs ${MIN_PUBLISHED - c.publishedBranchCount} more`
                    : ""}
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to={`/collections/${c.id}`} />}
                  nativeButton={false}
                >
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {collections.data && collections.data.total > collections.data.limit ? (
        <div className="flex justify-end">
          <Pager
            page={page}
            limit={collections.data.limit}
            total={collections.data.total}
            onPageChange={(p) => set("page", String(p))}
          />
        </div>
      ) : null}

      <NewCollectionDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}

function NewCollectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState("")
  const create = useCreateCollection()
  const navigate = useNavigate()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate(
              { name: name.trim() },
              { onSuccess: (c) => void navigate(`/collections/${c.id}`) }
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>
              Starts as a draft. Add at least {MIN_PUBLISHED} live places to
              publish.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="collection-name">Name</FieldLabel>
              <Input
                id="collection-name"
                placeholder="Best coffee in Bole"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
          </FieldGroup>
          <ApiErrorAlert error={create.error} title="Couldn't create it" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? <Spinner data-icon="inline-start" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
