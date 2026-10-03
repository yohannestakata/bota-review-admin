import { useState } from "react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { MergePlaceDialog } from "@/features/places/merge-place-dialog"

import { useDismissal, type QualityRow } from "./queries"

const DISMISS_LABEL: Record<string, string> = {
  "possible-duplicate": "Not a Duplicate",
  "odd-name": "Name Is Right",
  "outside-addis": "Location Is Right",
  "placeholder-location": "Location Is Right",
}

/** A row's fixes: merge a chain duplicate, or mark the problem as not one. */
export function RowActions({ row, issue }: { row: QualityRow; issue: string }) {
  const [merging, setMerging] = useState(false)
  const dismissal = useDismissal(issue)
  const dismissLabel = DISMISS_LABEL[issue]

  return (
    // Sits above the row-wide link.
    <div className="relative z-10 flex justify-end gap-2">
      {dismissLabel ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={dismissal.isPending}
          onClick={() =>
            dismissal.mutate(
              { branchId: row.branchId },
              {
                onSuccess: () =>
                  toast.add({
                    title: "Taken off the list",
                    description: row.placeName,
                    actionProps: {
                      children: "Undo",
                      onClick: () =>
                        dismissal.mutate({
                          branchId: row.branchId,
                          undo: true,
                        }),
                    },
                  }),
              }
            )
          }
        >
          {dismissLabel}
        </Button>
      ) : null}
      {row.relatedPlaceId ? (
        <>
          <Button variant="outline" size="sm" onClick={() => setMerging(true)}>
            Merge…
          </Button>
          {merging ? (
            <MergePlaceDialog
              placeId={row.placeId}
              initialTargetId={row.relatedPlaceId}
              open
              onOpenChange={setMerging}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
