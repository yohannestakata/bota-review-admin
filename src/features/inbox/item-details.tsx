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
import { Separator } from "@/components/ui/separator"

import { ago, initials, placeLabel, SUBMISSION_LABEL } from "./format"
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

function Author({ person, meta }: { person: Person; meta: string }) {
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
            ? `Reported by ${review.reportCount} people`
            : reason === "spot-check"
              ? "Published automatically. Spot check it."
              : "Waiting to be published"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Author person={review.user} meta={ago(review.createdAt)} />
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
            ? `Reply reported by ${reply.reportCount} people`
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
          meta={`${reply.authorRole === "owner" ? "Owner" : "User"} · ${ago(reply.createdAt)}`}
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
          src={photo.url}
          alt=""
          className="max-h-[28rem] w-full rounded-md bg-muted object-contain"
        />
        <Author
          person={photo.uploader}
          meta={`Uploaded ${ago(photo.createdAt)}`}
        />
      </CardContent>
    </Card>
  )
}

type PlaceMissing = {
  placeName?: string
  neighborhood?: string
  description?: string
  type?: string
  contactPhone?: string
  contactEmail?: string
  latitude?: number
  longitude?: number
  cuisines?: string[]
  tags?: string[]
  amenities?: string[]
  hours?: { day: string; open: string; close: string }[]
  menu?: { name: string; price?: number }[]
  photos?: { url: string }[]
}

function list(values?: string[]) {
  return values && values.length > 0 ? values.join(", ") : null
}

function SubmissionDetail({ submission }: { submission: SubmissionRow }) {
  const details = (submission.details ?? {}) as PlaceMissing &
    Record<string, unknown>
  const isNew = submission.type === "place_missing"
  const photos = Array.isArray(details.photos) ? details.photos : []

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
          meta={`Suggested ${ago(submission.createdAt)}`}
        />
        <Separator />
        <div className="flex flex-col gap-3">
          {submission.type === "field_correction" && submission.fieldName ? (
            <>
              <Row label="Field">{submission.fieldName}</Row>
              {submission.suggestedValue === null && photos.length > 0 ? (
                // A photo suggestion carries the photos, not a text value.
                <Row label="Suggested">
                  {photos.length === 1
                    ? "1 photo, shown below"
                    : `${photos.length} photos, shown below`}
                </Row>
              ) : (
                <>
                  <Row label="Now">{submission.currentValue ?? "Empty"}</Row>
                  <Row label="Suggested">
                    <span className="font-medium">
                      {submission.suggestedValue ?? "Empty"}
                    </span>
                  </Row>
                </>
              )}
            </>
          ) : null}
          {isNew ? (
            <>
              {details.type ? <Row label="Type">{details.type}</Row> : null}
              {details.neighborhood ? (
                <Row label="Area">{details.neighborhood}</Row>
              ) : null}
              {details.description ? (
                <Row label="About">{details.description}</Row>
              ) : null}
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
                      icon={LinkSquare02Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  </a>
                </Row>
              ) : null}
              {list(details.cuisines) ? (
                <Row label="Cuisines">{list(details.cuisines)}</Row>
              ) : null}
              {list(details.tags) ? (
                <Row label="Tags">{list(details.tags)}</Row>
              ) : null}
              {list(details.amenities) ? (
                <Row label="Amenities">{list(details.amenities)}</Row>
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
            </>
          ) : null}
          {!isNew &&
          submission.type === "field_correction" &&
          !submission.fieldName ? (
            <Row label="Changes">
              <pre className="font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(submission.details, null, 2)}
              </pre>
            </Row>
          ) : null}
          {submission.note ? <Row label="Note">{submission.note}</Row> : null}
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <img
                key={p.url}
                src={p.url}
                alt=""
                className="aspect-square rounded-md bg-muted object-cover"
              />
            ))}
          </div>
        ) : null}
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
          {claim.verificationPlatform ? ` (${claim.verificationPlatform})` : ""}
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
        <Row label="Requested">{ago(claim.createdAt)}</Row>
      </CardContent>
    </Card>
  )
}

export function ItemDetail({ item }: { item: InboxItem }) {
  switch (item.kind) {
    case "review":
      return <ReviewDetail review={item.data} reason={item.reason} />
    case "reply":
      return <ReplyDetail reply={item.data} reason={item.reason} />
    case "photo":
      return <PhotoDetail photo={item.data} />
    case "submission":
      return <SubmissionDetail submission={item.data} />
    case "claim":
      return <ClaimDetail claim={item.data} />
  }
}
