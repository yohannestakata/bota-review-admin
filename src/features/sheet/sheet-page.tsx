import { Link } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { SearchInput } from "@/components/search-input"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUrlFilters } from "@/hooks/use-url-filters"

import { useLookup } from "@/features/places/queries"
import type { BranchPatch, ContentStatus } from "@/features/places/types"

import { AddRowDialog } from "./add-row-dialog"
import {
  HoursCell,
  SelectCell,
  TaxaCell,
  TaxonCell,
  TextCell,
  formatCoordinates,
  parseCoordinates,
} from "./cells"
import {
  useSavePlace,
  useSaveRow,
  useSetRowStatus,
  useSheetRows,
  type SheetRow,
  type SheetSort,
} from "./queries"

const STATUSES: { value: "all" | ContentStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Live" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
]

const STATUS_ITEMS: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Live" },
  { value: "archived", label: "Archived" },
]

// Columns, left to right. `place` ones belong to the place, so a change shows
// on every row of that place (a chain's branches).
const COLUMNS: {
  key: string
  label: string
  place?: boolean
  width: string
}[] = [
  { key: "name", label: "Place", place: true, width: "min-w-56" },
  { key: "label", label: "Location", width: "min-w-44" },
  { key: "type", label: "Type", place: true, width: "min-w-36" },
  { key: "status", label: "Status", width: "min-w-32" },
  { key: "area", label: "Area", width: "min-w-52" },
  { key: "address", label: "Address", width: "min-w-64" },
  { key: "directions", label: "Directions", width: "min-w-64" },
  { key: "pin", label: "Pin (lat, lng)", width: "min-w-52" },
  { key: "phone", label: "Phone", width: "min-w-40" },
  { key: "hours", label: "Hours", width: "min-w-60" },
  { key: "cuisines", label: "Cuisines", width: "min-w-64" },
  { key: "foodCategories", label: "Food categories", width: "min-w-64" },
  { key: "tags", label: "Tags", width: "min-w-64" },
  { key: "amenities", label: "Amenities", width: "min-w-64" },
  { key: "description", label: "Description", place: true, width: "min-w-80" },
]

const count = new Intl.NumberFormat()

/**
 * Every location as one row of a sheet, for curating data row by row. Each
 * cell saves on its own as you leave it or pick something.
 */
export function SheetPage() {
  const { get, set, page } = useUrlFilters()
  const q = get("q")
  const status = get("status", "all") as "all" | ContentStatus
  const sort = get("sort", "created") as SheetSort

  const rows = useSheetRows({
    q,
    status: status === "all" ? undefined : status,
    sort,
    page,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={q}
          onChange={(value) => set("q", value)}
          placeholder="Search name, location, address, area…"
          className="w-80"
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
          value={[sort]}
          onValueChange={(v) =>
            v[0] && set("sort", v[0] === "created" ? "" : v[0])
          }
          variant="outline"
          size="sm"
          spacing={1}
          aria-label="Order"
        >
          <ToggleGroupItem value="created">Newest</ToggleGroupItem>
          <ToggleGroupItem value="name">A–Z</ToggleGroupItem>
        </ToggleGroup>
        <div className="ml-auto flex items-center gap-3">
          {rows.data ? (
            <span className="text-sm text-muted-foreground tabular-nums">
              {count.format(rows.data.total)} rows
            </span>
          ) : null}
          {/* New rows are newest, so show them where they land. */}
          <AddRowDialog onAdded={() => set("sort", "")} />
        </div>
      </div>

      <ApiErrorAlert error={rows.error} title="Couldn't load the sheet" />

      {/* One scroll area both ways, so the header and the place column stay
          in view and the pager stays below. The stock <Table> scrolls only
          sideways inside itself, which unpins the header. */}
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
        <table data-slot="table" className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow>
              {COLUMNS.map((c, i) => (
                <TableHead
                  key={c.key}
                  className={
                    i === 0
                      ? `sticky left-0 z-10 bg-background ${c.width}`
                      : c.width
                  }
                >
                  {c.place ? (
                    <Tooltip>
                      <TooltipTrigger render={<span />}>
                        {c.label}
                      </TooltipTrigger>
                      <TooltipContent>
                        Belongs to the place: changes every location of it
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    c.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.isPending
              ? Array.from({ length: 12 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={COLUMNS.length}>
                      <Skeleton className="h-8" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.data?.rows.map((row) => (
                  <SheetRowView key={row.id} row={row} />
                ))}
          </TableBody>
        </table>
        {rows.data && rows.data.rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No rows match</EmptyTitle>
              <EmptyDescription>Try another search or filter.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                render={<Link to="/sheet" />}
                nativeButton={false}
              >
                Clear Filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : null}
      </div>

      {rows.data ? (
        <div className="flex justify-end">
          <Pager page={page} limit={rows.data.limit} total={rows.data.total} />
        </div>
      ) : null}
    </div>
  )
}

function SheetRowView({ row }: { row: SheetRow }) {
  const placeTypes = useLookup("place-types")
  const saveRow = useSaveRow()
  const savePlace = useSavePlace()
  const setStatus = useSetRowStatus()

  const save = (patch: BranchPatch) =>
    saveRow.mutateAsync({ id: row.id, patch })
  const savePlaceField = (
    patch: Parameters<typeof savePlace.mutateAsync>[0]["patch"]
  ) => savePlace.mutateAsync({ placeId: row.placeId, patch })

  // The place's own type stays listed even if it's since been retired.
  const typeItems = placeTypes.active.some((t) => t.id === row.place.type)
    ? placeTypes.active.map((t) => ({ value: t.id, label: t.name }))
    : [
        { value: row.place.type, label: placeTypes.nameOf(row.place.type) },
        ...placeTypes.active.map((t) => ({ value: t.id, label: t.name })),
      ]

  return (
    // No hover tint: the pinned Place cell can't take it without showing
    // the cells that scroll under it.
    <TableRow className="hover:bg-transparent">
      <TableCell className="sticky left-0 z-10 bg-background">
        <TextCell
          label="Place name"
          value={row.place.name}
          required
          maxLength={160}
          onSave={(name) => savePlaceField({ name })}
        />
      </TableCell>
      <TableCell>
        <TextCell
          label="Location"
          value={row.label}
          required
          maxLength={120}
          onSave={(label) => save({ label })}
        />
      </TableCell>
      <TableCell>
        <SelectCell
          label="Type"
          value={row.place.type}
          items={typeItems}
          onSave={(type) => savePlaceField({ type })}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <SelectCell
          label="Status"
          value={row.status}
          items={STATUS_ITEMS}
          onSave={(next) => setStatus.mutateAsync({ id: row.id, status: next })}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <TaxonCell
          kind="neighborhoods"
          label="Area"
          value={row.neighborhood}
          onSave={(area) => save({ neighborhoodId: area?.id ?? null })}
        />
      </TableCell>
      <TableCell>
        <TextCell
          label="Address"
          value={row.addressText}
          required
          maxLength={240}
          onSave={(addressText) => save({ addressText })}
        />
      </TableCell>
      <TableCell>
        <TextCell
          label="Directions"
          value={row.customDirections ?? ""}
          maxLength={160}
          placeholder={row.generatedDirections ?? "Behind Edna Mall…"}
          onSave={(directions) => save({ directions })}
        />
      </TableCell>
      <TableCell>
        <TextCell
          label="Pin"
          value={formatCoordinates(row.latitude, row.longitude)}
          placeholder="9.0108, 38.7613"
          parse={parseCoordinates}
          onSave={(pin) => {
            const [latitude = null, longitude = null] = pin
              ? pin.split(", ")
              : []
            return save({ latitude, longitude })
          }}
        />
      </TableCell>
      <TableCell>
        <TextCell
          label="Phone"
          value={row.phone ?? ""}
          maxLength={60}
          placeholder="+251…"
          onSave={(phone) => save({ phone: phone || null })}
        />
      </TableCell>
      <TableCell>
        <HoursCell
          label={`${row.place.name} · ${row.label}`}
          value={row.hours}
          onSave={(hours) => save({ hours })}
        />
      </TableCell>
      <TableCell>
        <TaxaCell
          kind="cuisines"
          label="Cuisines"
          value={row.cuisines}
          onSave={(v) => save({ cuisineIds: v.map((t) => t.id) })}
        />
      </TableCell>
      <TableCell>
        <TaxaCell
          kind="food-categories"
          label="Food categories"
          value={row.foodCategories}
          onSave={(v) => save({ foodCategoryIds: v.map((t) => t.id) })}
        />
      </TableCell>
      <TableCell>
        <TaxaCell
          kind="tags"
          label="Tags"
          value={row.tags}
          onSave={(v) => save({ tagIds: v.map((t) => t.id) })}
        />
      </TableCell>
      <TableCell>
        <TaxaCell
          kind="amenities"
          label="Amenities"
          value={row.amenities}
          onSave={(v) => save({ amenityIds: v.map((t) => t.id) })}
        />
      </TableCell>
      <TableCell>
        <TextCell
          label="Description"
          value={row.place.description ?? ""}
          maxLength={2000}
          onSave={(description) =>
            savePlaceField({ description: description || null })
          }
        />
      </TableCell>
    </TableRow>
  )
}
