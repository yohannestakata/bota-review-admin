import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { ApiErrorAlert } from "@/components/api-error-alert"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useApi } from "@/lib/api"

type StatKey =
  "shown" | "opened" | "calls" | "directions" | "menu" | "saves" | "shares"

type BranchStats = {
  days: number
  stats: { key: StatKey; now: number; before: number; viaFeatured: number }[]
  people: number
  weekly: { week: string; shown: number; opened: number }[]
  reviews: { count: number; rating: number | null }
  placements: {
    id: string
    slot: "home" | "search"
    cuisineName: string | null
    startsAt: string
    endsAt: string
  }[]
}

const LABEL: Record<StatKey, string> = {
  shown: "Shown in lists",
  opened: "Opened the page",
  calls: "Called",
  directions: "Asked for directions",
  menu: "Looked at the menu",
  saves: "Saved",
  shares: "Shared",
}

const chartConfig = {
  shown: { label: "Shown", color: "var(--chart-2)" },
  opened: { label: "Opened", color: "var(--chart-1)" },
} satisfies ChartConfig

const shortDay = (day: string) =>
  new Date(`${day.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

function change(now: number, before: number) {
  if (before === 0) return now > 0 ? "New" : "—"
  const pct = Math.round(((now - before) / before) * 100)
  return `${pct > 0 ? "+" : ""}${pct}%`
}

/**
 * The same numbers the owner sees in the app ("Your numbers"): how often the
 * listing was shown and opened, and what people did from it.
 */
export function BranchStats({ branchId }: { branchId: string }) {
  const api = useApi()
  const [days, setDays] = useState(28)
  const stats = useQuery({
    queryKey: ["branch-stats", branchId, days],
    queryFn: async () =>
      (
        await api<BranchStats>(`/branches/${branchId}/stats`, {
          query: { days },
        })
      ).data,
    placeholderData: keepPreviousData,
  })

  if (stats.error) {
    return (
      <ApiErrorAlert error={stats.error} title="Couldn't load the numbers" />
    )
  }
  if (!stats.data) return <Skeleton className="h-96" />

  const data = stats.data
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>What people did</CardTitle>
          <CardDescription>
            Last {days} days, against the {days} before. Leaves out staff, test
            accounts and the owner’s own visits.
            {data.people ? ` ${data.people} people opened the page.` : ""}
          </CardDescription>
          <CardAction>
            <ToggleGroup
              value={[String(days)]}
              onValueChange={(v) => v[0] && setDays(Number(v[0]))}
              variant="outline"
              spacing={1}
            >
              {[7, 28, 90].map((d) => (
                <ToggleGroupItem key={d} value={String(d)}>
                  {d} days
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>What</TableHead>
                <TableHead className="text-right">Now</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">From Featured</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stats.map((s) => (
                <TableRow key={s.key}>
                  <TableCell className="font-medium">{LABEL[s.key]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.now.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.before.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {change(s.now, s.before)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.viaFeatured ? s.viaFeatured.toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Week by week</CardTitle>
          <CardDescription>
            {data.reviews.count === 0
              ? `No new reviews in the last ${days} days.`
              : `${data.reviews.count} new review${data.reviews.count === 1 ? "" : "s"} in the last ${days} days${
                  data.reviews.rating !== null
                    ? `, averaging ${data.reviews.rating}`
                    : ""
                }.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={data.weekly}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickFormatter={shortDay}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) =>
                      `Week of ${shortDay(String(label))}`
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="shown" fill="var(--color-shown)" radius={4} />
              <Bar dataKey="opened" fill="var(--color-opened)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
