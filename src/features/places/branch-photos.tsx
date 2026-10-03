import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"

import { ApiErrorAlert } from "@/components/api-error-alert"

import { useBranchPhotos, usePhotoAction } from "./queries"

const STATUS_LABEL = { pending: "Waiting", approved: "Approved", rejected: "Rejected" } as const

export function BranchPhotos({ branchId }: { branchId: string }) {
  const photos = useBranchPhotos(branchId)
  const act = usePhotoAction(branchId)

  if (photos.isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/3]" />
        ))}
      </div>
    )
  }
  if (photos.error) return <ApiErrorAlert error={photos.error} title="Couldn't load photos" />
  if (photos.data.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No photos yet</EmptyTitle>
          <EmptyDescription>Photos come in from the app and show up here once uploaded.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const run = (photoId: string, action: "cover" | "approve" | "reject", done: string) =>
    act.mutate(
      { photoId, action },
      {
        onSuccess: () => toast.add({ title: done, type: "success" }),
        onError: (error) => toast.add({ title: "That didn't go through", description: error.message, type: "error" }),
      }
    )

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {photos.data.map((photo) => {
        const busy = act.isPending && act.variables.photoId === photo.id
        return (
          <figure key={photo.id} className="flex flex-col overflow-hidden rounded-lg border">
            <div className="relative">
              <img
                src={photo.url}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full bg-muted object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                {photo.isCover ? <Badge>Cover</Badge> : null}
                {photo.moderationStatus !== "approved" ? (
                  <Badge variant={photo.moderationStatus === "rejected" ? "destructive" : "secondary"}>
                    {STATUS_LABEL[photo.moderationStatus]}
                  </Badge>
                ) : null}
              </div>
            </div>
            <figcaption className="flex flex-wrap items-center gap-1 p-2">
              <span className="mr-auto truncate text-xs text-muted-foreground">{photo.uploader.displayName}</span>
              {photo.moderationStatus === "approved" && !photo.isCover ? (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(photo.id, "cover", "Cover set")}>
                  Make cover
                </Button>
              ) : null}
              {photo.moderationStatus !== "approved" ? (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(photo.id, "approve", "Approved")}>
                  Approve
                </Button>
              ) : null}
              {photo.moderationStatus !== "rejected" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={busy}
                  onClick={() => run(photo.id, "reject", "Removed")}
                >
                  Remove
                </Button>
              ) : null}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
