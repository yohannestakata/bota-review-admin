/* eslint-disable @next/next/no-img-element */
"use client"

import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  ImageIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

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
import { useApprovePhoto, usePendingPhotos, useRejectPhoto } from "../queries"
import type { AdminPhoto } from "../types"

function formatCategory(value: string): string {
  return value.replaceAll("_", " ")
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function dimensions(photo: AdminPhoto): string {
  return `${photo.width} x ${photo.height}`
}

function queueStats(photos: AdminPhoto[]) {
  const highResolution = photos.filter(
    (photo) => photo.width >= 1200 && photo.height >= 800
  ).length
  const categories = new Set(photos.map((photo) => photo.category)).size

  return [
    { label: "Pending", value: photos.length },
    { label: "Large enough", value: highResolution },
    { label: "Categories", value: categories },
  ]
}

function PhotoActions({
  photo,
  busy,
  onApprove,
  onReject,
}: {
  photo: AdminPhoto
  busy: boolean
  onApprove: (photo: AdminPhoto) => void
  onReject: (photo: AdminPhoto) => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        disabled={busy}
        onClick={() => onReject(photo)}
      >
        <XIcon className="size-4" />
        Reject
      </Button>
      <Button
        size="sm"
        className="flex-1"
        disabled={busy}
        onClick={() => onApprove(photo)}
      >
        <CheckIcon className="size-4" />
        Approve
      </Button>
    </div>
  )
}

function PhotoCard({
  photo,
  busy,
  onApprove,
  onPreview,
  onReject,
}: {
  photo: AdminPhoto
  busy: boolean
  onApprove: (photo: AdminPhoto) => void
  onPreview: (photo: AdminPhoto) => void
  onReject: (photo: AdminPhoto) => void
}) {
  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        className="group relative block w-full bg-muted text-left"
        onClick={() => onPreview(photo)}
      >
        <img
          src={photo.url}
          alt={`${formatCategory(photo.category)} photo for ${photo.branch.label}`}
          className="aspect-[4/3] w-full object-cover transition-opacity group-hover:opacity-90"
        />
        <span className="absolute top-2 right-2 rounded-md bg-background/90 p-1.5 shadow-sm">
          <EyeIcon className="size-4" />
          <span className="sr-only">Preview</span>
        </span>
      </button>

      <CardHeader className="p-3">
        <CardTitle className="min-w-0 text-sm">
          <span className="block truncate">{photo.branch.label}</span>
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className="capitalize">
            {formatCategory(photo.category)}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-2 px-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between gap-3">
          <span>{dimensions(photo)}</span>
          <span>{formatDate(photo.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="truncate">
            {photo.uploader.displayName ?? "Unknown"} ·{" "}
            <span className="capitalize">{photo.uploader.trustLevel}</span>
          </span>
          <Button
            size="xs"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/branches/${photo.branchId}`} />}
          >
            <ExternalLinkIcon className="size-3" />
            Branch
          </Button>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <PhotoActions
          photo={photo}
          busy={busy}
          onApprove={onApprove}
          onReject={onReject}
        />
      </CardFooter>
    </Card>
  )
}

export function PhotosView() {
  const { data, isPending, isError, error } = usePendingPhotos()
  const approve = useApprovePhoto()
  const reject = useRejectPhoto()
  const [selected, setSelected] = useState<AdminPhoto | null>(null)
  const busy = approve.isPending || reject.isPending
  const photos = data ?? []

  function onApprove(photo: AdminPhoto) {
    approve.mutate(photo.id, {
      onSuccess: () => {
        toast.success("Approved")
        if (selected?.id === photo.id) setSelected(null)
      },
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  function onReject(photo: AdminPhoto) {
    reject.mutate(photo.id, {
      onSuccess: () => {
        toast.success("Rejected")
        if (selected?.id === photo.id) setSelected(null)
      },
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {isError ? (
            <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
          ) : isPending || !data ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
              <ImageIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No photos awaiting moderation.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {queueStats(photos).map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-semibold tabular-nums">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    busy={busy}
                    onApprove={onApprove}
                    onPreview={setSelected}
                    onReject={onReject}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected ? (
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selected.branch.label}</DialogTitle>
              <DialogDescription>
                {formatCategory(selected.category)} · {dimensions(selected)} ·{" "}
                {selected.uploader.displayName ?? "Unknown"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
              <div className="overflow-hidden rounded-lg bg-muted">
                <img
                  src={selected.url}
                  alt={`${formatCategory(selected.category)} photo for ${selected.branch.label}`}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              <div className="grid content-start gap-4 text-sm">
                <dl className="grid gap-3">
                  <div>
                    <dt className="text-muted-foreground">Branch</dt>
                    <dd className="font-medium">{selected.branch.label}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Uploader</dt>
                    <dd>
                      {selected.uploader.displayName ?? "Unknown"} ·{" "}
                      <span className="capitalize">
                        {selected.uploader.trustLevel}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd>{formatDate(selected.createdAt)}</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/branches/${selected.branchId}`} />}
                >
                  <ExternalLinkIcon className="size-4" />
                  Open branch
                </Button>
              </div>
            </div>
            <DialogFooter>
              <PhotoActions
                photo={selected}
                busy={busy}
                onApprove={onApprove}
                onReject={onReject}
              />
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
