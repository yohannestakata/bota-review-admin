"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { apiErrorMessage } from "@/lib/api-client"
import {
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
  summary,
}: {
  submission: SubmissionListItem
  summary: string
}) {
  const [open, setOpen] = useState(false)
  const review = useReviewSubmission()
  const dismiss = useDismissSubmission()
  const busy = review.isPending || dismiss.isPending
  const isPending = submission.status === "pending"
  const details = submission.details as PlaceMissingDetails | null
  const target =
    submission.type === "place_missing"
      ? (details?.placeName ?? "New place")
      : (submission.branch?.label ?? "—")

  function onApprove() {
    review.mutate(submission.id, {
      onSuccess: () => {
        toast.success(
          submission.type === "field_correction"
            ? "Approved — change applied to the branch"
            : "Approved"
        )
        setOpen(false)
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  function onDismiss() {
    dismiss.mutate(submission.id, {
      onSuccess: () => {
        toast.success("Dismissed")
        setOpen(false)
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="link"
            className="h-auto max-w-[260px] justify-start overflow-hidden p-0 font-normal text-foreground"
          />
        }
      >
        <span className="truncate">{summary}</span>
      </DialogTrigger>
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
        </dl>

        {isPending ? (
          <DialogFooter>
            <Button variant="outline" onClick={onDismiss} disabled={busy}>
              Dismiss
            </Button>
            <Button onClick={onApprove} disabled={busy}>
              {review.isPending ? "Approving…" : "Approve"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
