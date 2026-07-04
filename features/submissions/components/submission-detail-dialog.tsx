"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { usePlaces } from "@/features/places/queries"
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
import { cn } from "@/lib/utils"
import {
  branchSectionForSubmission,
  DISMISS_REASONS,
  fieldCorrectionEffect,
  formatDate,
  isManualReview,
  PRIORITY_VARIANT,
  reviewAction,
  SUBMISSION_TYPE_LABEL,
  SUBMISSION_TYPE_VARIANT,
} from "../format"
import { useDismissSubmission, useReviewSubmission } from "../queries"
import type { PlaceMissingDetails, SubmissionListItem } from "../types"

function branchHref(submission: SubmissionListItem): string | null {
  if (!submission.branchId) return null
  return `/branches/${submission.branchId}?resolveSubmission=${submission.id}#${branchSectionForSubmission(submission)}`
}

function manualPrimaryLabel(submission: SubmissionListItem): string {
  if (submission.type === "temporarily_closed") return "Handle closure"
  return "Edit branch"
}

// Lets the moderator dedupe a "missing place" tip: search existing places and,
// if this is really a new location of one, select it so approval attaches a
// branch instead of creating a duplicate place.
function DuplicateFinder({
  placeName,
  selected,
  onSelect,
}: {
  placeName: string
  selected: { id: string; name: string } | null
  onSelect: (place: { id: string; name: string } | null) => void
}) {
  const [q, setQ] = useState(placeName)
  const [debouncedQ, setDebouncedQ] = useState(placeName)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 250)
    return () => clearTimeout(timer)
  }, [q])

  const enabled = debouncedQ.length >= 2
  const { data, isFetching } = usePlaces({
    q: enabled ? debouncedQ : undefined,
    limit: 6,
  })
  const results = enabled ? (data?.data ?? []) : []

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">Already on Bota?</p>
        {selected ? (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={() => onSelect(null)}
          >
            Clear · create new
          </button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Attach as a new branch of an existing place to avoid duplicates, or leave
        empty to create a brand-new place.
      </p>
      <Input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search existing places…"
      />
      <div className="space-y-1">
        {results.map((place) => {
          const isSelected = selected?.id === place.id
          return (
            <button
              key={place.id}
              type="button"
              onClick={() =>
                onSelect(
                  isSelected ? null : { id: place.id, name: place.name }
                )
              }
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-muted"
              )}
            >
              <span className="font-medium">{place.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {place.type} · {place.branchCount} branch
                {place.branchCount === 1 ? "" : "es"} · {place.status}
              </span>
            </button>
          )
        })}
        {enabled && !isFetching && results.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No matches — approving creates a new place.
          </p>
        ) : null}
      </div>
    </div>
  )
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
  // For place_missing: the existing place to attach this branch to (dedupe),
  // or null to create a brand-new place on approve.
  const [attach, setAttach] = useState<{ id: string; name: string } | null>(null)
  const busy = review.isPending || dismiss.isPending
  const isPending = submission.status === "pending"
  const details = submission.details as PlaceMissingDetails | null
  const isPlaceMissing = submission.type === "place_missing"
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

  function onReview(note?: string, placeId?: string) {
    review.mutate(
      {
        id: submission.id,
        note,
        placeId,
      },
      {
        onSuccess: () => {
          toast.success(action.success)
          setResolutionOpen(false)
          setResolutionNote("")
          onOpenChange(false)
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
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
              {submission.currentValue ? (
                <Row label="Current">{submission.currentValue}</Row>
              ) : null}
              {submission.suggestedValue ? (
                <Row label="Suggested">
                  <span className="font-medium">
                    {submission.suggestedValue}
                  </span>
                </Row>
              ) : null}
            </>
          ) : null}

          {isPlaceMissing ? (
            <>
              {details?.type ? (
                <Row label="Type">
                  <span className="capitalize">{details.type}</span>
                </Row>
              ) : null}
              {details?.neighborhood ? (
                <Row label="Neighborhood">{details.neighborhood}</Row>
              ) : null}
              {details?.description ? (
                <Row label="Description">{details.description}</Row>
              ) : null}
              {details?.cuisines?.length ? (
                <Row label="Cuisines">{details.cuisines.join(", ")}</Row>
              ) : null}
              {details?.tags?.length ? (
                <Row label="Tags">{details.tags.join(", ")}</Row>
              ) : null}
              {details?.contactPhone ? (
                <Row label="Phone">{details.contactPhone}</Row>
              ) : null}
              {details?.contactEmail ? (
                <Row label="Email">{details.contactEmail}</Row>
              ) : null}
              {details?.latitude != null && details?.longitude != null ? (
                <Row label="Pinned">
                  {details.latitude.toFixed(5)}, {details.longitude.toFixed(5)}
                </Row>
              ) : null}
              {details?.hours?.length ? (
                <Row label="Hours">
                  {details.hours.length} day
                  {details.hours.length === 1 ? "" : "s"} provided
                </Row>
              ) : null}
              {details?.menu?.length ? (
                <Row label="Menu">
                  {details.menu.length} item
                  {details.menu.length === 1 ? "" : "s"}
                </Row>
              ) : null}
              {details?.amenities?.length ? (
                <Row label="Amenities">{details.amenities.join(", ")}</Row>
              ) : null}
              {details?.photos?.length ? (
                <Row label="Photos">
                  <div className="flex flex-wrap gap-2">
                    {details.photos.map((photo) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        alt="Submitted"
                        className="h-20 w-20 rounded-md object-cover"
                        key={photo.publicId}
                        src={photo.url}
                      />
                    ))}
                  </div>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Land pending — approve them after creating the place.
                  </span>
                </Row>
              ) : null}
            </>
          ) : null}

          {submission.note ? <Row label="Note">{submission.note}</Row> : null}
          {submission.reviewNote ? (
            <Row
              label={
                submission.status === "dismissed" ? "Dismissed" : "Resolved"
              }
            >
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

        {isPlaceMissing && isPending ? (
          <DuplicateFinder
            placeName={details?.placeName ?? ""}
            selected={attach}
            onSelect={setAttach}
          />
        ) : null}

        {isPending ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              {attach
                ? `Adds a new branch to ${attach.name}.`
                : action.effect}
            </p>
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
                onClick={() =>
                  manual
                    ? setResolutionOpen(true)
                    : onReview(undefined, attach?.id)
                }
                variant={action.variant}
              >
                {review.isPending
                  ? action.pendingLabel
                  : attach
                    ? `Attach to ${attach.name}`
                    : action.label}
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
