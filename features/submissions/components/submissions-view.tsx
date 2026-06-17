"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { DataTable } from "@/components/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiErrorMessage } from "@/lib/api-client"
import { useSubmissions } from "../queries"
import type { SubmissionStatus, SubmissionType } from "../types"
import { SubmissionFilters } from "./submission-filters"
import { getSubmissionColumns } from "./submissions-columns"

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

  const { data, isPending, isError, error } = useSubmissions({ status, type })
  const columns = useMemo(
    () => getSubmissionColumns(status === "pending"),
    [status]
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
              columns={columns}
              data={data}
              getRowId={(row) => row.id}
              filterColumn="reporter"
              filterPlaceholder="Filter by reporter…"
              toolbar={<SubmissionFilters status={status} type={type} />}
            />
          </div>
        )}
      </div>
    </div>
  )
}
