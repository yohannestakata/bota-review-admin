"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { apiErrorMessage } from "@/lib/api-client"
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

  function onDismiss() {
    dismiss.mutate(id, {
      onSuccess: () => toast.success("Dismissed"),
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={onDismiss}>
        {dismiss.isPending ? "…" : "Dismiss"}
      </Button>
      <Button size="sm" disabled={busy} onClick={onApprove}>
        {review.isPending ? "…" : "Approve"}
      </Button>
    </div>
  )
}
