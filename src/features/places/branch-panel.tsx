import { Alert02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { StatusBadge } from "@/components/status-badge"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"

import { ago } from "@/features/inbox/format"
import { useUrlFilters } from "@/hooks/use-url-filters"

import { BranchForm } from "./branch-form"
import { BranchMenus } from "./branch-menus"
import { BranchPhotos } from "./branch-photos"
import { useBranch, useBranchPhotos, useBranchStatus } from "./queries"
import type { Branch, BranchPhoto } from "./types"

/** Mirrors the server's publish rules, so the gaps are visible before trying. */
function checklist(branch: Branch, photos: BranchPhoto[] | undefined) {
  return [
    {
      label: "Name and address",
      done: Boolean(branch.label && branch.addressText),
    },
    { label: "Map pin", done: Boolean(branch.latitude && branch.longitude) },
    {
      label: "Cuisine or food category",
      done: branch.cuisines.length + branch.foodCategories.length > 0,
    },
    {
      label: "An approved photo",
      done: Boolean(photos?.some((p) => p.moderationStatus === "approved")),
    },
  ]
}

export function BranchPanel({ branchId }: { branchId: string }) {
  const branch = useBranch(branchId)
  const { get, set } = useUrlFilters()
  const tab = get("tab", "details")
  const photos = useBranchPhotos(branchId)

  if (branch.isPending) return <Skeleton className="h-96" />
  if (branch.error)
    return (
      <ApiErrorAlert error={branch.error} title="Couldn't load this branch" />
    )

  return (
    <div className="flex flex-col gap-6">
      <StatusCard branch={branch.data} photos={photos.data} />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          set("tab", value === "details" ? "" : String(value))
        }
      >
        <TabsList variant="line">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">
            Photos{photos.data ? ` (${photos.data.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
        </TabsList>
        <TabsContent value="details" keepMounted className="pt-4">
          <BranchForm key={branch.data.id} branch={branch.data} />
        </TabsContent>
        <TabsContent value="photos" className="pt-4">
          <BranchPhotos branchId={branchId} />
        </TabsContent>
        <TabsContent value="menu" className="pt-4">
          <BranchMenus branchId={branchId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatusCard({
  branch,
  photos,
}: {
  branch: Branch
  photos: BranchPhoto[] | undefined
}) {
  const status = useBranchStatus(branch.id)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const items = checklist(branch, photos)
  const ready = items.every((i) => i.done)

  const run = (action: "publish" | "unpublish" | "archive", done: string) =>
    status.mutate(action, {
      onSuccess: () => toast.add({ title: done, type: "success" }),
    })

  const missing = items.filter((i) => !i.done).map((i) => i.label.toLowerCase())
  const live = branch.status === "published"

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <StatusBadge status={branch.status} />
        </CardTitle>
        <CardDescription>
          {branch.reviewCount} {branch.reviewCount === 1 ? "review" : "reviews"}{" "}
          · updated {ago(branch.updatedAt)}
        </CardDescription>
        <CardAction>
          <ButtonGroup>
            {branch.status !== "archived" ? (
              <Button
                variant="outline"
                onClick={() => setConfirmArchive(true)}
                disabled={status.isPending}
              >
                Archive
              </Button>
            ) : null}
            {live ? (
              <Button
                variant="outline"
                onClick={() => run("unpublish", "Back to draft")}
                disabled={status.isPending}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                onClick={() => run("publish", "Live in the app")}
                disabled={!ready || status.isPending}
              >
                {status.isPending ? <Spinner data-icon="inline-start" /> : null}
                Publish
              </Button>
            )}
          </ButtonGroup>
        </CardAction>
      </CardHeader>
      {missing.length > 0 || status.error ? (
        <CardContent className="flex flex-col gap-4">
          {missing.length > 0 ? (
            <Alert>
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              <AlertTitle>
                {live ? "Live, but missing" : "Needed to publish"}
              </AlertTitle>
              <AlertDescription>
                {missing.join(", ").replace(/^./, (c) => c.toUpperCase())}.
              </AlertDescription>
            </Alert>
          ) : null}
          <ApiErrorAlert
            error={status.error}
            title="Couldn't change the status"
          />
        </CardContent>
      ) : null}

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {branch.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the app and search. Reviews and photos are
              kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run("archive", "Archived")}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
