/* eslint-disable @next/next/no-img-element */
"use client"

import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiErrorMessage } from "@/lib/api-client"
import { useApprovePhoto, usePendingPhotos, useRejectPhoto } from "../queries"

export function PhotosView() {
  const { data, isPending, isError, error } = usePendingPhotos()
  const approve = useApprovePhoto()
  const reject = useRejectPhoto()
  const busy = approve.isPending || reject.isPending

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {isError ? (
            <p className="text-sm text-destructive">
              {apiErrorMessage(error)}
            </p>
          ) : isPending || !data ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No photos awaiting moderation.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {data.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-lg border"
                >
                  <img
                    src={photo.url}
                    alt={photo.category}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {photo.category}
                      </Badge>
                      <Link
                        href={`/branches/${photo.branchId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Branch ↗
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={busy}
                        onClick={() =>
                          reject.mutate(photo.id, {
                            onSuccess: () => toast.success("Rejected"),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          })
                        }
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={busy}
                        onClick={() =>
                          approve.mutate(photo.id, {
                            onSuccess: () => toast.success("Approved"),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          })
                        }
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
