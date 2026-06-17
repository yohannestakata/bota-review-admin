"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { DataTable } from "@/components/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { apiErrorMessage } from "@/lib/api-client"
import { BRANCHES_PAGE_SIZE as PAGE_SIZE } from "../keys"
import { useBranches } from "../queries"
import type { BranchStatus } from "../types"
import { branchColumns } from "./branches-columns"
import { BranchFilters } from "./branch-filters"

const VALID_STATUS: BranchStatus[] = ["draft", "published", "archived"]

export function BranchesView() {
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status") as BranchStatus | null
  const status =
    statusParam && VALID_STATUS.includes(statusParam) ? statusParam : undefined

  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(timer)
  }, [q])

  const [page, setPage] = useState(1)
  // Reset to the first page whenever the filters change.
  useEffect(() => setPage(1), [status, debouncedQ])

  const { data, isPending, isError, error, isFetching } = useBranches({
    status,
    q: debouncedQ || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const toolbar = (
    <Input
      placeholder="Filter by name…"
      value={q}
      onChange={(event) => setQ(event.target.value)}
      className="h-8 max-w-xs"
    />
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {isError && !data ? (
          <div className="px-4 lg:px-6">
            <Card>
              <CardContent className="py-10 text-center text-sm text-destructive">
                {apiErrorMessage(error)}
              </CardContent>
            </Card>
          </div>
        ) : isPending || !data ? (
          <div className="space-y-2 px-4 lg:px-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="px-4 lg:px-6">
            <DataTable
              columns={branchColumns}
              data={data.data}
              getRowId={(row) => row.id}
              loading={isFetching}
              toolbar={toolbar}
              toolbarEnd={<BranchFilters status={status} />}
              serverPagination={{
                page,
                pageSize: PAGE_SIZE,
                total: data.total,
                onPageChange: setPage,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
