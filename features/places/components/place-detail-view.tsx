"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowLeftIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatDate,
  priceLabel,
  STATUS_VARIANT,
  VERIFICATION_LABEL,
  VERIFICATION_VARIANT,
} from "@/features/branches/format"
import { apiErrorMessage } from "@/lib/api-client"
import { usePlace, useSavePlace } from "../queries"
import type { AdminPlaceDetail, AdminPlaceBranch, PlaceStatus } from "../types"

const PLACE_TYPES = ["restaurant", "cafe", "bakery", "bar", "other"]
const PLACE_STATUSES: PlaceStatus[] = ["draft", "published", "archived"]

type FormState = {
  name: string
  type: string
  description: string
  status: PlaceStatus
}

function initForm(place: AdminPlaceDetail): FormState {
  return {
    name: place.name,
    type: place.type,
    description: place.description ?? "",
    status: place.status,
  }
}

const branchColumns: ColumnDef<AdminPlaceBranch>[] = [
  {
    id: "label",
    header: "Branch",
    cell: ({ row }) => (
      <Link
        href={`/branches/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.label ?? "Primary"}
      </Link>
    ),
  },
  {
    id: "neighborhood",
    header: "Neighborhood",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.neighborhood?.name ?? "—"}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "verification",
    header: "Verification",
    cell: ({ row }) => (
      <Badge variant={VERIFICATION_VARIANT[row.original.verificationStatus]}>
        {VERIFICATION_LABEL[row.original.verificationStatus]}
      </Badge>
    ),
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {priceLabel(row.original.priceLevel)}
      </span>
    ),
  },
  {
    id: "updated",
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.updatedAt)}
      </span>
    ),
  },
]

export function PlaceDetailView({ placeId }: { placeId: string }) {
  const { data: place, isPending, isError, error } = usePlace(placeId)
  const save = useSavePlace(placeId)
  const [form, setForm] = useState<FormState | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (place) setForm(initForm(place))
  }, [place])

  if (isError) {
    return (
      <div className="p-4 text-sm text-destructive lg:p-6">
        {apiErrorMessage(error)}
      </div>
    )
  }

  if (isPending || !place || !form) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    )
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  function onSave() {
    if (!form) return
    save.mutate(
      {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || null,
        status: form.status,
      },
      {
        onSuccess: () => toast.success("Saved"),
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          nativeButton={false}
          render={<Link href="/places" />}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h2 className="text-xl font-semibold">{place.name}</h2>
        <Badge variant={STATUS_VARIANT[place.status]}>{place.status}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/branches/new?placeId=${place.id}&label=${encodeURIComponent(
                  place.name
                )}`}
              />
            }
          >
            <PlusIcon className="size-4" />
            New branch
          </Button>
          <Button size="sm" disabled={save.isPending} onClick={onSave}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <FieldGroup className="max-w-2xl">
        <FieldSet>
          <FieldLegend>Place</FieldLegend>
          <FieldDescription>
            Shared profile used by every branch under this place.
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="type">Type</FieldLabel>
              <Select
                value={form.type}
                onValueChange={(value) => set("type", value ?? "")}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACE_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) => set("status", value as PlaceStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Branches</FieldLegend>
          <FieldDescription>
            Locations that belong to this shared place profile.
          </FieldDescription>
          <DataTable
            columns={branchColumns}
            data={place.branches}
            getRowId={(row) => row.id}
          />
        </FieldSet>
      </FieldGroup>
    </div>
  )
}
