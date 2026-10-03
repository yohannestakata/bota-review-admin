import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { ago } from "@/features/inbox/format"

import { useFailedJobs, useRetryJob, useRunPendingJobs } from "./queries"

/** "review.approved" → "Review approved" */
const jobLabel = (type: string) => {
  const words = type.replace(/[._-]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function FailedJobs() {
  const jobs = useFailedJobs()
  const retry = useRetryJob()
  const runPending = useRunPendingJobs()

  const onError = (error: Error) =>
    toast.add({ title: "That didn't go through", description: error.message, type: "error" })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Emails, notifications and other work that runs after an action. These ones failed.
        </p>
        <Button
          variant="outline"
          className="ml-auto"
          disabled={runPending.isPending}
          onClick={() =>
            runPending.mutate(undefined, {
              onSuccess: (result) =>
                toast.add({ title: `${result.processed} waiting jobs processed`, type: "success" }),
              onError,
            })
          }
        >
          Run waiting jobs now
        </Button>
      </div>

      <ApiErrorAlert error={jobs.error} title="Couldn't load jobs" />

      {jobs.isPending ? (
        <Skeleton className="h-40" />
      ) : jobs.data?.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Nothing failed</EmptyTitle>
            <EmptyDescription>Everything that ran went through.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Tries</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.data?.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{jobLabel(job.type)}</span>
                      <span className="max-w-64 truncate text-xs text-muted-foreground">
                        {Object.entries(job.payloadSummary)
                          .filter(([, v]) => v !== null && v !== undefined)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(", ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-80 truncate text-muted-foreground" title={job.lastError ?? undefined}>
                    {job.lastError}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {job.attempts}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ago(job.updatedAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!job.canRetry || retry.isPending}
                      onClick={() =>
                        retry.mutate(job.id, {
                          onSuccess: () => toast.add({ title: "Queued again", type: "success" }),
                          onError,
                        })
                      }
                    >
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
