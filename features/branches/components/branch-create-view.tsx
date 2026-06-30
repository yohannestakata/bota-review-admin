"use client"

import { ArrowLeftIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Toggle } from "@/components/ui/toggle"
import { NaturalDatePicker } from "@/components/natural-date-picker"
import { usePlaces } from "@/features/places"
import {
  useAmenities,
  useCuisines,
  useNeighborhoods,
  useTags,
} from "@/features/taxonomy"
import { apiErrorMessage } from "@/lib/api-client"
import { useCreateBranch } from "../queries"
import type { AdminBranch, BranchHours, CreateBranchBody } from "../types"
import { BranchHoursEditor, normalizeHours } from "./branch-hours"

const PRICE_LEVELS = [
  { value: "none", label: "-" },
  { value: "1", label: "$" },
  { value: "2", label: "$$" },
  { value: "3", label: "$$$" },
  { value: "4", label: "$$$$" },
]
const BRANCH_STATUSES: AdminBranch["status"][] = [
  "draft",
  "published",
  "archived",
]
const TAG_CATEGORY_ORDER = ["vibe", "diet", "time", "practical"]
const TAG_CATEGORY_LABEL: Record<string, string> = {
  vibe: "Vibe",
  diet: "Diet",
  time: "Time",
  practical: "Practical",
}

type FormState = {
  placeId: string
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
    ...[...new Set(tags.map((tag) => tag.category))].filter(
      (category) => !TAG_CATEGORY_ORDER.includes(category)
    ),
  ]
  const groups = categories
    .map((category) => ({
      category,
      items: tags.filter((tag) => tag.category === category),
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

export function BranchCreateView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const create = useCreateBranch()
  const places = usePlaces({ page: 1, limit: 50 })
  const cuisines = useCuisines()
  const tags = useTags()
  const amenities = useAmenities()
  const neighborhoods = useNeighborhoods()
  const [form, setForm] = useState<FormState>({
    placeId: searchParams.get("placeId") ?? "",
    label: searchParams.get("label") ?? "",
    addressText: searchParams.get("addressText") ?? "",
    latitude: "",
    longitude: "",
    phone: "",
    hours: {},
    verifiedAt: undefined,
    priceLevel: "none",
    status: "draft",
    neighborhoodId: searchParams.get("neighborhoodId") ?? "none",
    cuisineIds: [],
    tagIds: [],
    amenityIds: [],
  })

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggle = (key: "cuisineIds" | "tagIds" | "amenityIds", id: string) =>
    setForm((prev) => {
      const has = prev[key].includes(id)
      return {
        ...prev,
        [key]: has
          ? prev[key].filter((value) => value !== id)
          : [...prev[key], id],
      }
    })

  function body(): CreateBranchBody {
    const payload: CreateBranchBody = {
      placeId: form.placeId,
      label: form.label.trim(),
      addressText: form.addressText.trim(),
      hours: normalizeHours(form.hours),
      status: form.status,
      informationLastVerifiedAt: form.verifiedAt
        ? form.verifiedAt.toISOString()
        : null,
      cuisineIds: form.cuisineIds,
      tagIds: form.tagIds,
      amenityIds: form.amenityIds,
    }
    if (form.neighborhoodId !== "none")
      payload.neighborhoodId = form.neighborhoodId
    if (form.latitude.trim()) payload.latitude = form.latitude.trim()
    if (form.longitude.trim()) payload.longitude = form.longitude.trim()
    if (form.phone.trim()) payload.phone = form.phone.trim()
    if (form.priceLevel !== "none") payload.priceLevel = Number(form.priceLevel)
    return payload
  }

  function onCreate() {
    create.mutate(body(), {
      onSuccess: (branch) => {
        toast.success("Branch created")
        router.push(`/branches/${branch.id}`)
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    })
  }

  const canCreate = form.placeId && form.label.trim() && form.addressText.trim()

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          nativeButton={false}
          render={<Link href="/branches" />}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h2 className="text-xl font-semibold">New branch</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/places/new" />}
          >
            <PlusIcon className="size-4" />
            New place
          </Button>
          <Button
            size="sm"
            disabled={create.isPending || !canCreate}
            onClick={onCreate}
          >
            {create.isPending ? "Creating..." : "Create branch"}
          </Button>
        </div>
      </div>

      <FieldGroup className="max-w-2xl">
        <FieldSet>
          <FieldLegend>Place</FieldLegend>
          <FieldDescription>
            Attach this location to an existing shared place profile.
          </FieldDescription>
          <Field>
            <FieldLabel htmlFor="place">Place</FieldLabel>
            <Select
              value={form.placeId}
              onValueChange={(value) => set("placeId", value ?? "")}
            >
              <SelectTrigger id="place">
                <SelectValue placeholder="Select place" />
              </SelectTrigger>
              <SelectContent>
                {(places.data?.data ?? []).map((place) => (
                  <SelectItem key={place.id} value={place.id}>
                    {place.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {places.isError ? (
            <p className="text-sm text-destructive">
              {apiErrorMessage(places.error)}
            </p>
          ) : null}
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Location &amp; contact</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="label">Branch label</FieldLabel>
              <Input
                id="label"
                value={form.label}
                onChange={(event) => set("label", event.target.value)}
                placeholder="Bole"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="branch-status">Status</FieldLabel>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    set("status", (value ?? "draft") as AdminBranch["status"])
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
                  onValueChange={(value) =>
                    set("neighborhoodId", value ?? "none")
                  }
                >
                  <SelectTrigger id="neighborhood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {(neighborhoods.data ?? []).map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id}>
                        {neighborhood.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                value={form.addressText}
                onChange={(event) => set("addressText", event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
                <Input
                  id="latitude"
                  value={form.latitude}
                  onChange={(event) => set("latitude", event.target.value)}
                  placeholder="9.0107"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
                <Input
                  id="longitude"
                  value={form.longitude}
                  onChange={(event) => set("longitude", event.target.value)}
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
                  onChange={(event) => set("phone", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <Select
                  value={form.priceLevel}
                  onValueChange={(value) => set("priceLevel", value ?? "none")}
                >
                  <SelectTrigger id="price">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Hours</FieldLegend>
          <BranchHoursEditor
            value={form.hours}
            onChange={(hours) => set("hours", hours)}
          />
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Verification</FieldLegend>
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

        <FieldSet>
          <FieldLegend>Classification</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>
                Cuisines{selectedCount(form.cuisineIds.length)}
              </FieldLabel>
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
      </FieldGroup>
    </div>
  )
}
