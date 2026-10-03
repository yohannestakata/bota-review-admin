import { useState } from "react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { MergePlaceDialog } from "@/features/places/merge-place-dialog"
import { useBranchStatus } from "@/features/places/queries"
import { ApiError } from "@/lib/api"
import { undoable } from "@/lib/undoable"

import { CuisineDialog, LocationDialog, RenameDialog } from "./fix-dialogs"
import { useDismissal, type QualityRow } from "./queries"

const DISMISS_LABEL: Record<string, string> = {
  "possible-duplicate": "Not a Duplicate",
  "odd-name": "Name Is Right",
  "outside-addis": "Location Is Right",
  "placeholder-location": "Location Is Right",
}

const LOCATION_CHECKS = new Set([
  "placeholder-location",
  "no-location",
  "outside-addis",
])

type Open = "merge" | "location" | "cuisine" | "rename" | null

/** The fixes a row offers, depending on its check. */
export function RowActions({ row, issue }: { row: QualityRow; issue: string }) {
  const [open, setOpen] = useState<Open>(null)
  const close = (o: boolean) => !o && setOpen(null)
  const title = `${row.placeName} · ${row.label}`
  const dismissLabel = DISMISS_LABEL[issue]

  return (
    // Sits above the row-wide link.
    <div className="relative z-10 flex justify-end gap-2">
      {dismissLabel ? (
        <DismissButton row={row} issue={issue} label={dismissLabel} />
      ) : null}

      {issue === "possible-duplicate" && row.relatedPlaceId ? (
        <Button variant="outline" size="sm" onClick={() => setOpen("merge")}>
          Merge…
        </Button>
      ) : null}
      {LOCATION_CHECKS.has(issue) ? (
        <Button variant="outline" size="sm" onClick={() => setOpen("location")}>
          Set Location…
        </Button>
      ) : null}
      {issue === "no-cuisine" ? (
        <Button variant="outline" size="sm" onClick={() => setOpen("cuisine")}>
          Add Cuisine…
        </Button>
      ) : null}
      {issue === "odd-name" ? (
        <Button variant="outline" size="sm" onClick={() => setOpen("rename")}>
          Rename…
        </Button>
      ) : null}
      {issue === "no-photo" ? (
        // Photos come from the app; this is where they're approved.
        <Button
          variant="outline"
          size="sm"
          render={
            <Link
              to={`/places/${row.placeId}?branch=${row.branchId}&tab=photos`}
            />
          }
          nativeButton={false}
        >
          Photos
        </Button>
      ) : null}
      {issue === "stuck-draft" ? <DraftActions row={row} /> : null}

      {open === "merge" && row.relatedPlaceId ? (
        <MergePlaceDialog
          placeId={row.placeId}
          initialTargetId={row.relatedPlaceId}
          open
          onOpenChange={close}
        />
      ) : null}
      {open === "location" ? (
        <LocationDialog
          branchId={row.branchId}
          title={title}
          open
          onOpenChange={close}
        />
      ) : null}
      {open === "cuisine" ? (
        <CuisineDialog
          branchId={row.branchId}
          title={title}
          open
          onOpenChange={close}
        />
      ) : null}
      {open === "rename" ? (
        <RenameDialog
          placeId={row.placeId}
          name={row.placeName}
          open
          onOpenChange={close}
        />
      ) : null}
    </div>
  )
}

function DismissButton({
  row,
  issue,
  label,
}: {
  row: QualityRow
  issue: string
  label: string
}) {
  const dismissal = useDismissal(issue)
  return (
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
                    dismissal.mutate({ branchId: row.branchId, undo: true }),
                },
              }),
          }
        )
      }
    >
      {label}
    </Button>
  )
}

/** A draft nobody has touched: publish it if it's ready, or archive it. */
function DraftActions({ row }: { row: QualityRow }) {
  const status = useBranchStatus(row.branchId)
  const onError = (error: Error) => {
    // A 422 lists what's missing for publishing.
    const missing =
      error instanceof ApiError && error.fields
        ? Object.values(error.fields).map((f) => f.message)
        : []
    toast.add({
      title: missing.length ? "Not ready to publish" : "That didn't go through",
      description: missing.length ? missing.join(" ") : error.message,
      type: "error",
    })
  }
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={status.isPending}
        onClick={() =>
          undoable({
            title: "Archived",
            description: row.placeName,
            action: () => status.mutate("archive", { onError }),
          })
        }
      >
        Archive
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={status.isPending}
        onClick={() =>
          status.mutate("publish", {
            onSuccess: () =>
              toast.add({
                title: "Live in the app",
                description: row.placeName,
                type: "success",
              }),
            onError,
          })
        }
      >
        Publish
      </Button>
    </>
  )
}
