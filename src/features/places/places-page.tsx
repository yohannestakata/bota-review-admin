import { useNavigate } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { SearchInput } from "@/components/search-input"
import { StatusBadge } from "@/components/status-badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { ago } from "@/features/inbox/format"
import { useUrlFilters } from "@/hooks/use-url-filters"

import { PLACE_TYPES, typeLabel } from "./labels"
import { NewPlaceDialog } from "./new-place-dialog"
import { usePlaces } from "./queries"
import type { ContentStatus, PlaceType } from "./types"

const STATUSES: { value: "all" | ContentStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Live" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
]

export function PlacesPage() {
  const navigate = useNavigate()
  const { get, set, page } = useUrlFilters()
  const q = get("q")
  const status = get("status", "all") as "all" | ContentStatus
  const type = get("type", "all") as "all" | PlaceType

  const places = usePlaces({
    q,
    status: status === "all" ? undefined : status,
    type: type === "all" ? undefined : type,
    page,
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={q}
          onChange={(value) => set("q", value)}
          placeholder="Search places"
          className="w-72"
        />
        <ToggleGroup
          value={[status]}
          onValueChange={(v) => v[0] && set("status", v[0])}
          variant="outline"
          size="sm"
          spacing={1}
        >
          {STATUSES.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value}>
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          value={[type]}
          onValueChange={(v) => v[0] && set("type", v[0])}
          variant="outline"
          size="sm"
          spacing={1}
        >
          <ToggleGroupItem value="all">Any type</ToggleGroupItem>
          {PLACE_TYPES.map((t) => (
            <ToggleGroupItem key={t.value} value={t.value}>
              {t.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ml-auto">
          <NewPlaceDialog />
        </div>
      </div>

      <ApiErrorAlert error={places.error} title="Couldn't load places" />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Branches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {places.isPending
              ? Array.from({ length: 10 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-5" />
                    </TableCell>
                  </TableRow>
                ))
              : places.data?.rows.map((place) => (
                  <TableRow
                    key={place.id}
                    className="cursor-pointer"
                    onClick={() => void navigate(`/places/${place.id}`)}
                  >
                    <TableCell className="font-medium">{place.name}</TableCell>
                    <TableCell className="text-muted-foreground">{typeLabel(place.type)}</TableCell>
                    <TableCell className="text-right tabular-nums">{place.branchCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={place.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{ago(place.updatedAt)}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {places.data && places.data.rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No places match</EmptyTitle>
              <EmptyDescription>Try another search or filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>

      {places.data ? (
        <div className="flex justify-end">
          <Pager
            page={page}
            limit={places.data.limit}
            total={places.data.total}
            onPageChange={(p) => set("page", String(p))}
          />
        </div>
      ) : null}
    </div>
  )
}
