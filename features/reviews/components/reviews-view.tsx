"use client"

import {
  CheckIcon,
  ExternalLinkIcon,
  MessageSquareWarningIcon,
  SearchCheckIcon,
  StarIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiErrorMessage } from "@/lib/api-client"
import { useApproveReview, useRejectReview, useReviews } from "../queries"
import {
  REJECTION_REASONS,
  type AdminReview,
  type RejectionReason,
  type ReviewQueue,
} from "../types"

const QUEUES: {
  value: ReviewQueue
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: "pending",
    label: "Pending",
    description: "New reviews from non-trusted users.",
    icon: <StarIcon className="size-4" />,
  },
  {
    value: "spot-check",
    label: "Spot-check",
    description: "Reviews selected for manual quality checks.",
    icon: <SearchCheckIcon className="size-4" />,
  },
  {
    value: "reported",
    label: "Reported",
    description: "Reviews with enough reports to require moderation.",
    icon: <MessageSquareWarningIcon className="size-4" />,
  },
]

function initials(name: string | null): string {
  return (name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function reasonLabel(value: RejectionReason): string {
  return (
    REJECTION_REASONS.find((reason) => reason.value === value)?.label ?? value
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={`size-4 ${index < rating ? "fill-current" : "opacity-30"}`}
        />
      ))}
    </span>
  )
}

function ReviewActions({
  busy,
  onApprove,
  onReject,
}: {
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        disabled={busy}
        onClick={onReject}
      >
        <XIcon className="size-4" />
        Reject
      </Button>
      <Button size="sm" className="flex-1" disabled={busy} onClick={onApprove}>
        <CheckIcon className="size-4" />
        Approve
      </Button>
    </div>
  )
}

function ReviewCard({
  review,
  busy,
  onApprove,
  onReject,
}: {
  review: AdminReview
  busy: boolean
  onApprove: (review: AdminReview) => void
  onReject: (review: AdminReview) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0">
          <span className="block truncate text-sm">{review.branch.label}</span>
        </CardTitle>
        <CardAction>
          <Badge variant={review.isFlagged ? "destructive" : "outline"}>
            {review.isFlagged
              ? `${review.reportCount} reports`
              : review.moderationStatus}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={review.user.avatarUrl ?? undefined} />
            <AvatarFallback>{initials(review.user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {review.user.displayName ?? "Unknown"}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {review.user.trustLevel} · {formatDate(review.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Stars rating={review.rating} />
          {review.visitDate ? (
            <span className="text-xs text-muted-foreground">
              Visit {formatDate(review.visitDate)}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-5 text-sm leading-6">{review.text}</p>

        <div className="flex flex-wrap gap-2">
          {review.requiresSpotCheck ? (
            <Badge variant="secondary">Spot-check</Badge>
          ) : null}
          {review.reportCount > 0 ? (
            <Badge variant="outline">{review.reportCount} reports</Badge>
          ) : null}
          {review.rejectionReason ? (
            <Badge variant="outline">
              {reasonLabel(review.rejectionReason)}
            </Badge>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <ReviewActions
          busy={busy}
          onApprove={() => onApprove(review)}
          onReject={() => onReject(review)}
        />
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/branches/${review.branchId}`} />}
        >
          <ExternalLinkIcon className="size-4" />
          Open branch
        </Button>
      </CardFooter>
    </Card>
  )
}

function RejectDialog({
  review,
  busy,
  onClose,
  onConfirm,
}: {
  review: AdminReview | null
  busy: boolean
  onClose: () => void
  onConfirm: (reason: RejectionReason) => void
}) {
  const [reason, setReason] = useState<RejectionReason>("off_topic")

  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && onClose()}>
      {review ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject review</DialogTitle>
            <DialogDescription>
              Choose the reason the reviewer will see for this decision.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {REJECTION_REASONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-md border p-3 text-left text-sm ${
                  reason === option.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
                onClick={() => setReason(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => onConfirm(reason)}
            >
              {busy ? "Rejecting..." : "Reject review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

export function ReviewsView() {
  const [queue, setQueue] = useState<ReviewQueue>("pending")
  const [rejecting, setRejecting] = useState<AdminReview | null>(null)
  const { data, isPending, isError, error } = useReviews(queue)
  const approve = useApproveReview()
  const reject = useRejectReview()
  const busy = approve.isPending || reject.isPending
  const reviews = data ?? []
  const activeQueue = QUEUES.find((item) => item.value === queue) ?? QUEUES[0]

  function onApprove(review: AdminReview) {
    approve.mutate(review.id, {
      onSuccess: () => toast.success("Approved"),
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  function onReject(reason: RejectionReason) {
    if (!rejecting) return
    reject.mutate(
      { id: rejecting.id, rejectionReason: reason },
      {
        onSuccess: () => {
          toast.success("Rejected")
          setRejecting(null)
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Tabs
        value={queue}
        onValueChange={(value) => setQueue(value as ReviewQueue)}
      >
        <TabsList>
          {QUEUES.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.icon}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {activeQueue.description}
        </p>
        <Badge variant="outline">{reviews.length} reviews</Badge>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
      ) : isPending || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No reviews in this queue.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              busy={busy}
              onApprove={onApprove}
              onReject={setRejecting}
            />
          ))}
        </div>
      )}

      <RejectDialog
        review={rejecting}
        busy={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={onReject}
      />
    </div>
  )
}
