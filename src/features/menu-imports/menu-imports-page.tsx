import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { SearchInput } from "@/components/search-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLookup } from "@/features/places/queries"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { photoSize } from "@/lib/images"

import {
  useDecideMenuImport,
  useMenuImports,
  type ImportStatus,
  type MenuImport,
} from "./queries"

const STATUSES: { value: ImportStatus; label: string }[] = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

const SOURCE_LABEL: Record<string, string> = {
  website: "its website",
  deliveraddis: "Deliver Addis",
  bota: "Bota",
  owner: "the owner",
}

const birr = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

export function MenuImportsPage() {
  const { get, set, page } = useUrlFilters()
  const q = get("q")
  const status = (get("status") || "pending") as ImportStatus
  const rows = useMenuImports(status, q, page)
  const placeTypes = useLookup("place-types")

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Menu imports</CardTitle>
          <CardDescription>
            Menus read from places' own sites and other menu pages. A place with
            no menu gets the whole menu; a place with an imported menu gets only
            the dishes it lacks. Places with a menu from Bota or the owner are
            never touched. Nothing shows on the place until it's approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
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
            <SearchInput
              value={q}
              onChange={(v) => set("q", v)}
              placeholder="Search places…"
              className="w-56"
            />
          </div>
          <ApiErrorAlert
            error={rows.error}
            title="Couldn't load menu imports"
          />
          {rows.data && rows.data.total === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                  />
                </EmptyMedia>
                <EmptyTitle>
                  {status === "pending" && !q ? "All clear" : "Nothing here"}
                </EmptyTitle>
                <EmptyDescription>
                  {status === "pending" && !q
                    ? "No menus waiting. New ones appear as more menus are collected."
                    : "No menu imports match."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.isPending
                ? Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-28" />
                  ))
                : rows.data?.rows.map((row) => (
                    <ImportCard
                      key={row.id}
                      row={row}
                      typeName={placeTypes.nameOf(row.placeType)}
                    />
                  ))}
            </div>
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

function ImportCard({ row, typeName }: { row: MenuImport; typeName: string }) {
  const decide = useDecideMenuImport()

  const onDecide = (decision: "approve" | "reject") => {
    decide.mutateAsync({ id: row.id, decision }).then(
      (res) =>
        toast.add({
          title:
            decision === "approve"
              ? `${row.placeName}: ${res.data.added} dishes added`
              : `${row.placeName}: import rejected`,
          type: "success",
        }),
      (error: Error) =>
        toast.add({
          title: "That didn't go through",
          description: error.message,
          type: "error",
        })
    )
  }

  const now = row.current.dishes
    ? `Now: ${row.current.dishes} dishes from ${row.current.sources
        .map((s) => SOURCE_LABEL[s] ?? s)
        .join(" and ")}`
    : "Now: no menu"

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/places/${row.placeId}?branch=${row.branchId}`}
              className="font-medium hover:underline"
            >
              {row.placeName}
            </Link>
            <Badge variant={row.kind === "new" ? "default" : "secondary"}>
              {row.kind === "new"
                ? `New menu · ${row.dishCount} dishes`
                : `Adds ${row.dishCount} dishes`}
            </Badge>
            {row.photoCount ? (
              <Badge variant="outline">{row.photoCount} photos</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {[typeName, row.branchLabel, now].filter(Boolean).join(" · ")}
          </p>
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            {row.sourceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </a>
        </div>
        {row.status === "pending" ? (
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="sm"
              onClick={() => onDecide("approve")}
              disabled={decide.isPending}
            >
              {decide.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={Tick02Icon}
                  strokeWidth={2}
                />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecide("reject")}
              disabled={decide.isPending}
              aria-label={`Reject the ${row.placeName} import`}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={Cancel01Icon}
                strokeWidth={2}
              />
            </Button>
          </div>
        ) : (
          <Badge variant="outline" className="capitalize">
            {row.status}
          </Badge>
        )}
      </div>
      <details className="group mt-3">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground select-none hover:text-foreground">
          Show the dishes ({row.sections.length}{" "}
          {row.sections.length === 1 ? "section" : "sections"})
        </summary>
        <div className="mt-2 flex flex-col gap-4">
          {row.sections.map((section, s) => (
            <section key={s}>
              <h3 className="mb-1 text-sm font-semibold">{section.name}</h3>
              <ul className="flex flex-col divide-y">
                {section.dishes.map((dish, d) => (
                  <li key={d} className="flex items-center gap-3 py-1.5">
                    {dish.imageUrl ? (
                      <img
                        src={photoSize(dish.imageUrl, 80)}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{dish.name}</p>
                      {dish.description ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {dish.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">
                      {dish.sizes?.length
                        ? dish.sizes
                            .map(
                              (size) =>
                                `${size.label} ${birr.format(size.price)}`
                            )
                            .join(" · ") + " Br"
                        : `${birr.format(dish.price)} Br`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    </div>
  )
}
