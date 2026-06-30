/* eslint-disable @next/next/no-img-element */
"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiErrorMessage } from "@/lib/api-client"
import {
  useAssignCover,
  useBranchPhotos,
  useUploadBranchPhoto,
} from "../queries"
import { PHOTO_CATEGORIES, type PhotoCategory } from "../types"

export function BranchPhotos({ branchId }: { branchId: string }) {
  const { data: photos, isPending } = useBranchPhotos(branchId)
  const upload = useUploadBranchPhoto(branchId)
  const setCover = useAssignCover(branchId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<PhotoCategory>("exterior")

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    upload.mutate(
      { file, category },
      {
        onSuccess: () => toast.success("Photo uploaded"),
        onError: (error) => toast.error(apiErrorMessage(error)),
      }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select
          value={category}
          onValueChange={(v) => setCategory((v ?? "exterior") as PhotoCategory)}
        >
          <SelectTrigger size="sm" className="w-32 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHOTO_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {upload.isPending ? "Uploading…" : "Upload photo"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading photos…</p>
      ) : (photos?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">
          No photos yet — upload one to publish this branch.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos?.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-md border"
            >
              <img
                src={photo.url}
                alt={photo.category}
                className="aspect-[4/3] w-full object-cover"
              />
              {photo.isCover ? (
                <Badge className="absolute top-2 left-2">Cover</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 left-2 hidden group-hover:inline-flex"
                  disabled={setCover.isPending}
                  onClick={() =>
                    setCover.mutate(photo.id, {
                      onSuccess: () => toast.success("Cover updated"),
                      onError: (error) => toast.error(apiErrorMessage(error)),
                    })
                  }
                >
                  Set cover
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
