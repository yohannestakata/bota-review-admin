import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { SearchInput } from "@/components/search-input"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUrlFilters } from "@/hooks/use-url-filters"

import { useQualityIssues, useQualityRows } from "./queries"

export function FixPage() {
  const { get, set, page } = useUrlFilters()
  const issues = useQualityIssues()
  const q = get("q")
  // Default to the first check that has something to fix.
  const issueKey =
    get("issue") ||
    issues.data?.find((i) => i.count > 0)?.key ||
    issues.data?.[0]?.key
  const issue = issues.data?.find((i) => i.key === issueKey)
  const rows = useQualityRows(issueKey, q, page)

  if (issues.isPending) {
    return (
      <div className="flex gap-6 p-6">
        <Skeleton className="h-80 w-64" />
        <Skeleton className="h-96 flex-1" />
      </div>
    )
  }
  if (issues.error) {
    return (
      <div className="p-6">
        <ApiErrorAlert error={issues.error} title="Couldn't load the checks" />
      </div>
    )
  }

  return (
    <Tabs
      value={issueKey}
      onValueChange={(value) => set("issue", String(value))}
      orientation="vertical"
      className="gap-6 p-6"
    >
      <TabsList variant="line" className="w-64 shrink-0">
        {issues.data.map((i) => (
          <TabsTrigger key={i.key} value={i.key}>
            {i.title}
            <Badge
              variant={i.count === 0 ? "outline" : "secondary"}
              className="ml-auto"
            >
              {i.count.toLocaleString()}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {issue ? (
        <TabsContent value={issue.key} className="min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>{issue.title}</CardTitle>
              <CardDescription>{issue.description}</CardDescription>
              <CardAction>
                <SearchInput
                  value={q}
                  onChange={(v) => set("q", v)}
                  placeholder="Search"
                  className="w-60"
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <ApiErrorAlert
                error={rows.error}
                title="Couldn't load this list"
              />
              {rows.data && rows.data.total === 0 && !q ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        strokeWidth={2}
                      />
                    </EmptyMedia>
                    <EmptyTitle>All clear</EmptyTitle>
                    <EmptyDescription>Nothing to fix here.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Place</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Problem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.isPending
                      ? Array.from({ length: 8 }, (_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={4}>
                              <Skeleton className="h-5" />
                            </TableCell>
                          </TableRow>
                        ))
                      : rows.data?.rows.map((row) => (
                          <TableRow key={row.branchId} className="relative">
                            <TableCell className="font-medium">
                              {/* Covers the row; carries the check so the place page can offer "next". */}
                              <Link
                                to={`/places/${row.placeId}?branch=${row.branchId}&fix=${issue.key}`}
                                className="after:absolute after:inset-0"
                              >
                                {row.placeName}
                              </Link>
                            </TableCell>
                            <TableCell>{row.label}</TableCell>
                            <TableCell>{row.note}</TableCell>
                            <TableCell>
                              <StatusBadge status={row.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {rows.data && rows.data.total > 0 ? (
              <CardFooter className="justify-end">
                <Pager
                  page={page}
                  limit={rows.data.limit}
                  total={rows.data.total}
                  onPageChange={(p) => set("page", String(p))}
                />
              </CardFooter>
            ) : null}
          </Card>
        </TabsContent>
      ) : null}
    </Tabs>
  )
}
