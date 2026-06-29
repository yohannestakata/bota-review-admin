"use client"

import { ArrowLeftIcon, Building2Icon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { NaturalDatePicker } from "@/components/natural-date-picker"
import { BranchMenus } from "@/features/menus"
import { BranchPhotos } from "@/features/photos"
import {
  branchSectionForSubmission,
  BranchSubmissions,
  useReviewSubmission,
} from "@/features/submissions"
import type { SubmissionListItem } from "@/features/submissions"
import {
  useAmenities,
  useCuisines,
  useNeighborhoods,
  useTags,
} from "@/features/taxonomy"
import { apiErrorMessage } from "@/lib/api-client"
import { STATUS_VARIANT } from "../format"
import {
  useArchiveBranch,
  useBranch,
  usePublishBranch,
  useSaveBranch,
  useUnpublishBranch,
} from "../queries"
import type { AdminBranch, BranchHours, UpdateBranchBody } from "../types"
import { BranchHoursEditor, normalizeHours } from "./branch-hours"

const PRICE_LEVELS = [
  { value: "none", label: "—" },
  { value: "1", label: "$" },
  { value: "2", label: "$$" },
  { value: "3", label: "$$$" },
  { value: "4", label: "$$$$" },
]

const BRANCH_STATUSES = ["draft", "published", "archived"] as const

type FormState = {
  label: string
  addressText: string
  latitude: string
  longitude: string
  phone: string
  hours: BranchHours
  verifiedAt: Date | undefined
  priceLevel: string
  status: AdminBranch["status"]
  neighborhoodId: string
  cuisineIds: string[]
  tagIds: string[]
  amenityIds: string[]
}

function initForm(branch: AdminBranch): FormState {
  return {
    label: branch.label ?? "",
    addressText: branch.addressText ?? "",
    latitude: branch.latitude ?? "",
    longitude: branch.longitude ?? "",
    phone: branch.phone ?? "",
    hours: branch.hours ?? {},
    verifiedAt: branch.informationLastVerifiedAt
      ? new Date(branch.informationLastVerifiedAt)
      : undefined,
    priceLevel: branch.priceLevel ? String(branch.priceLevel) : "none",
    status: branch.status,
    neighborhoodId: branch.neighborhood?.id ?? "none",
    cuisineIds: branch.cuisines.map((c) => c.id),
    tagIds: branch.tags.map((t) => t.id),
    amenityIds: branch.amenities.map((a) => a.id),
  }
}

const TAG_CATEGORY_ORDER = ["vibe", "diet", "time", "practical"]
const TAG_CATEGORY_LABEL: Record<string, string> = {
  vibe: "Vibe",
  diet: "Diet",
  time: "Time",
  practical: "Practical",
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: { id: string; name: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">None available.</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Toggle
          key={option.id}
          variant="outline"
          size="sm"
          pressed={selected.includes(option.id)}
          onPressedChange={() => onToggle(option.id)}
          className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
        >
          {option.name}
        </Toggle>
      ))}
    </div>
  )
}

function TagChips({
  tags,
  selected,
  onToggle,
}: {
  tags: { id: string; name: string; category: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const categories = [
    ...TAG_CATEGORY_ORDER,
    ...[...new Set(tags.map((t) => t.category))].filter(
      (c) => !TAG_CATEGORY_ORDER.includes(c)
    ),
  ]
  const groups = categories
    .map((category) => ({
      category,
      items: tags.filter((t) => t.category === category),
    }))
    .filter((group) => group.items.length > 0)

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">None available.</p>
  }

  return (
    <div className="grid gap-3">
      {groups.map(({ category, items }) => (
        <div key={category} className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {TAG_CATEGORY_LABEL[category] ?? category}
          </span>
          <ChipGroup options={items} selected={selected} onToggle={onToggle} />
        </div>
      ))}
    </div>
  )
}

function selectedCount(count: number): string {
  return count ? ` · ${count}` : ""
}

export function BranchDetailView({ branchId }: { branchId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // The submission being resolved — seeded from a deep link, or set by clicking
  // Edit/Enrich in the aside. Saving the branch marks it reviewed.
  const resolveParam = searchParams.get("resolveSubmission")
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(
    () => resolveParam
  )
  // Re-sync when the deep link changes while the component stays mounted (e.g.
  // opening another submission for the same branch). A null param means "no deep
  // link", so it doesn't clobber a value set from the aside.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (resolveParam) setActiveSubmissionId(resolveParam)
  }, [resolveParam])
  const { data: branch, isPending, isError, error } = useBranch(branchId)
  const cuisines = useCuisines()
  const tags = useTags()
  const amenities = useAmenities()
  const neighborhoods = useNeighborhoods()

  const [form, setForm] = useState<FormState | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (branch) setForm(initForm(branch))
  }, [branch])

  const save = useSaveBranch(branchId)
  const publish = usePublishBranch()
  const unpublish = useUnpublishBranch()
  const archive = useArchiveBranch()
  const resolveSubmission = useReviewSubmission()
  const busy =
    save.isPending ||
    publish.isPending ||
    unpublish.isPending ||
    archive.isPending ||
    resolveSubmission.isPending

  if (isError) {
    return (
      <div className="p-4 text-sm text-destructive lg:p-6">
        {apiErrorMessage(error)}
      </div>
    )
  }

  if (isPending || !branch || !form) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    )
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const toggle = (key: "cuisineIds" | "tagIds" | "amenityIds", id: string) =>
    setForm((prev) => {
      if (!prev) return prev
      const has = prev[key].includes(id)
      return {
        ...prev,
        [key]: has ? prev[key].filter((x) => x !== id) : [...prev[key], id],
      }
    })

  function onSave() {
    if (!form) return
    const branchBody: UpdateBranchBody = {
      label: form.label.trim(),
      addressText: form.addressText.trim(),
      hours: normalizeHours(form.hours),
      informationLastVerifiedAt: form.verifiedAt
        ? form.verifiedAt.toISOString()
        : null,
      cuisineIds: form.cuisineIds,
      tagIds: form.tagIds,
      amenityIds: form.amenityIds,
      status: form.status,
    }
    if (form.phone.trim()) branchBody.phone = form.phone.trim()
    if (form.latitude.trim()) branchBody.latitude = form.latitude.trim()
    if (form.longitude.trim()) branchBody.longitude = form.longitude.trim()
    if (form.priceLevel !== "none")
      branchBody.priceLevel = Number(form.priceLevel)
    if (form.neighborhoodId !== "none")
      branchBody.neighborhoodId = form.neighborhoodId

    save.mutate(
      branchBody,
      {
        onSuccess: () => {
          toast.success("Saved")
          resolveLinkedSubmission("Resolved by saving branch changes")
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  function resolveLinkedSubmission(note: string) {
    if (!activeSubmissionId) return
    resolveSubmission.mutate(
      { id: activeSubmissionId, note },
      {
        onSuccess: () => {
          toast.success("Submission resolved")
          setActiveSubmissionId(null)
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  // Clicking Edit/Enrich on an aside card: target it for resolution and jump to
  // the relevant section so the moderator can make the change, then Save.
  function onEditSubmission(submission: SubmissionListItem) {
    setActiveSubmissionId(submission.id)
    const section = branchSectionForSubmission(submission)
    document
      .getElementById(section)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function runStatus(
    mutation: { mutate: (id: string, opts: object) => void },
    message: string,
    resolveNote?: string
  ) {
    mutation.mutate(branchId, {
      onSuccess: () => {
        toast.success(message)
        if (resolveNote) resolveLinkedSubmission(resolveNote)
      },
      onError: (e: unknown) => toast.error(apiErrorMessage(e)),
    })
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div id="status" className="flex scroll-mt-6 flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => router.push("/branches")}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h2 className="text-xl font-semibold">{branch.place.name}</h2>
        <Badge variant={STATUS_VARIANT[form.status]}>{form.status}</Badge>

        <div className="ml-auto flex items-center gap-2">
          {branch.status !== "published" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                runStatus(
                  publish,
                  "Published",
                  "Resolved by publishing the branch"
                )
              }
            >
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                runStatus(
                  unpublish,
                  "Unpublished",
                  "Resolved by unpublishing the branch"
                )
              }
            >
              Unpublish
            </Button>
          )}
          {branch.status !== "archived" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                runStatus(archive, "Archived", "Resolved by archiving branch")
              }
            >
              Archive
            </Button>
          ) : null}
          <Button size="sm" disabled={busy} onClick={onSave}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <FieldGroup className="max-w-2xl flex-1">
        <FieldSet id="place" className="scroll-mt-6">
          <FieldLegend>Place</FieldLegend>
          <FieldDescription>
            Shared business profile used by every branch under this place.
          </FieldDescription>
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Building2Icon className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {branch.place.name ?? "Untitled place"}
                </div>
                <div className="text-xs capitalize text-muted-foreground">
                  {branch.place.type} · {branch.place.status}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/places/${branch.place.id}`} />}
            >
              <ExternalLinkIcon className="size-4" />
              Open place
            </Button>
          </div>
        </FieldSet>

        <FieldSeparator />

        <FieldSet id="location" className="scroll-mt-6">
          <FieldLegend>Location &amp; contact</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="label">Branch label</FieldLabel>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="branch-status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  set("status", value as AdminBranch["status"])
                }
              >
                <SelectTrigger id="branch-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_STATUSES.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="neighborhood">Neighborhood</FieldLabel>
              <Select
                value={form.neighborhoodId}
                onValueChange={(v) => set("neighborhoodId", v ?? "none")}
              >
                <SelectTrigger id="neighborhood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(neighborhoods.data ?? []).map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                value={form.addressText}
                onChange={(e) => set("addressText", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
                <Input
                  id="latitude"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                  placeholder="9.0107"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
                <Input
                  id="longitude"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                  placeholder="38.7975"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <Select
                  value={form.priceLevel}
                  onValueChange={(v) => set("priceLevel", v ?? "none")}
                >
                  <SelectTrigger id="price">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_LEVELS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet id="hours" className="scroll-mt-6">
          <FieldLegend>Hours</FieldLegend>
          <FieldDescription>
            Opening hours per day. Leave a day with no times to mark it closed.
          </FieldDescription>
          <BranchHoursEditor
            value={form.hours}
            onChange={(hours) => set("hours", hours)}
          />
        </FieldSet>

        <FieldSeparator />

        <FieldSet id="verification" className="scroll-mt-6">
          <FieldLegend>Verification</FieldLegend>
          <FieldDescription>
            When this branch&apos;s information was last confirmed accurate.
          </FieldDescription>
          <Field className="max-w-xs">
            <FieldLabel htmlFor="verified-at">Last verified</FieldLabel>
            <NaturalDatePicker
              id="verified-at"
              value={form.verifiedAt}
              onChange={(date) => set("verifiedAt", date)}
            />
          </Field>
        </FieldSet>

        <FieldSeparator />

        <FieldSet id="classification" className="scroll-mt-6">
          <FieldLegend>Classification</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Cuisines{selectedCount(form.cuisineIds.length)}</FieldLabel>
              <ChipGroup
                options={cuisines.data ?? []}
                selected={form.cuisineIds}
                onToggle={(id) => toggle("cuisineIds", id)}
              />
            </Field>
            <Field>
              <FieldLabel>Tags{selectedCount(form.tagIds.length)}</FieldLabel>
              <TagChips
                tags={tags.data ?? []}
                selected={form.tagIds}
                onToggle={(id) => toggle("tagIds", id)}
              />
            </Field>
            <Field>
              <FieldLabel>
                Amenities{selectedCount(form.amenityIds.length)}
              </FieldLabel>
              <ChipGroup
                options={amenities.data ?? []}
                selected={form.amenityIds}
                onToggle={(id) => toggle("amenityIds", id)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet id="menus" className="scroll-mt-6">
          <FieldLegend>Menus</FieldLegend>
          <FieldDescription>
            Menu sections and items shown on the branch menu screen.
          </FieldDescription>
          <BranchMenus branchId={branchId} />
        </FieldSet>

        <FieldSeparator />

        <FieldSet id="photos" className="scroll-mt-6">
          <FieldLegend>Photos</FieldLegend>
          <FieldDescription>
            At least one photo is required to publish. Uploads here are
            auto-approved.
          </FieldDescription>
          <BranchPhotos branchId={branchId} />
        </FieldSet>
        </FieldGroup>

        <aside className="w-full shrink-0 xl:w-80">
          <BranchSubmissions
            branchId={branchId}
            activeId={activeSubmissionId}
            onEdit={onEditSubmission}
          />
        </aside>
      </div>
    </div>
  )
}
