import { Add01Icon, Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRef, useState } from "react"

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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { useHidden } from "@/hooks/use-hidden"
import { undoable } from "@/lib/undoable"
import { thumbnail } from "@/lib/cloudinary"

import { ApiErrorAlert } from "@/components/api-error-alert"

import {
  useBranchPhotos,
  usePhotoAction,
  useLookup,
  useUploadPhotos,
  type PhotoCategory,
} from "./queries"

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
            Add some yourself, or wait for people to post them from the app.
            Yours go live at once, and the first becomes the cover.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <PhotoUploader branchId={branchId} />
        </EmptyContent>
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
    <div className="flex flex-col gap-4">
      <PhotoUploader branchId={branchId} />
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
                        <HugeiconsIcon
                          aria-hidden="true"
                          icon={Image01Icon}
                          strokeWidth={2}
                        />
                      </EmptyMedia>
                    </Empty>
                    <img
                      src={thumbnail(photo.url, 600)}
                      width={600}
                      height={600}
                      alt={`Photo by ${photo.uploader.displayName}`}
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
    </div>
  )
}

/** Pick photos from the computer; they upload and go live straight away. */
function PhotoUploader({ branchId }: { branchId: string }) {
  const input = useRef<HTMLInputElement>(null)
  // Categories are edited in Settings; Food is the usual default.
  const { active } = useLookup("photo-categories")
  const items = active.map((c) => ({ value: c.id, label: c.name }))
  const [picked, setPicked] = useState<PhotoCategory | null>(null)
  const category =
    picked ??
    items.find((c) => c.value === "food")?.value ??
    items[0]?.value ??
    "food"
  const upload = useUploadPhotos(branchId)

  return (
    <Field orientation="horizontal" className="w-auto">
      <Select
        items={items}
        value={category}
        onValueChange={(v) => v && setPicked(String(v))}
      >
        <SelectTrigger aria-label="What the photos show" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
      >
        {upload.isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            data-icon="inline-start"
            aria-hidden="true"
          />
        )}
        {upload.isPending ? "Uploading…" : "Add Photos"}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = ""
          if (files.length === 0) return
          upload.mutate(
            { files, category },
            {
              onSuccess: (added) =>
                toast.add({
                  title: added === 1 ? "Photo added" : `${added} photos added`,
                  type: "success",
                }),
              onError: (error) =>
                toast.add({
                  title: "Some photos didn't upload",
                  description: error.message,
                  type: "error",
                }),
            }
          )
        }}
      />
    </Field>
  )
}
