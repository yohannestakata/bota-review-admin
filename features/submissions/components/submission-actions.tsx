"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiErrorMessage } from "@/lib/api-client"
import { DISMISS_REASONS } from "../format"
import { useDismissSubmission, useReviewSubmission } from "../queries"
import type { SubmissionType } from "../types"

export function SubmissionActions({
  id,
  type,
}: {
  id: string
  type: SubmissionType
}) {
  const review = useReviewSubmission()
  const dismiss = useDismissSubmission()
  const busy = review.isPending || dismiss.isPending

  function onApprove() {
    review.mutate(id, {
      onSuccess: () =>
        toast.success(
          type === "field_correction"
            ? "Approved — change applied to the branch"
            : "Approved"
        ),
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  function onDismiss(reason: string) {
    dismiss.mutate(
      { id, reason },
      {
        onSuccess: () => toast.success("Dismissed"),
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  return (
    <div className="flex justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" variant="outline" disabled={busy} />}
        >
          {dismiss.isPending ? "…" : "Dismiss"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {DISMISS_REASONS.map((reason) => (
            <DropdownMenuItem key={reason} onClick={() => onDismiss(reason)}>
              {reason}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" disabled={busy} onClick={onApprove}>
        {review.isPending ? "…" : "Approve"}
      </Button>
    </div>
  )
}
