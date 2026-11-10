import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Image01Icon,
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
  EmptyContent,
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
  useDecideSuggestion,
  useSuggestedTags,
  type Evidence,
  type SuggestedPlace,
  type Suggestion,
  type SuggestionKind,
} from "./queries"

const KINDS: { value: SuggestionKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tag", label: "Tags" },
  { value: "foodCategory", label: "Food" },
  { value: "amenity", label: "Amenities" },
  { value: "cuisine", label: "Cuisines" },
]

const KIND_LABEL: Record<SuggestionKind, string> = {
  tag: "Tag",
  foodCategory: "Food",
  amenity: "Amenity",
  cuisine: "Cuisine",
}

const SOURCE_LABEL: Record<Evidence["source"], string> = {
  menu: "Menu",
  description: "Description",
  review: "Review",
}

export function SuggestedTagsPage() {
  const { get, set, page } = useUrlFilters()
  const q = get("q")
  const kind = get("kind") as SuggestionKind | ""
  const rows = useSuggestedTags(q, kind, page)
  const placeTypes = useLookup("place-types")

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Suggested tags</CardTitle>
          <CardDescription>
            Tags, amenities, food types and cuisines that places' menus,
            descriptions and reviews point to, read by the search model.
            Approving adds it to the place; rejecting teaches the model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ToggleGroup
              value={[kind || "all"]}
              onValueChange={(v) => v[0] && set("kind", v[0])}
              variant="outline"
              size="sm"
              spacing={1}
            >
              {KINDS.map((k) => (
                <ToggleGroupItem key={k.value} value={k.value}>
                  {k.label}
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
          <ApiErrorAlert error={rows.error} title="Couldn't load suggestions" />
          {rows.data && rows.data.total === 0 && (q || kind) ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nothing matches</EmptyTitle>
                <EmptyDescription>
                  No pending suggestions for this search or kind.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    set("q", "")
                    set("kind", "")
                  }}
                >
                  Show All
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
                <EmptyDescription>
                  No suggestions waiting. New ones appear as menus, descriptions
                  and reviews come in.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.isPending
                ? Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))
                : rows.data?.rows.map((row) => (
                    <PlaceSuggestions
                      key={row.placeId}
                      row={row}
                      typeName={placeTypes.nameOf(row.type)}
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

function PlaceSuggestions({
  row,
  typeName,
}: {
  row: SuggestedPlace
  typeName: string
}) {
  const decide = useDecideSuggestion()

  const run = (s: Suggestion, decision: "approve" | "reject") =>
    decide.mutateAsync({ id: s.id, decision, placeId: row.placeId })

  const onDecide = (s: Suggestion, decision: "approve" | "reject") => {
    run(s, decision).then(
      () =>
        toast.add({
          title:
            decision === "approve"
              ? `${s.name} added to ${row.name}`
              : `${s.name} rejected`,
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

  const onApproveAll = async () => {
    try {
      for (const s of row.suggestions) await run(s, "approve")
      toast.add({
        title: `${row.name}: ${row.suggestions.length} added`,
        description: row.suggestions.map((s) => s.name).join(", "),
        type: "success",
      })
    } catch (error) {
      toast.add({
        title: "Some didn't go through",
        description: (error as Error).message,
        type: "error",
      })
    }
  }

  const details = [
    typeName,
    row.area,
    row.branchCount > 1 ? `${row.branchCount} branches` : null,
  ].filter(Boolean)

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        {row.photoUrl ? (
          <img
            src={photoSize(row.photoUrl, 80)}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="size-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <HugeiconsIcon
              aria-hidden="true"
              icon={Image01Icon}
              strokeWidth={2}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            to={`/places/${row.placeId}`}
            className="font-medium hover:underline"
          >
            {row.name}
          </Link>
          <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
        </div>
        {row.suggestions.length > 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveAll}
            disabled={decide.isPending}
          >
            {decide.isPending ? <Spinner data-icon="inline-start" /> : null}
            Approve All
          </Button>
        ) : null}
      </div>
      <ul className="mt-3 flex flex-col divide-y">
        {row.suggestions.map((s) => (
          <li key={s.id} className="flex items-start gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{s.name}</span>
                <Badge variant="secondary">{KIND_LABEL[s.kind]}</Badge>
              </div>
              <ul className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                {s.evidence.map((e, i) => (
                  <li key={i} className="truncate">
                    <span className="text-foreground/70">
                      {SOURCE_LABEL[e.source]}:
                    </span>{" "}
                    {e.source === "menu" ? e.text : `“${e.text}”`}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button
                size="sm"
                onClick={() => onDecide(s, "approve")}
                disabled={decide.isPending}
              >
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={Tick02Icon}
                  strokeWidth={2}
                />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecide(s, "reject")}
                disabled={decide.isPending}
                aria-label={`Reject ${s.name}`}
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Cancel01Icon}
                  strokeWidth={2}
                />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
