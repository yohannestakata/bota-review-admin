import { Add01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useParams, useSearchParams } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { BranchPanel } from "./branch-panel"
import { PlaceBreadcrumb } from "./place-breadcrumb"
import { typeLabel } from "./labels"
import {
  AddBranchDialog,
  ArchivePlaceDialog,
  EditPlaceDialog,
} from "./place-dialogs"
import { usePlace } from "./queries"

export function PlacePage() {
  const { id = "" } = useParams()
  const place = usePlace(id)
  const [params, setParams] = useSearchParams()
  const [dialog, setDialog] = useState<"edit" | "archive" | "branch" | null>(
    null
  )
  const [showArchived, setShowArchived] = useState(false)

  if (place.isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }
  if (place.error) {
    return (
      <div className="p-6">
        <ApiErrorAlert error={place.error} title="Couldn't load this place" />
      </div>
    )
  }

  const archivedCount = place.data.branches.filter(
    (b) => b.status === "archived"
  ).length
  const requested = place.data.branches.find(
    (b) => b.id === params.get("branch")
  )
  // Archived branches stay out of the way unless asked for (or linked to).
  const branches = place.data.branches.filter(
    (b) => showArchived || b.status !== "archived" || b.id === requested?.id
  )
  const selected = requested ?? branches[0]
  const selectBranch = (branchId: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("branch", branchId)
        return next
      },
      { replace: true }
    )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <PlaceBreadcrumb
          name={place.data.name}
          fix={params.get("fix")}
          branchId={selected?.id}
        />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{place.data.name}</h1>
          <StatusBadge status={place.data.status} />
          <span className="text-muted-foreground">
            {typeLabel(place.data.type)}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => setDialog("edit")}>
              Edit place
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="More" />
                }
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDialog("archive")}
                >
                  Archive place
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {place.data.description ? (
          <p className="max-w-prose text-muted-foreground">
            {place.data.description}
          </p>
        ) : null}
      </div>

      {selected ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              value={[selected.id]}
              onValueChange={(v) => v[0] && selectBranch(v[0])}
              variant="outline"
              spacing={1}
              className="flex-wrap"
            >
              {branches.map((b) => (
                <ToggleGroupItem key={b.id} value={b.id}>
                  {b.label}
                  {b.status !== "published" ? (
                    <Badge variant="secondary">
                      {b.status === "draft" ? "Draft" : "Archived"}
                    </Badge>
                  ) : null}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button variant="ghost" onClick={() => setDialog("branch")}>
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Branch
            </Button>
            {archivedCount > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived
                  ? "Hide archived"
                  : `Show archived (${archivedCount})`}
              </Button>
            ) : null}
          </div>
          <BranchPanel key={selected.id} branchId={selected.id} />
        </>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No branches yet</EmptyTitle>
            <EmptyDescription>
              A branch is a location people can visit. Add the first one.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setDialog("branch")}>Add a branch</Button>
          </EmptyContent>
        </Empty>
      )}

      {dialog === "edit" ? (
        <EditPlaceDialog
          place={place.data}
          open
          onOpenChange={(o) => !o && setDialog(null)}
        />
      ) : null}
      <ArchivePlaceDialog
        place={place.data}
        open={dialog === "archive"}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <AddBranchDialog
        placeId={place.data.id}
        open={dialog === "branch"}
        onOpenChange={(o) => setDialog(o ? "branch" : null)}
        onCreated={selectBranch}
      />
    </div>
  )
}
