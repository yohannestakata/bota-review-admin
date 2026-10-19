import { CheckmarkCircle02Icon, Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { SearchInput } from "@/components/search-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { useSetCuisines, useLookup } from "@/features/places/queries"
import { TaxonMultiPicker } from "@/features/places/taxon-picker"
import type { Taxon } from "@/features/places/types"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { thumbnail } from "@/lib/cloudinary"
import type { Page } from "@/lib/paginated"

import {
  needsCuisineKey,
  useNeedsCuisine,
  type NeedsCuisineRow,
} from "./queries"

export function NeedsCuisinePage() {
  const { get, set, page } = useUrlFilters()
  const q = get("q")
  const rows = useNeedsCuisine(q, page)
  const placeTypes = useLookup("place-types")

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Needs cuisine</CardTitle>
          <CardDescription>
            Live restaurants, and places named as serving meals, with no cuisine
            yet. Tagged places show up on the website's cuisine pages.
          </CardDescription>
          <CardAction>
            <SearchInput
              value={q}
              onChange={(v) => set("q", v)}
              placeholder="Search places…"
              className="w-60"
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ApiErrorAlert error={rows.error} title="Couldn't load this list" />
          {rows.data && rows.data.total === 0 && q ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No places match “{q}”</EmptyTitle>
                <EmptyDescription>
                  Check the spelling, or clear the search to see all of them.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => set("q", "")}>
                  Clear Search
                </Button>
              </EmptyContent>
            </Empty>
          ) : rows.data && rows.data.total === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                  />
                </EmptyMedia>
                <EmptyTitle>All clear</EmptyTitle>
                <EmptyDescription>Every place has a cuisine.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {rows.isPending
                ? Array.from({ length: 8 }, (_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))
                : rows.data?.rows.map((row) => (
                    <PlaceRow
                      key={row.placeId}
                      row={row}
                      typeName={placeTypes.nameOf(row.type)}
                    />
                  ))}
            </ItemGroup>
          )}
        </CardContent>
        {rows.data && rows.data.total > 0 ? (
          <CardFooter className="justify-end">
            <Pager
              page={page}
              limit={rows.data.limit}
              total={rows.data.total}
            />
          </CardFooter>
        ) : null}
      </Card>
    </div>
  )
}

function PlaceRow({
  row,
  typeName,
}: {
  row: NeedsCuisineRow
  typeName: string
}) {
  const [cuisines, setCuisines] = useState<Taxon[]>([])
  const [tried, setTried] = useState(false)
  const save = useSetCuisines()
  const queryClient = useQueryClient()
  const invalid = tried && cuisines.length === 0
  const pickerId = `cuisines-${row.placeId}`

  const onSave = () => {
    if (save.isPending) return
    if (cuisines.length === 0) {
      setTried(true)
      toast.add({
        title: "Pick a cuisine first",
        description: row.name,
        type: "error",
      })
      return
    }
    save.mutate(
      { branchIds: row.branchIds, cuisineIds: cuisines.map((c) => c.id) },
      {
        onSuccess: () => {
          // Off the list now, without waiting for the refetch.
          queryClient.setQueriesData<Page<NeedsCuisineRow>>(
            { queryKey: needsCuisineKey },
            (page) =>
              page && {
                ...page,
                rows: page.rows.filter((r) => r.placeId !== row.placeId),
                total: page.total - 1,
              }
          )
          toast.add({
            title: `${row.name} tagged`,
            description: cuisines.map((c) => c.name).join(", "),
            type: "success",
          })
        },
        onError: (error) =>
          toast.add({
            title: "That didn't go through",
            description: error.message,
            type: "error",
          }),
      }
    )
  }

  const details = [
    typeName,
    row.area,
    row.branchIds.length > 1 ? `${row.branchIds.length} branches` : null,
    `${row.reviewCount} ${row.reviewCount === 1 ? "review" : "reviews"}`,
  ].filter(Boolean)

  return (
    <Item variant="outline" size="sm">
      {row.photoUrl ? (
        <ItemMedia variant="image">
          <img
            src={thumbnail(row.photoUrl, 80)}
            alt=""
            width={40}
            height={40}
            loading="lazy"
          />
        </ItemMedia>
      ) : (
        <ItemMedia variant="icon">
          <HugeiconsIcon
            aria-hidden="true"
            icon={Image01Icon}
            strokeWidth={2}
          />
        </ItemMedia>
      )}
      <ItemContent>
        <ItemTitle>
          <Link to={`/places/${row.placeId}?branch=${row.branchIds[0]}`}>
            {row.name}
          </Link>
        </ItemTitle>
        <ItemDescription>{details.join(" · ")}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <div className="w-80">
          <Label htmlFor={pickerId} className="sr-only">
            Cuisines of {row.name}
          </Label>
          <TaxonMultiPicker
            id={pickerId}
            kind="cuisines"
            value={cuisines}
            onChange={setCuisines}
            placeholder="Ethiopian, Italian…"
            invalid={invalid}
          />
        </div>
        <Button variant="outline" onClick={onSave}>
          {save.isPending ? <Spinner data-icon="inline-start" /> : null}
          Save
        </Button>
      </ItemActions>
    </Item>
  )
}
