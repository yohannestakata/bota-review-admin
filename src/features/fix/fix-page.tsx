import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { SearchInput } from "@/components/search-input"
import { StatusBadge } from "@/components/status-badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { cn } from "@/lib/utils"

import { useQualityIssues, useQualityRows } from "./queries"

export function FixPage() {
  const navigate = useNavigate()
  const { get, set, page } = useUrlFilters()
  const issues = useQualityIssues()
  const q = get("q")
  // Default to the first check that has something to fix.
  const issueKey = get("issue") || issues.data?.find((i) => i.count > 0)?.key || issues.data?.[0]?.key
  const issue = issues.data?.find((i) => i.key === issueKey)
  const rows = useQualityRows(issueKey, q, page)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 lg:flex-row">
      <nav aria-label="Checks" className="flex shrink-0 flex-col gap-1 lg:w-72">
        {issues.isPending
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)
          : issues.data?.map((i) => (
              <button
                key={i.key}
                type="button"
                onClick={() => set("issue", i.key)}
                aria-current={i.key === issueKey ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                  i.key === issueKey && "bg-muted font-medium"
                )}
              >
                <span className="flex-1">{i.title}</span>
                <span
                  className={cn("tabular-nums", i.count === 0 ? "text-muted-foreground" : "text-foreground")}
                >
                  {i.count.toLocaleString()}
                </span>
              </button>
            ))}
        <ApiErrorAlert error={issues.error} title="Couldn't load the checks" />
      </nav>

      <section className="flex min-w-0 flex-1 flex-col gap-4">
        {issue ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="text-lg font-semibold">{issue.title}</h2>
              <p className="text-sm text-muted-foreground">{issue.description}</p>
            </div>
            <SearchInput value={q} onChange={(v) => set("q", v)} placeholder="Search" className="w-60" />
          </div>
        ) : null}

        <ApiErrorAlert error={rows.error} title="Couldn't load this list" />

        {rows.data && rows.data.total === 0 && !q ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>All clear</EmptyTitle>
              <EmptyDescription>Nothing to fix here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Place</TableHead>
                  <TableHead>Neighborhood</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.isPending || !issueKey
                  ? Array.from({ length: 8 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-5" />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.data?.rows.map((row) => (
                      <TableRow
                        key={row.branchId}
                        className="cursor-pointer"
                        onClick={() => void navigate(`/places/${row.placeId}?branch=${row.branchId}`)}
                      >
                        <TableCell>
                          <span className="font-medium">{row.placeName}</span>
                          <span className="text-muted-foreground"> · {row.label}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.neighborhood}</TableCell>
                        <TableCell>{row.note}</TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rows.data && rows.data.total > 0 ? (
          <div className="flex justify-end">
            <Pager
              page={page}
              limit={rows.data.limit}
              total={rows.data.total}
              onPageChange={(p) => set("page", String(p))}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
