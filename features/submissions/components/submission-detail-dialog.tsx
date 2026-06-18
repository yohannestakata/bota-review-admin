"use client"

import Link from "next/link"
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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { apiErrorMessage } from "@/lib/api-client"
import {
  DISMISS_REASONS,
  fieldCorrectionEffect,
  formatDate,
  isManualReview,
  normalizedField,
  PRIORITY_VARIANT,
  reviewAction,
  SUBMISSION_TYPE_LABEL,
  SUBMISSION_TYPE_VARIANT,
} from "../format"
import { useDismissSubmission, useReviewSubmission } from "../queries"
import type { PlaceMissingDetails, SubmissionListItem } from "../types"

function branchSectionForSubmission(submission: SubmissionListItem): string {
  if (submission.type === "place_missing") return "location"
  if (submission.type === "temporarily_closed") return "status"

  switch (normalizedField(submission.fieldName)) {
    case "hours":
      return "location"
    case "menu/prices":
      return "location"
    case "photos":
      return "photos"
    case "tags/amenities":
      return "classification"
    case "wrong info":
    case "duplicate":
    default:
      return "location"
  }
}

function branchHref(submission: SubmissionListItem): string | null {
  if (!submission.branchId) return null
  return `/branches/${submission.branchId}?resolveSubmission=${submission.id}#${branchSectionForSubmission(submission)}`
}

function manualPrimaryLabel(submission: SubmissionListItem): string {
  if (submission.type === "place_missing") return "Enrich draft"
  if (submission.type === "temporarily_closed") return "Handle closure"
  return "Edit branch"
}

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
  const [resolutionOpen, setResolutionOpen] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")
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
  const action = reviewAction(submission)
  const manual = isManualReview(submission)
  const editHref = branchHref(submission)

  function onReview(note?: string) {
    review.mutate({
      id: submission.id,
      note,
    }, {
      onSuccess: () => {
        toast.success(action.success)
        setResolutionOpen(false)
        setResolutionNote("")
        onOpenChange(false)
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  function onManualReview() {
    const note = resolutionNote.trim()
    if (!note) return
    onReview(note)
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
              <Row label="Review action">
                {fieldCorrectionEffect(submission.fieldName)}
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
            <Row label={submission.status === "dismissed" ? "Dismissed" : "Resolved"}>
              {submission.reviewNote}
            </Row>
          ) : null}
        </dl>

        {editHref && !isPending ? (
          <Link
            href={editHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            {branchLinkLabel} ↗
          </Link>
        ) : null}

        {isPending ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">{action.effect}</p>
            <div className="flex gap-2">
              {manual && editHref ? (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={editHref} />}
                >
                  {manualPrimaryLabel(submission)}
                </Button>
              ) : null}
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
              <Button
                disabled={busy}
                onClick={() => (manual ? setResolutionOpen(true) : onReview())}
                variant={action.variant}
              >
                {review.isPending ? action.pendingLabel : action.label}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
      <Dialog open={resolutionOpen} onOpenChange={setResolutionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve without changes</DialogTitle>
            <DialogDescription>
              Note why this can be closed without applying an automatic change.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder="e.g. Already fixed, duplicate, or no change needed"
            onKeyDown={(event) => {
              if (event.key === "Enter") onManualReview()
            }}
          />
          <DialogFooter showCloseButton>
            <Button
              disabled={review.isPending || !resolutionNote.trim()}
              onClick={onManualReview}
            >
              {review.isPending ? "Resolving…" : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
