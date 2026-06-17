"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { DataTable } from "@/components/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { apiErrorMessage } from "@/lib/api-client"
import { SUBMISSIONS_PAGE_SIZE as PAGE_SIZE } from "../keys"
import { useSubmissions } from "../queries"
import type {
  SubmissionListItem,
  SubmissionStatus,
  SubmissionType,
} from "../types"
import { SubmissionDetailDialog } from "./submission-detail-dialog"
import { SubmissionFilters } from "./submission-filters"
import { submissionColumns } from "./submissions-columns"

const VALID_STATUS: SubmissionStatus[] = ["pending", "reviewed", "dismissed"]
const VALID_TYPE: SubmissionType[] = [
  "field_correction",
  "place_missing",
  "temporarily_closed",
  "permanently_closed",
]

export function SubmissionsView() {
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status") as SubmissionStatus | null
  const typeParam = searchParams.get("type") as SubmissionType | null

  const status: SubmissionStatus =
    statusParam && VALID_STATUS.includes(statusParam) ? statusParam : "pending"
  const type =
    typeParam && VALID_TYPE.includes(typeParam) ? typeParam : undefined

  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(timer)
  }, [q])

  const [page, setPage] = useState(1)
  // Reset to the first page whenever the filters change.
  useEffect(() => setPage(1), [status, type, debouncedQ])

  const [selected, setSelected] = useState<SubmissionListItem | null>(null)

  const { data, isPending, isError, error, isFetching } = useSubmissions({
    status,
    type,
    q: debouncedQ || undefined,
    page,
    limit: PAGE_SIZE,
  })

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
              columns={submissionColumns}
              data={data.data}
              getRowId={(row) => row.id}
              loading={isFetching}
              onRowClick={setSelected}
              toolbar={
                <Input
                  placeholder="Search reporter, note…"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  className="h-8 max-w-xs"
                />
              }
              toolbarEnd={<SubmissionFilters status={status} type={type} />}
              serverPagination={{
                page,
                pageSize: PAGE_SIZE,
                total: data.total,
                onPageChange: setPage,
              }}
            />
          </div>
        )}

        {selected ? (
          <SubmissionDetailDialog
            submission={selected}
            open={selected !== null}
            onOpenChange={(o) => !o && setSelected(null)}
          />
        ) : null}
      </div>
    </div>
  )
}
