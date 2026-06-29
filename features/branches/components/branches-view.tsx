"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArchiveIcon, CheckIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiErrorMessage } from "@/lib/api-client"
import { BRANCHES_PAGE_SIZE as PAGE_SIZE } from "../keys"
import { useArchiveBranch, useBranches, usePublishBranch } from "../queries"
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
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [status, debouncedQ])

  const { data, isError, error, isFetching } = useBranches({
    status,
    q: debouncedQ || undefined,
    page,
    limit: PAGE_SIZE,
  })
  const publish = usePublishBranch()
  const archive = useArchiveBranch()
  const visibleBranches = data?.data ?? []
  const visibleDrafts = visibleBranches.filter((branch) => branch.status === "draft")
  const visibleArchivable = visibleBranches.filter(
    (branch) => branch.status !== "archived"
  )
  const bulkBusy = publish.isPending || archive.isPending

  async function publishVisibleDrafts() {
    if (visibleDrafts.length === 0) return
    const results = await Promise.allSettled(
      visibleDrafts.map((branch) => publish.mutateAsync(branch.id))
    )
    const failed = results.filter((result) => result.status === "rejected")
    if (failed.length > 0) {
      toast.error(`${failed.length} branch(es) could not be published`)
      return
    }
    toast.success(`${visibleDrafts.length} branch(es) published`)
  }

  async function archiveVisibleBranches() {
    if (visibleArchivable.length === 0) return
    const results = await Promise.allSettled(
      visibleArchivable.map((branch) => archive.mutateAsync(branch.id))
    )
    const failed = results.filter((result) => result.status === "rejected")
    if (failed.length > 0) {
      toast.error(`${failed.length} branch(es) could not be archived`)
      return
    }
    toast.success(`${visibleArchivable.length} branch(es) archived`)
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Filter by name…"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        className="h-8 max-w-xs"
      />
      <Button size="sm" nativeButton={false} render={<Link href="/branches/new" />}>
        <PlusIcon className="size-4" />
        New branch
      </Button>
    </div>
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
              columns={branchColumns}
              data={data?.data ?? []}
              getRowId={(row) => row.id}
              loading={isFetching}
              toolbar={toolbar}
              toolbarEnd={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkBusy || visibleDrafts.length === 0}
                    onClick={publishVisibleDrafts}
                  >
                    <CheckIcon className="size-4" />
                    Publish visible
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkBusy || visibleArchivable.length === 0}
                    onClick={archiveVisibleBranches}
                  >
                    <ArchiveIcon className="size-4" />
                    Archive visible
                  </Button>
                  <BranchFilters status={status} />
                </div>
              }
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
