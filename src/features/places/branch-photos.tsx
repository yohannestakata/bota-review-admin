import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { useHidden } from "@/hooks/use-hidden"
import { undoable } from "@/lib/undoable"
import { thumbnail } from "@/lib/cloudinary"

import { ApiErrorAlert } from "@/components/api-error-alert"

import { useBranchPhotos, usePhotoAction } from "./queries"

const STATUS_LABEL = {
  pending: "Waiting",
  approved: "Approved",
  rejected: "Rejected",
} as const

export function BranchPhotos({ branchId }: { branchId: string }) {
  const photos = useBranchPhotos(branchId)
  const act = usePhotoAction(branchId)
  const { hidden, hide, unhide } = useHidden()

  if (photos.isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/3]" />
        ))}
      </div>
    )
  }
  if (photos.error)
    return <ApiErrorAlert error={photos.error} title="Couldn't load photos" />
  if (photos.data.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No photos yet</EmptyTitle>
          <EmptyDescription>
            Photos come in from the app and show up here once uploaded.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  // Removing waits 5s with Undo; the card hides meanwhile.
  const remove = (photoId: string) => {
    hide(photoId)
    undoable({
      title: "Photo removed",
      onUndo: () => unhide(photoId),
      action: () =>
        act.mutate(
          { photoId, action: "reject" },
          {
            onError: (error) => {
              unhide(photoId)
              toast.add({
                title: "That didn't go through",
                description: error.message,
                type: "error",
              })
            },
          }
        ),
    })
  }

  const run = (
    photoId: string,
    action: "cover" | "approve" | "reject",
    done: string
  ) =>
    act.mutate(
      { photoId, action },
      {
        onSuccess: () => toast.add({ title: done, type: "success" }),
        onError: (error) =>
          toast.add({
            title: "That didn't go through",
            description: error.message,
            type: "error",
          }),
      }
    )

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {photos.data
        .filter((photo) => !hidden.has(photo.id))
        .map((photo) => {
          const busy = act.isPending && act.variables.photoId === photo.id
          return (
            <Card key={photo.id} size="sm">
              <CardHeader>
                <CardDescription className="truncate">
                  {photo.uploader.displayName}
                </CardDescription>
                <CardAction className="flex gap-1">
                  {photo.isCover ? <Badge>Cover</Badge> : null}
                  {photo.moderationStatus !== "approved" ? (
                    <Badge
                      variant={
                        photo.moderationStatus === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {STATUS_LABEL[photo.moderationStatus]}
                    </Badge>
                  ) : null}
                </CardAction>
              </CardHeader>
              <CardContent>
                <AspectRatio ratio={1}>
                  {/* Shown while the photo loads, or if it never does. */}
                  <Empty className="absolute inset-0 border">
                    <EmptyMedia>
                      <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
                    </EmptyMedia>
                  </Empty>
                  <img
                    src={thumbnail(photo.url, 600)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full rounded-lg object-cover"
                  />
                </AspectRatio>
              </CardContent>
              <CardFooter className="gap-2">
                {photo.moderationStatus === "approved" && !photo.isCover ? (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => run(photo.id, "cover", "Cover set")}
                  >
                    Make cover
                  </Button>
                ) : null}
                {photo.moderationStatus !== "approved" ? (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => run(photo.id, "approve", "Approved")}
                  >
                    Approve
                  </Button>
                ) : null}
                {photo.moderationStatus !== "rejected" ? (
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => remove(photo.id)}
                  >
                    Remove
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          )
        })}
    </div>
  )
}
