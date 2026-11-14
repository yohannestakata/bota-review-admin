import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useApi } from "@/lib/api"

type Offer = {
  id: string
  kind: "deal" | "event"
  title: string
  details: string | null
  startsOn: string
  endsOn: string | null
  startTime: string | null
  endTime: string | null
  weekdays: number[] | null
  nextDate: string | null
  today: boolean
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const today = () => {
  // Addis time (UTC+3), the API's "today".
  const d = new Date(Date.now() + 3 * 3600_000)
  return d.toISOString().slice(0, 10)
}

function when(offer: Offer) {
  const days = offer.weekdays?.length
    ? offer.weekdays.map((d) => DAYS[d]).join(", ")
    : null
  const times = offer.startTime
    ? `${offer.startTime}${offer.endTime ? `–${offer.endTime}` : ""}`
    : null
  return [
    offer.kind === "deal"
      ? `${offer.startsOn} to ${offer.endsOn}`
      : days
        ? `from ${offer.startsOn} until ${offer.endsOn}`
        : offer.startsOn,
    days,
    times,
  ]
    .filter(Boolean)
    .join(" · ")
}

/**
 * A branch's deals and events, posting new ones (live at once; people who
 * saved the place hear about it), and when the place opened ("New in
 * Addis"). Owners post the same from the app.
 */
export function BranchOffers({ branchId }: { branchId: string }) {
  const api = useApi()
  const queryClient = useQueryClient()
  const key = ["branch-offers", branchId]
  const offers = useQuery({
    queryKey: key,
    queryFn: async () =>
      (await api<Offer[]>(`/branches/${branchId}/offers`)).data,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const fail = (error: Error) =>
    toast.add({
      title: "That didn't go through",
      description: error.message,
      type: "error",
    })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/offers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.add({ title: "Taken down", type: "success" })
      return refresh()
    },
    onError: fail,
  })

  const [kind, setKind] = useState<"deal" | "event">("deal")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [startsOn, setStartsOn] = useState(today())
  const [endsOn, setEndsOn] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [weekdays, setWeekdays] = useState<string[]>([])

  const post = useMutation({
    mutationFn: () =>
      api<Offer>(`/branches/${branchId}/offers`, {
        method: "POST",
        body: {
          kind,
          title,
          details: details.trim() || null,
          startsOn,
          endsOn: endsOn || null,
          startTime: startTime || null,
          endTime: endTime || null,
          weekdays: weekdays.length ? weekdays.map(Number) : null,
        },
      }),
    onSuccess: () => {
      toast.add({ title: "Posted", type: "success" })
      setTitle("")
      setDetails("")
      setEndsOn("")
      setStartTime("")
      setEndTime("")
      setWeekdays([])
      return refresh()
    },
    onError: fail,
  })

  const [openedOn, setOpenedOn] = useState("")
  const saveOpened = useMutation({
    mutationFn: (value: string | null) =>
      api(`/branches/${branchId}/opened-on`, {
        method: "PUT",
        body: { openedOn: value },
      }),
    onSuccess: (_data, value) =>
      toast.add({
        title: value ? `Opened on ${value}` : "Opening date cleared",
        type: "success",
      }),
    onError: fail,
  })

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Deals & events</CardTitle>
          <CardDescription>
            Live on the place's page and Home as soon as they're posted, and
            gone after their last day. People who saved the place get a heads-up
            (at most one every three days).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {offers.isPending ? <Skeleton className="h-16" /> : null}
          {offers.error ? (
            <ApiErrorAlert error={offers.error} title="Couldn't load them" />
          ) : null}
          {offers.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">None right now.</p>
          ) : null}
          {offers.data?.map((offer) => (
            <div
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
              key={offer.id}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {offer.kind === "deal" ? "Deal" : "Event"}
                  </Badge>
                  <span className="font-medium">{offer.title}</span>
                  {offer.today ? <Badge>On today</Badge> : null}
                </div>
                <span className="text-sm text-muted-foreground">
                  {when(offer)}
                </span>
                {offer.details ? (
                  <span className="text-sm">{offer.details}</span>
                ) : null}
              </div>
              <Button
                disabled={remove.isPending}
                onClick={() => remove.mutate(offer.id)}
                size="sm"
                variant="outline"
              >
                Take down
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Post one</CardTitle>
          <CardDescription>
            A deal runs every day between its dates (or only on the days ticked,
            or only between the times given). An event is on its date at its
            time; tick days to repeat it weekly until the last date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <ToggleGroup
              onValueChange={(value) =>
                value[0] && setKind(value[0] as "deal" | "event")
              }
              value={[kind]}
              variant="outline"
            >
              <ToggleGroupItem value="deal">Deal</ToggleGroupItem>
              <ToggleGroupItem value="event">Event</ToggleGroupItem>
            </ToggleGroup>
            <Field>
              <FieldLabel htmlFor="offer-title">Title</FieldLabel>
              <Input
                id="offer-title"
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === "deal" ? "Two-for-one burgers" : "Live jazz night"
                }
                value={title}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-details">
                Details (optional)
              </FieldLabel>
              <Textarea
                id="offer-details"
                maxLength={500}
                onChange={(e) => setDetails(e.target.value)}
                value={details}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="offer-start">
                  {kind === "deal" ? "First day" : "Date"}
                </FieldLabel>
                <Input
                  id="offer-start"
                  onChange={(e) => setStartsOn(e.target.value)}
                  type="date"
                  value={startsOn}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="offer-end">
                  {kind === "deal" ? "Last day" : "Repeats until (weekly)"}
                </FieldLabel>
                <Input
                  id="offer-end"
                  onChange={(e) => setEndsOn(e.target.value)}
                  type="date"
                  value={endsOn}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="offer-from">
                  {kind === "deal" ? "From (optional)" : "Starts at"}
                </FieldLabel>
                <Input
                  id="offer-from"
                  onChange={(e) => setStartTime(e.target.value)}
                  type="time"
                  value={startTime}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="offer-to">Until (optional)</FieldLabel>
                <Input
                  id="offer-to"
                  onChange={(e) => setEndTime(e.target.value)}
                  type="time"
                  value={endTime}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>
                {kind === "deal" ? "Only on (optional)" : "Repeats on"}
              </FieldLabel>
              <ToggleGroup
                multiple
                onValueChange={(value) => setWeekdays(value as string[])}
                value={weekdays}
                variant="outline"
              >
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <ToggleGroupItem key={d} value={String(d)}>
                    {DAYS[d]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <div>
              <Button
                disabled={post.isPending || title.trim().length < 3}
                onClick={() => post.mutate()}
              >
                Post
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>When it opened</CardTitle>
          <CardDescription>
            Places that opened in the last two months show in New in Addis on
            Home.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Field className="w-48">
            <FieldLabel htmlFor="opened-on">Opened on</FieldLabel>
            <Input
              id="opened-on"
              onChange={(e) => setOpenedOn(e.target.value)}
              type="date"
              value={openedOn}
            />
          </Field>
          <Button
            disabled={!openedOn || saveOpened.isPending}
            onClick={() => saveOpened.mutate(openedOn)}
          >
            Save
          </Button>
          <Button
            disabled={saveOpened.isPending}
            onClick={() => saveOpened.mutate(null)}
            variant="ghost"
          >
            Not new
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
