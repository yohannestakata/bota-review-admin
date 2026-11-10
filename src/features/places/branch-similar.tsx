import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/lib/api"
import { photoSize } from "@/lib/images"

import { useLookup } from "./queries"
import type { PlaceType } from "./types"

type SimilarPlace = {
  branchId: string
  placeId: string
  name: string
  type: PlaceType
  area: string | null
  similarity: number
  shared: string[]
  photoUrl: string | null
}

/**
 * The places whose fingerprint is closest to this one's: what search by
 * meaning and For you treat as "like this place".
 */
export function BranchSimilar({ branchId }: { branchId: string }) {
  const api = useApi()
  const placeTypes = useLookup("place-types")
  const similar = useQuery({
    queryKey: ["branch-similar", branchId],
    queryFn: async () =>
      (await api<SimilarPlace[]>(`/admin/branches/${branchId}/similar`)).data,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar places</CardTitle>
        <CardDescription>
          The closest places by what's known about them: name, kind, area,
          cuisines, tags, description, reviews and menu. Search by meaning and
          For you use the same closeness. A list that looks wrong usually means
          this place's details are thin or off.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiErrorAlert
          error={similar.error}
          title="Couldn't load similar places"
        />
        {similar.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : similar.data?.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No fingerprint yet</EmptyTitle>
              <EmptyDescription>
                Live places get one within a few minutes of going live or
                changing.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="flex flex-col divide-y">
            {similar.data?.map((place, i) => (
              <li key={place.branchId} className="flex items-center gap-3 py-2">
                <span className="w-5 text-right text-sm text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                {place.photoUrl ? (
                  <img
                    src={photoSize(place.photoUrl, 80)}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    className="size-9 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={Image01Icon}
                      strokeWidth={2}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/places/${place.placeId}?branch=${place.branchId}`}
                    className="font-medium hover:underline"
                  >
                    {place.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[placeTypes.nameOf(place.type), place.area]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="hidden max-w-[45%] flex-wrap justify-end gap-1 sm:flex">
                  {place.shared.slice(0, 4).map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
