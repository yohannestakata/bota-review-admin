import { CheckmarkCircle02Icon, CircleIcon } from "@hugeicons/core-free-icons"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"

import { ago } from "@/features/inbox/format"

import { BranchForm } from "./branch-form"
import { BranchMenus } from "./branch-menus"
import { BranchPhotos } from "./branch-photos"
import { useBranch, useBranchPhotos, useBranchStatus } from "./queries"
import type { Branch, BranchPhoto } from "./types"

/** Mirrors the server's publish rules, so the gaps are visible before trying. */
function checklist(branch: Branch, photos: BranchPhoto[] | undefined) {
  return [
    { label: "Name and address", done: Boolean(branch.label && branch.addressText) },
    { label: "Map pin", done: Boolean(branch.latitude && branch.longitude) },
    { label: "Cuisine or food category", done: branch.cuisines.length + branch.foodCategories.length > 0 },
    { label: "An approved photo", done: Boolean(photos?.some((p) => p.moderationStatus === "approved")) },
  ]
}

export function BranchPanel({ branchId }: { branchId: string }) {
  const branch = useBranch(branchId)
  const photos = useBranchPhotos(branchId)

  if (branch.isPending) return <Skeleton className="h-96" />
  if (branch.error) return <ApiErrorAlert error={branch.error} title="Couldn't load this branch" />

  return (
    <div className="flex flex-col gap-6">
      <StatusCard branch={branch.data} photos={photos.data} />
      <Tabs defaultValue="details">
        <TabsList variant="line">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">Photos{photos.data ? ` (${photos.data.length})` : ""}</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          <BranchForm key={branch.data.updatedAt} branch={branch.data} />
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

function StatusCard({ branch, photos }: { branch: Branch; photos: BranchPhoto[] | undefined }) {
  const status = useBranchStatus(branch.id)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const items = checklist(branch, photos)
  const ready = items.every((i) => i.done)

  const run = (action: "publish" | "unpublish" | "archive", done: string) =>
    status.mutate(action, { onSuccess: () => toast.add({ title: done, type: "success" }) })

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={branch.status} />
          <span className="text-sm text-muted-foreground">
            {branch.reviewCount} reviews · updated {ago(branch.updatedAt)}
          </span>
          <div className="ml-auto flex gap-2">
            {branch.status !== "archived" ? (
              <Button variant="ghost" onClick={() => setConfirmArchive(true)} disabled={status.isPending}>
                Archive
              </Button>
            ) : null}
            {branch.status === "published" ? (
              <Button variant="outline" onClick={() => run("unpublish", "Back to draft")} disabled={status.isPending}>
                Unpublish
              </Button>
            ) : (
              <Button onClick={() => run("publish", "Live in the app")} disabled={!ready || status.isPending}>
                {status.isPending ? <Spinner data-icon="inline-start" /> : null}
                Publish
              </Button>
            )}
          </div>
        </div>
        {branch.status !== "published" ? (
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {items.map((item) => (
              <li
                key={item.label}
                className={item.done ? "flex items-center gap-1.5 text-muted-foreground" : "flex items-center gap-1.5"}
              >
                <HugeiconsIcon
                  icon={item.done ? CheckmarkCircle02Icon : CircleIcon}
                  strokeWidth={2}
                  className={item.done ? "size-4 text-primary" : "size-4 text-muted-foreground"}
                />
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
        <ApiErrorAlert error={status.error} title="Couldn't change the status" />
      </CardContent>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {branch.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the app and search. Reviews and photos are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => run("archive", "Archived")}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
