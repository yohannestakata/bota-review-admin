"use client"

import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiErrorMessage } from "@/lib/api-client"
import {
  DISMISS_REASONS,
  formatDate,
  PRIORITY_VARIANT,
  reviewAction,
  SUBMISSION_TYPE_LABEL,
  SUBMISSION_TYPE_VARIANT,
} from "../format"
import { useDismissSubmission, useReviewSubmission } from "../queries"
import { useBranchSubmissions } from "../queries"
import type { PlaceMissingDetails, SubmissionListItem } from "../types"

function detailLines(submission: SubmissionListItem): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = []

  if (submission.type === "field_correction") {
    if (submission.fieldName)
      lines.push({ label: "Field", value: submission.fieldName })
    if (submission.currentValue)
      lines.push({ label: "Current", value: submission.currentValue })
    if (submission.suggestedValue)
      lines.push({ label: "Suggested", value: submission.suggestedValue })
  }

  if (submission.type === "place_missing") {
    const details = submission.details as PlaceMissingDetails | null
    if (details?.neighborhood)
      lines.push({ label: "Neighborhood", value: details.neighborhood })
    if (details?.contactPhone)
      lines.push({ label: "Phone", value: details.contactPhone })
  }

  if (submission.note) lines.push({ label: "Note", value: submission.note })

  return lines
}

function SubmissionCard({ submission }: { submission: SubmissionListItem }) {
  const review = useReviewSubmission()
  const dismiss = useDismissSubmission()
  const busy = review.isPending || dismiss.isPending
  const action = reviewAction(submission)
  const lines = detailLines(submission)

  function onResolve() {
    review.mutate(
      { id: submission.id },
      {
        onSuccess: () => toast.success(action.success),
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  function onDismiss(reason: string) {
    dismiss.mutate(
      { id: submission.id, reason },
      {
        onSuccess: () => toast.success("Dismissed"),
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  return (
    <div className="space-y-3 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={SUBMISSION_TYPE_VARIANT[submission.type]}>
          {SUBMISSION_TYPE_LABEL[submission.type]}
        </Badge>
        <Badge variant={PRIORITY_VARIANT[submission.priority]}>
          {submission.priority}
        </Badge>
      </div>

      {lines.length ? (
        <dl className="space-y-1.5">
          {lines.map((line) => (
            <div key={line.label} className="grid grid-cols-[84px_1fr] gap-2">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="break-words">{line.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {submission.user.displayName ?? "Unknown"} ·{" "}
        {formatDate(submission.createdAt)}
      </p>

      <p className="text-xs text-muted-foreground">{action.effect}</p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={busy}
          variant={action.variant}
          onClick={onResolve}
        >
          {review.isPending ? action.pendingLabel : action.label}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" disabled={busy} />}
          >
            Dismiss
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {DISMISS_REASONS.map((reason) => (
              <DropdownMenuItem key={reason} onClick={() => onDismiss(reason)}>
                {reason}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function BranchSubmissions({ branchId }: { branchId: string }) {
  const { data, isPending, isError, error } = useBranchSubmissions(branchId)
  const submissions = data?.data ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Pending submissions</h3>
        {submissions.length ? (
          <Badge variant="secondary">{submissions.length}</Badge>
        ) : null}
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pending submissions for this branch.
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  )
}
