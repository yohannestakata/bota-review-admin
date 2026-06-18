"use client"

import { useEffect, useState } from "react"

import { DataTable } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import { apiErrorMessage } from "@/lib/api-client"
import { PLACES_PAGE_SIZE as PAGE_SIZE } from "../keys"
import { usePlaces } from "../queries"
import { placeColumns } from "./places-columns"

export function PlacesView() {
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(timer)
  }, [q])

  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [debouncedQ])

  const { data, isError, error, isFetching } = usePlaces({
    q: debouncedQ || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const toolbar = (
    <Input
      placeholder="Filter by place…"
      value={q}
      onChange={(event) => setQ(event.target.value)}
      className="h-8 max-w-xs"
    />
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {isError && !data ? (
          <div className="px-4 py-10 text-center text-sm text-destructive lg:px-6">
            {apiErrorMessage(error)}
          </div>
        ) : (
          <div className="px-4 lg:px-6">
            <DataTable
              columns={placeColumns}
              data={data?.data ?? []}
              getRowId={(row) => row.id}
              loading={isFetching}
              toolbar={toolbar}
              serverPagination={{
                page,
                pageSize: PAGE_SIZE,
                total: data?.total ?? 0,
                onPageChange: setPage,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
