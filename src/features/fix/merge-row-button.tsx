import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

import { useMergeIntoChain, type QualityRow } from "./queries"

/** One-click fix for a chain duplicate: merge it into the chain, after a confirm. */
export function MergeRowButton({
  row,
}: {
  row: QualityRow & { relatedPlaceId: string }
}) {
  const [open, setOpen] = useState(false)
  const merge = useMergeIntoChain()
  const chain = row.note.replace(/^Looks like /, "")

  return (
    <>
      {/* Sits above the row-wide link. */}
      <Button
        variant="outline"
        size="sm"
        className="relative z-10"
        onClick={() => setOpen(true)}
      >
        Merge
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Merge {row.placeName} into {chain}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Its branches, reviews and photos move to {chain}, and{" "}
              {row.placeName} is archived. Links keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                merge.mutate(
                  { placeId: row.placeId, intoPlaceId: row.relatedPlaceId },
                  {
                    onSuccess: (result) =>
                      toast.add({
                        title: "Merged",
                        description: `${result.moved} ${result.moved === 1 ? "branch" : "branches"} moved to ${chain}`,
                        type: "success",
                      }),
                    onError: (error) =>
                      toast.add({
                        title: "That didn't go through",
                        description: error.message,
                        type: "error",
                      }),
                  }
                )
              }
            >
              Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
