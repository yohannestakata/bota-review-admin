"use client"

import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiErrorMessage } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  DISMISS_REASONS,
  formatDate,
  isManualReview,
  reviewAction,
} from "../format"
import {
  useBranchSubmissions,
  useDismissSubmission,
  useReviewSubmission,
} from "../queries"
import type { PlaceMissingDetails, SubmissionListItem } from "../types"

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

// Manual types resolve only by editing the branch and saving, so they get an
// "Edit"/"Enrich" button instead of a one-click action that wouldn't actually
// apply the change.
function editLabel(submission: SubmissionListItem): string {
  return submission.type === "place_missing" ? "Enrich" : "Edit"
}

// Label for the genuine one-click actions (auto-applied corrections, closures).
function oneClickLabel(submission: SubmissionListItem): string {
  return submission.type === "permanently_closed" ? "Archive" : "Apply"
}

function detailRows(submission: SubmissionListItem): [string, string][] {
  if (submission.type === "field_correction") {
    const rows: [string, string][] = []
    if (submission.currentValue) rows.push(["From", submission.currentValue])
    if (submission.suggestedValue) rows.push(["To", submission.suggestedValue])
    return rows
  }
  if (submission.type === "place_missing") {
    const details = submission.details as PlaceMissingDetails | null
    const rows: [string, string][] = []
    if (details?.neighborhood) rows.push(["Area", details.neighborhood])
    if (details?.contactPhone) rows.push(["Phone", details.contactPhone])
    if (details?.description) rows.push(["About", details.description])
    return rows
  }
  return []
}

function SubmissionCard({
  submission,
  active,
  onEdit,
}: {
  submission: SubmissionListItem
  active: boolean
  onEdit: (submission: SubmissionListItem) => void
}) {
  const review = useReviewSubmission()
  const dismiss = useDismissSubmission()
  const busy = review.isPending || dismiss.isPending
  const action = reviewAction(submission)
  const rows = detailRows(submission)
  const manual = isManualReview(submission)

  function onOneClick() {
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
    <Card size="sm" className={cn(active && "ring-2 ring-primary")}>
      <CardHeader>
        <CardTitle className="capitalize">{cardTitle(submission)}</CardTitle>
        <CardDescription>
          {submission.user.displayName ?? "Unknown"} ·{" "}
          {formatDate(submission.createdAt)}
        </CardDescription>
        {submission.priority === "high" ? (
          <CardAction>
            <Badge variant="destructive">High</Badge>
          </CardAction>
        ) : null}
      </CardHeader>

      {rows.length || submission.note ? (
        <CardContent className="grid gap-3">
          {rows.length ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              {rows.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {submission.note ? (
            <p className="text-muted-foreground">“{submission.note}”</p>
          ) : null}
        </CardContent>
      ) : null}

      {active ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Editing below — Save the branch to resolve this.
          </p>
        </CardContent>
      ) : null}

      <CardFooter className="gap-2">
        {manual ? (
          <Button size="sm" disabled={busy} onClick={() => onEdit(submission)}>
            {editLabel(submission)}
          </Button>
        ) : (
          <Button
            size="sm"
            variant={action.variant}
            disabled={busy}
            onClick={onOneClick}
          >
            {review.isPending ? action.pendingLabel : oneClickLabel(submission)}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" disabled={busy} />}
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
      </CardFooter>
    </Card>
  )
}

export function BranchSubmissions({
  branchId,
  activeId,
  onEdit,
}: {
  branchId: string
  activeId: string | null
  onEdit: (submission: SubmissionListItem) => void
}) {
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
        <p className="text-sm text-muted-foreground">No pending submissions.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              active={submission.id === activeId}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
