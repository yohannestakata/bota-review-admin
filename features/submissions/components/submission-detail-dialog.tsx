"use client"

import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiErrorMessage } from "@/lib/api-client"
import {
  approveEffect,
  DISMISS_REASONS,
  formatDate,
  PRIORITY_VARIANT,
  SUBMISSION_TYPE_LABEL,
  SUBMISSION_TYPE_VARIANT,
} from "../format"
import { useDismissSubmission, useReviewSubmission } from "../queries"
import type { PlaceMissingDetails, SubmissionListItem } from "../types"

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  )
}

export function SubmissionDetailDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: SubmissionListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const review = useReviewSubmission()
  const dismiss = useDismissSubmission()
  const busy = review.isPending || dismiss.isPending
  const isPending = submission.status === "pending"
  const details = submission.details as PlaceMissingDetails | null
  const target =
    submission.type === "place_missing"
      ? (details?.placeName ?? "New place")
      : (submission.branch?.label ?? "—")
  const branchLinkLabel =
    submission.type === "place_missing"
      ? "Open draft to enrich & publish"
      : "Open branch"

  function onApprove() {
    review.mutate(submission.id, {
      onSuccess: () => {
        toast.success(
          submission.type === "field_correction"
            ? "Approved — change applied to the branch"
            : "Approved"
        )
        onOpenChange(false)
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  function onDismiss(reason: string) {
    dismiss.mutate(
      { id: submission.id, reason },
      {
        onSuccess: () => {
          toast.success("Dismissed")
          onOpenChange(false)
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant={SUBMISSION_TYPE_VARIANT[submission.type]}>
              {SUBMISSION_TYPE_LABEL[submission.type]}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[submission.priority]}>
              {submission.priority}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Submitted {formatDate(submission.createdAt)} by{" "}
            {submission.user.displayName ?? "Unknown"} ·{" "}
            <span className="capitalize">{submission.user.trustLevel}</span>
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          <Row label="Target">
            {target}
            {submission.type === "place_missing" &&
            submission.branch?.status === "draft" ? (
              <Badge variant="outline" className="ml-2">
                draft
              </Badge>
            ) : null}
          </Row>

          {submission.type === "field_correction" ? (
            <>
              <Row label="Field">
                <span className="capitalize">{submission.fieldName}</span>
              </Row>
              <Row label="Current">{submission.currentValue ?? "—"}</Row>
              <Row label="Suggested">
                <span className="font-medium">{submission.suggestedValue}</span>
              </Row>
            </>
          ) : null}

          {submission.type === "place_missing" ? (
            <>
              {details?.neighborhood ? (
                <Row label="Neighborhood">{details.neighborhood}</Row>
              ) : null}
              {details?.description ? (
                <Row label="Description">{details.description}</Row>
              ) : null}
              {details?.contactPhone ? (
                <Row label="Phone">{details.contactPhone}</Row>
              ) : null}
              {details?.contactEmail ? (
                <Row label="Email">{details.contactEmail}</Row>
              ) : null}
            </>
          ) : null}

          {submission.note ? <Row label="Note">{submission.note}</Row> : null}
          {submission.reviewNote ? (
            <Row label="Dismissed">{submission.reviewNote}</Row>
          ) : null}
        </dl>

        {submission.branchId ? (
          <Link
            href={`/branches/${submission.branchId}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {branchLinkLabel} ↗
          </Link>
        ) : null}

        {isPending ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Approve: {approveEffect(submission.type)}
            </p>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" disabled={busy} />}
                >
                  Dismiss
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {DISMISS_REASONS.map((reason) => (
                    <DropdownMenuItem
                      key={reason}
                      onClick={() => onDismiss(reason)}
                    >
                      {reason}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button disabled={busy} onClick={onApprove}>
                {review.isPending ? "Approving…" : "Approve"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
