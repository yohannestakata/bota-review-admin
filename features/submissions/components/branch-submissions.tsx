"use client"

import {
  ArrowRightIcon,
  BanIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
} from "lucide-react"
import type { ComponentType } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiErrorMessage } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { DISMISS_REASONS, formatDate, isAutoAppliedField, reviewAction } from "../format"
import {
  useBranchSubmissions,
  useDismissSubmission,
  useReviewSubmission,
} from "../queries"
import type {
  PlaceMissingDetails,
  SubmissionListItem,
  SubmissionType,
} from "../types"

const TYPE_ICON: Record<
  SubmissionType,
  ComponentType<{ className?: string }>
> = {
  field_correction: PencilIcon,
  place_missing: MapPinIcon,
  temporarily_closed: ClockIcon,
  permanently_closed: BanIcon,
}

function cardTitle(submission: SubmissionListItem): string {
  switch (submission.type) {
    case "field_correction":
      return submission.fieldName
        ? `${submission.fieldName} correction`
        : "Correction"
    case "place_missing":
      return "Missing place"
    case "temporarily_closed":
      return "Temporarily closed"
    case "permanently_closed":
      return "Permanently closed"
  }
}

// Short, action-first button label tuned for the narrow aside (the dialog uses
// the longer reviewAction labels).
function shortLabel(submission: SubmissionListItem): string {
  if (submission.type === "permanently_closed") return "Archive"
  if (
    submission.type === "field_correction" &&
    isAutoAppliedField(submission.fieldName)
  ) {
    return "Apply"
  }
  return "Resolve"
}

function CardBody({ submission }: { submission: SubmissionListItem }) {
  if (submission.type === "field_correction") {
    return (
      <div className="rounded-md bg-muted/60 p-2.5 text-sm">
        {submission.currentValue ? (
          <div className="text-muted-foreground line-through decoration-muted-foreground/40">
            {submission.currentValue}
          </div>
        ) : (
          <div className="text-xs italic text-muted-foreground">
            currently empty
          </div>
        )}
        <div className="mt-1 flex items-start gap-1.5">
          <ArrowRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span className="break-words font-medium">
            {submission.suggestedValue}
          </span>
        </div>
      </div>
    )
  }

  if (submission.type === "place_missing") {
    const details = submission.details as PlaceMissingDetails | null
    const rows: [string, string][] = []
    if (details?.neighborhood) rows.push(["Area", details.neighborhood])
    if (details?.contactPhone) rows.push(["Phone", details.contactPhone])
    if (details?.description) rows.push(["About", details.description])
    if (!rows.length) return null
    return (
      <dl className="space-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="w-12 shrink-0 text-xs text-muted-foreground">
              {label}
            </dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return null
}

function cardHint(submission: SubmissionListItem): string | null {
  switch (submission.type) {
    case "place_missing":
      return "Enrich the form and publish, or resolve to close."
    case "temporarily_closed":
      return "Update the branch, or resolve to close."
    case "permanently_closed":
      return "Archives this branch."
    default:
      return null
  }
}

function SubmissionCard({ submission }: { submission: SubmissionListItem }) {
  const review = useReviewSubmission()
  const dismiss = useDismissSubmission()
  const busy = review.isPending || dismiss.isPending
  const action = reviewAction(submission)
  const Icon = TYPE_ICON[submission.type]
  const hint = cardHint(submission)
  const isHigh = submission.priority === "high"

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
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-xs",
        isHigh && "border-l-2 border-l-destructive"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium capitalize">
              {cardTitle(submission)}
            </span>
            {isHigh ? (
              <span className="shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                High
              </span>
            ) : null}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {submission.user.displayName ?? "Unknown"} ·{" "}
            {formatDate(submission.createdAt)}
          </div>
        </div>
      </div>

      <div className="mt-2.5 space-y-2.5">
        <CardBody submission={submission} />

        {submission.note ? (
          <p className="border-l-2 pl-2.5 text-xs italic text-muted-foreground">
            “{submission.note}”
          </p>
        ) : null}

        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant={action.variant}
          className="flex-1"
          disabled={busy}
          onClick={onResolve}
        >
          {review.isPending ? action.pendingLabel : shortLabel(submission)}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                className="text-muted-foreground"
              />
            }
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Submissions</h3>
        {submissions.length ? (
          <span className="text-xs text-muted-foreground">
            {submissions.length} pending
          </span>
        ) : null}
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No pending submissions.
        </p>
      ) : (
        <div className="space-y-2.5">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  )
}
