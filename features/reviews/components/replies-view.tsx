"use client"

import { CheckIcon, ExternalLinkIcon, XIcon } from "lucide-react"
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
import { apiErrorMessage } from "@/lib/api-client"
import { useApproveReply, usePendingReplies, useRejectReply } from "../queries"
import {
  REJECTION_REASONS,
  type AdminReplyPending,
  type RejectionReason,
} from "../types"

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

function ReplyCard({
  reply,
  busy,
  onApprove,
  onReject,
}: {
  reply: AdminReplyPending
  busy: boolean
  onApprove: (reply: AdminReplyPending) => void
  onReject: (reply: AdminReplyPending) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0">
          <span className="block truncate text-sm">{reply.branch.label}</span>
        </CardTitle>
        <CardAction>
          <Badge variant={reply.authorRole === "owner" ? "default" : "outline"}>
            {reply.authorRole === "owner" ? "Owner" : "User"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={reply.user.avatarUrl ?? undefined} />
            <AvatarFallback>{initials(reply.user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {reply.user.displayName ?? "Unknown"}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {reply.user.trustLevel} · {formatDate(reply.createdAt)}
            </div>
          </div>
        </div>

        <p className="text-sm leading-6">{reply.body}</p>

        <div className="rounded-md border bg-muted/40 p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Replying to
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {reply.review.text}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <div className="flex w-full gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => onReject(reply)}
          >
            <XIcon className="size-4" />
            Reject
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => onApprove(reply)}
          >
            <CheckIcon className="size-4" />
            Approve
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/branches/${reply.branch.id}`} />}
        >
          <ExternalLinkIcon className="size-4" />
          Open branch
        </Button>
      </CardFooter>
    </Card>
  )
}

function RejectDialog({
  reply,
  busy,
  onClose,
  onConfirm,
}: {
  reply: AdminReplyPending | null
  busy: boolean
  onClose: () => void
  onConfirm: (reason: RejectionReason) => void
}) {
  const [reason, setReason] = useState<RejectionReason>("off_topic")

  return (
    <Dialog open={reply !== null} onOpenChange={(open) => !open && onClose()}>
      {reply ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject reply</DialogTitle>
            <DialogDescription>
              Choose the reason this reply is being rejected.
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
              {busy ? "Rejecting..." : "Reject reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

export function RepliesView() {
  const [rejecting, setRejecting] = useState<AdminReplyPending | null>(null)
  const { data, isPending, isError, error } = usePendingReplies()
  const approve = useApproveReply()
  const reject = useRejectReply()
  const busy = approve.isPending || reject.isPending
  const replies = data ?? []

  function onApprove(reply: AdminReplyPending) {
    approve.mutate(reply.id, {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          User replies awaiting moderation. Owner replies are auto-approved and
          do not appear here.
        </p>
        <Badge variant="outline">{replies.length} pending</Badge>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
      ) : isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : replies.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No replies awaiting moderation.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              busy={busy}
              onApprove={onApprove}
              onReject={setRejecting}
            />
          ))}
        </div>
      )}

      <RejectDialog
        reply={rejecting}
        busy={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={onReject}
      />
    </div>
  )
}
