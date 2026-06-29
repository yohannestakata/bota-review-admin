"use client"

import { ArrowLeftIcon } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { apiErrorMessage } from "@/lib/api-client"
import { useCreatePlace } from "../queries"
import type { PlaceStatus } from "../types"

const PLACE_TYPES = ["restaurant", "cafe", "bakery", "bar", "other"]
const PLACE_STATUSES: PlaceStatus[] = ["draft", "published", "archived"]

export function PlaceCreateView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const create = useCreatePlace()
  const [name, setName] = useState(searchParams.get("name") ?? "")
  const [type, setType] = useState("restaurant")
  const [status, setStatus] = useState<PlaceStatus>("draft")
  const [description, setDescription] = useState(
    searchParams.get("description") ?? ""
  )

  function onCreate() {
    create.mutate(
      {
        name: name.trim(),
        type,
        status,
        description: description.trim() || undefined,
      },
      {
        onSuccess: (place) => {
          toast.success("Place created")
          router.push(`/places/${place.id}`)
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
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
        <h2 className="text-xl font-semibold">New place</h2>
        <div className="ml-auto">
          <Button
            size="sm"
            disabled={create.isPending || !name.trim()}
            onClick={onCreate}
          >
            {create.isPending ? "Creating..." : "Create place"}
          </Button>
        </div>
      </div>

      <FieldGroup className="max-w-2xl">
        <FieldSet>
          <FieldLegend>Place</FieldLegend>
          <FieldDescription>
            Shared business profile used by one or more branches.
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="place-name">Name</FieldLabel>
              <Input
                id="place-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Buna House"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="place-type">Type</FieldLabel>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value ?? "restaurant")}
                >
                  <SelectTrigger id="place-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACE_TYPES.map((placeType) => (
                      <SelectItem
                        key={placeType}
                        value={placeType}
                        className="capitalize"
                      >
                        {placeType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="place-status">Status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as PlaceStatus)}
                >
                  <SelectTrigger id="place-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACE_STATUSES.map((placeStatus) => (
                      <SelectItem
                        key={placeStatus}
                        value={placeStatus}
                        className="capitalize"
                      >
                        {placeStatus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="place-description">Description</FieldLabel>
              <Textarea
                id="place-description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  )
}
