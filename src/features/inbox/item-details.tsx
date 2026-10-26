import { photoSize } from "@/lib/images"
import { TimeAgo } from "@/components/time-ago"
import { LinkSquare02Icon, StarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"

import { useLookup, useTaxonomy } from "@/features/places/queries"
import type { TaxonRow } from "@/features/places/types"

import { AttachChooser } from "./attach-chooser"
import { HELD_LABEL, initials, placeLabel, SUBMISSION_LABEL } from "./format"
import type {
  ClaimRow,
  InboxItem,
  Person,
  PhotoRow,
  ReplyRow,
  ReviewRow,
  SubmissionRow,
} from "./types"

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <HugeiconsIcon
          aria-hidden="true"
          key={i}
          icon={StarIcon}
          strokeWidth={2}
          className={
            i < rating
              ? "fill-primary text-primary"
              : "text-muted-foreground/40"
          }
        />
      ))}
    </span>
  )
}

function Author({ person, meta }: { person: Person; meta: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {person.avatarUrl ? (
          <AvatarImage src={person.avatarUrl} alt="" />
        ) : null}
        <AvatarFallback>{initials(person.displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{person.displayName}</span>
        <span className="text-sm text-muted-foreground">{meta}</span>
      </div>
      <Badge
        variant={person.trustLevel === "flagged" ? "destructive" : "outline"}
        className="ml-auto"
      >
        {person.trustLevel === "new"
          ? "New user"
          : person.trustLevel === "trusted"
            ? "Trusted"
            : "Flagged user"}
      </Badge>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}

function ReviewDetail({
  review,
  reason,
}: {
  review: ReviewRow
  reason: InboxItem["reason"]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{placeLabel(review.branch)}</CardTitle>
        <CardDescription>
          {reason === "reported"
            ? `Reported by ${review.reportCount} ${review.reportCount === 1 ? "person" : "people"}`
            : reason === "spot-check"
              ? "Published automatically. Spot check it."
              : review.heldFor?.length
                ? `Held for a check: ${review.heldFor
                    .map((key) => HELD_LABEL[key] ?? key)
                    .join(", ")}`
                : "Waiting to be published"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Author
          person={review.user}
          meta={<TimeAgo iso={review.createdAt} />}
        />
        <Stars rating={review.rating} />
        <p className="leading-relaxed whitespace-pre-wrap">{review.text}</p>
        {review.visitDate ? (
          <p className="text-sm text-muted-foreground">
            Visited {review.visitDate}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ReplyDetail({
  reply,
  reason,
}: {
  reply: ReplyRow
  reason: InboxItem["reason"]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{placeLabel(reply.branch)}</CardTitle>
        <CardDescription>
          {reason === "reported"
            ? `Reply reported by ${reply.reportCount} ${reply.reportCount === 1 ? "person" : "people"}`
            : reply.authorRole === "owner"
              ? "Owner's reply to a review"
              : "Reply to a review"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Item variant="muted">
          <ItemContent>
            <ItemTitle>
              <Stars rating={reply.review.rating} />
            </ItemTitle>
            <ItemDescription className="line-clamp-4">
              {reply.review.text}
            </ItemDescription>
          </ItemContent>
        </Item>
        <Author
          person={reply.user}
          meta={
            <>
              {reply.authorRole === "owner" ? "Owner" : "User"} ·{" "}
              <TimeAgo iso={reply.createdAt} />
            </>
          }
        />
        <p className="leading-relaxed whitespace-pre-wrap">{reply.body}</p>
      </CardContent>
    </Card>
  )
}

function PhotoDetail({ photo }: { photo: PhotoRow }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{placeLabel(photo.branch)}</CardTitle>
        <CardDescription className="capitalize">
          {photo.category} photo
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <img
          src={photoSize(photo.url, 1200)}
          alt={`Photo by ${photo.uploader.displayName}, waiting for review`}
          width={photo.width}
          height={photo.height}
          className="max-h-[28rem] w-full rounded-md bg-muted object-contain"
        />
        <Author
          person={photo.uploader}
          meta={
            <>
              Uploaded <TimeAgo iso={photo.createdAt} />
            </>
          }
        />
      </CardContent>
    </Card>
  )
}

type PlaceMissing = {
  placeName?: string
  existingPlaceId?: string
  neighborhoodId?: string
  neighborhood?: string
  near?: string
  description?: string
  type?: string
  contactPhone?: string
  contactEmail?: string
  latitude?: number
  longitude?: number
  cuisines?: string[]
  foodCategories?: string[]
  tags?: string[]
  amenities?: string[]
  hours?: { day: string; open: string; close: string }[]
  menu?: { name: string; price?: number }[]
  photos?: {
    imageKey: string
    url: string
    width: number
    height: number
    thumbhash?: string
    category?: string
  }[]
}

function list(values?: string[]) {
  return values && values.length > 0 ? values.join(", ") : null
}

type Changes = { add?: string[]; remove?: string[] }

/**
 * Names for the food types, cuisines, tags and amenities a submission picked. Newer apps
 * send ids, older ones slugs; anything unknown shows as sent.
 */
function useTaxonNames() {
  const foodCategories = useTaxonomy("food-categories").data
  const cuisines = useTaxonomy("cuisines").data
  const tags = useTaxonomy("tags").data
  const amenities = useTaxonomy("amenities").data
  const names = (rows: TaxonRow[] | undefined, values?: string[]) =>
    values?.map((v) => rows?.find((r) => r.id === v || r.slug === v)?.name ?? v)
  const changes = (rows: TaxonRow[] | undefined, c?: Changes) => [
    ...(names(rows, c?.add) ?? []).map((n) => `+ ${n}`),
    ...(names(rows, c?.remove) ?? []).map((n) => `− ${n}`),
  ]
  return {
    foodCategories: (v?: string[]) => names(foodCategories, v),
    cuisines: (v?: string[]) => names(cuisines, v),
    tags: (v?: string[]) => names(tags, v),
    amenities: (v?: string[]) => names(amenities, v),
    foodCategoryChanges: (c?: Changes) => changes(foodCategories, c),
    cuisineChanges: (c?: Changes) => changes(cuisines, c),
    tagChanges: (c?: Changes) => changes(tags, c),
    amenityChanges: (c?: Changes) => changes(amenities, c),
  }
}

const DAY_NAME: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
}

type MenuItemTip = {
  name: string
  price?: number
  category?: string
  photoIsNew?: boolean
}

type CorrectionDetails = {
  foodCategoryChanges?: Changes
  cuisineChanges?: Changes
  tagChanges?: Changes
  amenityChanges?: Changes
  foodCategories?: string[]
  cuisines?: string[]
  hourChanges?: (
    | { operation: "set"; day: string; open: string; close: string }
    | { operation: "close"; day: string }
  )[]
  hours?: { day: string; open: string; close: string }[]
  menuChanges?: (
    | { operation: "add"; item: MenuItemTip }
    | { operation: "update"; itemId: string; item: MenuItemTip }
    | { operation: "remove"; itemId: string; itemName: string }
  )[]
  menu?: MenuItemTip[]
  reportedPhotoId?: string
  reportedPhotoUrl?: string
}

// The details keys the rows below know how to show; anything else still
// shows, raw, so nothing a newer app sends goes unseen.
const SHOWN_KEYS = new Set([
  "foodCategoryChanges",
  "cuisineChanges",
  "tagChanges",
  "amenityChanges",
  "foodCategories",
  "cuisines",
  "hourChanges",
  "hours",
  "menuChanges",
  "menu",
  "photos",
  "reportedPhotoId",
  "reportedPhotoUrl",
])

function dish(item: MenuItemTip) {
  return [
    item.name,
    item.price != null ? `${item.price} Br` : null,
    item.photoIsNew ? "with a photo" : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

/** A correction's structured changes as labelled lines, in plain words. */
function correctionRows(
  details: CorrectionDetails,
  taxon: ReturnType<typeof useTaxonNames>
) {
  const rows: { label: string; lines: string[] }[] = []
  const add = (label: string, lines: string[] | undefined) => {
    if (lines?.length) rows.push({ label, lines })
  }
  add("Food types", taxon.foodCategoryChanges(details.foodCategoryChanges))
  add("Cuisines", taxon.cuisineChanges(details.cuisineChanges))
  add("Tags", taxon.tagChanges(details.tagChanges))
  add("Features", taxon.amenityChanges(details.amenityChanges))
  // Older apps sent the whole list instead of changes.
  add("Food types", taxon.foodCategories(details.foodCategories))
  add("Cuisines", taxon.cuisines(details.cuisines))
  add(
    "Hours",
    details.hourChanges?.map((change) =>
      change.operation === "close"
        ? `${DAY_NAME[change.day] ?? change.day}: closed`
        : `${DAY_NAME[change.day] ?? change.day}: ${change.open}–${change.close}`
    )
  )
  add(
    "Hours",
    details.hours?.map(
      (h) => `${DAY_NAME[h.day] ?? h.day}: ${h.open}–${h.close}`
    )
  )
  add(
    "Menu",
    details.menuChanges?.map((change) =>
      change.operation === "add"
        ? `+ ${dish(change.item)}`
        : change.operation === "update"
          ? `Change: ${dish(change.item)}`
          : `− ${change.itemName}`
    )
  )
  add(
    "Menu",
    details.menu?.map((item) => `+ ${dish(item)}`)
  )
  return rows
}

function SubmissionDetail({
  submission,
  attachTo,
  onAttachChange,
}: {
  submission: SubmissionRow
  /** A place to add this as a branch of ("" = a new place). */
  attachTo?: string
  onAttachChange?: (placeId: string) => void
}) {
  const details = (submission.details ?? {}) as PlaceMissing &
    Record<string, unknown>
  const isNew = submission.type === "place_missing"
  const allPhotos = Array.isArray(details.photos) ? details.photos : []
  // Menu photos go to Menu photos on approve (to be read into dishes); the
  // rest come to the Inbox one by one.
  const menuPhotos = allPhotos.filter((p) => p.category === "menu")
  const photos = allPhotos.filter((p) => p.category !== "menu")
  const taxon = useTaxonNames()
  const placeTypes = useLookup("place-types")
  const neighborhoods = useTaxonomy("neighborhoods").data
  const areaName =
    neighborhoods?.find((n) => n.id === details.neighborhoodId)?.name ??
    details.neighborhood
  const isCorrection = submission.type === "field_correction"
  const correction = details as CorrectionDetails
  const changeRows = isCorrection ? correctionRows(correction, taxon) : []
  const otherChanges = isCorrection
    ? Object.fromEntries(
        Object.entries(details).filter(([key]) => !SHOWN_KEYS.has(key))
      )
    : {}
  // A text field (name, phone, location…) has a value to compare; hours,
  // menus, tags and photos carry their changes in the details instead.
  const hasValue = submission.suggestedValue !== null
  const photoGrid = (items: typeof allPhotos) => (
    <div className="grid grid-cols-3 gap-2">
      {items.map((p) => (
        <a
          key={p.imageKey}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open the photo full size"
        >
          <img
            src={photoSize(p.url, 400)}
            alt=""
            width={400}
            height={400}
            loading="lazy"
            className="aspect-square rounded-md bg-muted object-cover"
          />
        </a>
      ))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isNew
            ? (details.placeName ?? "New place")
            : placeLabel(submission.branch)}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {SUBMISSION_LABEL[submission.type]}
          {submission.priority === "high" ? (
            <Badge variant="destructive">High priority</Badge>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Author
          person={submission.user}
          meta={
            <>
              Suggested <TimeAgo iso={submission.createdAt} />
            </>
          }
        />
        <Separator />
        <div className="flex flex-col gap-3">
          {isCorrection ? (
            <>
              {submission.fieldName ? (
                <Row label="Field">{submission.fieldName}</Row>
              ) : null}
              {hasValue ? (
                <>
                  <Row label="Now">{submission.currentValue ?? "Empty"}</Row>
                  <Row label="Suggested">
                    <span className="font-medium">
                      {submission.suggestedValue}
                    </span>
                  </Row>
                </>
              ) : null}
              {changeRows.map((row, index) => (
                <Row key={`${row.label}-${index}`} label={row.label}>
                  <span className="whitespace-pre-line">
                    {row.lines.join("\n")}
                  </span>
                </Row>
              ))}
              {menuPhotos.length ? (
                <Row label="Menu photos">
                  {menuPhotos.length === 1
                    ? "1 photo, shown below"
                    : `${menuPhotos.length} photos, shown below`}
                </Row>
              ) : null}
              {photos.length ? (
                <Row label="Photos">
                  {photos.length === 1
                    ? "1 photo, shown below"
                    : `${photos.length} photos, shown below`}
                </Row>
              ) : null}
              {correction.reportedPhotoId ? (
                <Row label="Reported photo">Shown below</Row>
              ) : null}
              {Object.keys(otherChanges).length > 0 ? (
                <Row label="Other">
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(otherChanges, null, 2)}
                  </pre>
                </Row>
              ) : null}
            </>
          ) : null}
          {isNew ? (
            <>
              <AttachChooser
                placeName={details.placeName ?? ""}
                suggestedId={details.existingPlaceId}
                value={attachTo ?? ""}
                onChange={(placeId) => onAttachChange?.(placeId)}
              />
              {/* Only for a new place: a branch keeps its place as it is. */}
              {!attachTo && (details.type || details.description) ? (
                <FieldSet>
                  <FieldLegend variant="label">Place</FieldLegend>
                  {details.type ? (
                    <Row label="Type">{placeTypes.nameOf(details.type)}</Row>
                  ) : null}
                  {details.description ? (
                    <Row label="About">{details.description}</Row>
                  ) : null}
                </FieldSet>
              ) : null}
              <FieldSet>
                <FieldLegend variant="label">Branch</FieldLegend>
                <Row label="Area">
                  {areaName ?? "Not given, the branch needs a name"}
                </Row>
                {details.near ? <Row label="Near">{details.near}</Row> : null}
                {details.contactPhone ? (
                  <Row label="Phone">{details.contactPhone}</Row>
                ) : null}
                {details.contactEmail ? (
                  <Row label="Email">{details.contactEmail}</Row>
                ) : null}
                {details.latitude != null && details.longitude != null ? (
                  <Row label="Location">
                    <a
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                      href={`https://www.google.com/maps/search/?api=1&query=${details.latitude},${details.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {details.latitude.toFixed(5)},{" "}
                      {details.longitude.toFixed(5)}
                      <HugeiconsIcon
                        aria-hidden="true"
                        icon={LinkSquare02Icon}
                        strokeWidth={2}
                        className="size-3.5"
                      />
                    </a>
                  </Row>
                ) : null}
                {list(taxon.foodCategories(details.foodCategories)) ? (
                  <Row label="Food types">
                    {list(taxon.foodCategories(details.foodCategories))}
                  </Row>
                ) : null}
                {list(taxon.cuisines(details.cuisines)) ? (
                  <Row label="Cuisines">
                    {list(taxon.cuisines(details.cuisines))}
                  </Row>
                ) : null}
                {list(taxon.tags(details.tags)) ? (
                  <Row label="Tags">{list(taxon.tags(details.tags))}</Row>
                ) : null}
                {list(taxon.amenities(details.amenities)) ? (
                  <Row label="Amenities">
                    {list(taxon.amenities(details.amenities))}
                  </Row>
                ) : null}
                {details.hours?.length ? (
                  <Row label="Hours">
                    {details.hours
                      .map((h) => `${h.day} ${h.open}–${h.close}`)
                      .join(", ")}
                  </Row>
                ) : null}
                {details.menu?.length ? (
                  <Row label="Menu">
                    {details.menu
                      .map((m) =>
                        m.price != null ? `${m.name} (${m.price} Br)` : m.name
                      )
                      .join(", ")}
                  </Row>
                ) : null}
              </FieldSet>
            </>
          ) : null}
          {submission.note ? <Row label="Note">{submission.note}</Row> : null}
        </div>
        {correction.reportedPhotoUrl ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              The photo they reported
            </p>
            {photoGrid([
              {
                imageKey: correction.reportedPhotoId ?? "reported",
                url: correction.reportedPhotoUrl,
                width: 0,
                height: 0,
              },
            ])}
          </div>
        ) : null}
        {menuPhotos.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Menu photos: once you approve, they go to Menu photos and are read
              into a draft of the dishes for you to check.
            </p>
            {photoGrid(menuPhotos)}
          </div>
        ) : null}
        {photos.length > 0 ? photoGrid(photos) : null}
      </CardContent>
    </Card>
  )
}

const METHOD_LABEL: Record<ClaimRow["verificationMethod"], string> = {
  business_email: "Business email",
  social_media: "Social media",
  phone_call: "Phone call",
  manual_review: "Manual review",
}

function ClaimDetail({ claim }: { claim: ClaimRow }) {
  const platforms = useLookup("claim-platforms")
  const evidence = claim.verificationEvidence
  const isLink = evidence ? /^https?:\/\//.test(evidence) : false
  return (
    <Card>
      <CardHeader>
        <CardTitle>{placeLabel(claim.branch)}</CardTitle>
        <CardDescription>Wants to manage this listing</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Row label="Name">{claim.contactName}</Row>
        <Row label="Role">
          <span className="capitalize">{claim.contactRole}</span>
        </Row>
        <Row label="Phone">{claim.contactPhone}</Row>
        <Row label="Email">{claim.contactEmail}</Row>
        <Separator />
        <Row label="Verify by">
          {METHOD_LABEL[claim.verificationMethod]}
          {claim.verificationPlatform
            ? ` (${platforms.nameOf(claim.verificationPlatform)})`
            : ""}
        </Row>
        {evidence ? (
          <Row label="Evidence">
            {isLink ? (
              <a
                className="underline-offset-4 hover:underline"
                href={evidence}
                target="_blank"
                rel="noreferrer"
              >
                {evidence}
              </a>
            ) : (
              evidence
            )}
          </Row>
        ) : null}
        {claim.branch.phone ? (
          <Row label="Listed phone">{claim.branch.phone}</Row>
        ) : null}
        {claim.note ? <Row label="Note">{claim.note}</Row> : null}
        <Separator />
        <Row label="Account">
          {claim.claimant.displayName}
          {claim.claimant.email ? ` · ${claim.claimant.email}` : ""}
        </Row>
        <Row label="Requested">
          <TimeAgo iso={claim.createdAt} />
        </Row>
      </CardContent>
    </Card>
  )
}

export function ItemDetail({
  item,
  attachTo,
  onAttachChange,
}: {
  item: InboxItem
  attachTo?: string
  onAttachChange?: (placeId: string) => void
}) {
  switch (item.kind) {
    case "review":
      return <ReviewDetail review={item.data} reason={item.reason} />
    case "reply":
      return <ReplyDetail reply={item.data} reason={item.reason} />
    case "photo":
      return <PhotoDetail photo={item.data} />
    case "submission":
      return (
        <SubmissionDetail
          submission={item.data}
          attachTo={attachTo}
          onAttachChange={onAttachChange}
        />
      )
    case "claim":
      return <ClaimDetail claim={item.data} />
  }
}
