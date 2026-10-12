import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { useMe } from "@/app/auth-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"

import { formatValue, useGrowth, useSetTarget, type Goal } from "./queries"

const STATUS: Record<
  Goal["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  met: { label: "Met", variant: "default" },
  behind: { label: "Not yet", variant: "secondary" },
  no_data: { label: "Not enough data", variant: "outline" },
}

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig

const shortDay = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

/**
 * Growth: the five goals to hit in Addis before charging businesses, each
 * against its target with a 12-week trend, plus where the gaps are.
 */
export function GrowthPage() {
  const growth = useGrowth()
  const me = useMe()
  const [editing, setEditing] = useState<Goal | null>(null)

  if (growth.isPending) {
    return (
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    )
  }
  if (growth.error) {
    return (
      <div className="p-6">
        <ApiErrorAlert error={growth.error} title="Couldn't load growth" />
      </div>
    )
  }

  const data = growth.data
  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Ready to charge businesses?</CardTitle>
          <CardDescription>
            {data.metCount} of {data.goals.length} goals met. When all five
            hold, start asking businesses to pay. Staff accounts and test builds
            aren’t counted. Updated{" "}
            {new Date(data.generatedAt).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
            .
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.goals.map((goal) => (
          <Card key={goal.key}>
            <CardHeader>
              <CardTitle>{goal.label}</CardTitle>
              <CardDescription>{goal.description}</CardDescription>
              <CardAction>
                <Badge variant={STATUS[goal.status].variant}>
                  {STATUS[goal.status].label}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="text-3xl font-semibold tabular-nums">
                {formatValue(goal.value, goal.unit)}
              </div>
              <Progress
                value={Math.round(goal.progress * 100)}
                aria-label={`${goal.label}: ${Math.round(goal.progress * 100)}% of the goal`}
              />
              {goal.note ? (
                <p className="text-sm text-muted-foreground">{goal.note}</p>
              ) : null}
              <ChartContainer config={chartConfig} className="h-28 w-full">
                <LineChart data={goal.trend} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={shortDay}
                    minTickGap={24}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => shortDay(String(label))}
                        formatter={(value) =>
                          formatValue(
                            value === null ? null : Number(value),
                            goal.unit
                          )
                        }
                      />
                    }
                  />
                  <Line
                    dataKey="value"
                    type="monotone"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-sm text-muted-foreground">
                Goal: {formatValue(goal.target, goal.unit)}
              </span>
              {me?.role === "admin" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(goal)}
                >
                  Change goal
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Who comes back</CardTitle>
          <CardDescription>
            People grouped by the week they started, and the share who came back
            the next day, in their second week, and around day 30. Blank until a
            group is old enough to tell.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started the week of</TableHead>
                <TableHead className="text-right">People</TableHead>
                <TableHead className="text-right">Next day</TableHead>
                <TableHead className="text-right">Week 2</TableHead>
                <TableHead className="text-right">Day 30</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cohorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Nobody yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.cohorts.map((row) => (
                  <TableRow key={row.week}>
                    <TableCell>{shortDay(row.week)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.size}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatValue(row.d1, "percent")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatValue(row.d7, "percent")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatValue(row.d30, "percent")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reviews by neighbourhood</CardTitle>
            <CardDescription>
              Where reviews are piling up, and where places still have none.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Neighbourhood</TableHead>
                  <TableHead className="text-right">Places</TableHead>
                  <TableHead className="text-right">With 3+ reviews</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byNeighborhood.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.places.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.withThree}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.reviews}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Searched for, not found</CardTitle>
            <CardDescription>Last 30 days. What to add next.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search</TableHead>
                  <TableHead className="text-right">Times</TableHead>
                  <TableHead className="text-right">Last</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.noResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      Every search found something.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.noResults.map((row) => (
                    <TableRow key={row.query}>
                      <TableCell className="font-medium">{row.query}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.times}
                      </TableCell>
                      <TableCell className="text-right">
                        {shortDay(row.lastAt.slice(0, 10))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TargetDialog
        key={editing?.key ?? "none"}
        goal={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

function TargetDialog({
  goal,
  onClose,
}: {
  goal: Goal | null
  onClose: () => void
}) {
  const setTarget = useSetTarget()
  // Remounted per goal (key), so this starts at that goal's target.
  const [value, setValue] = useState(() => (goal ? String(goal.target) : ""))
  const parsed = Number(value)
  const valid = value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0

  return (
    <Dialog
      open={goal !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change goal</DialogTitle>
          <DialogDescription>{goal?.label}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="goal-target">Goal</FieldLabel>
          <Input
            id="goal-target"
            inputMode="decimal"
            value={value}
            placeholder={String(goal?.target ?? "")}
            onChange={(event) => setValue(event.target.value)}
          />
          <FieldDescription>
            {goal?.unit === "percent"
              ? "A percentage, like 25."
              : goal?.unit === "per_week"
                ? "Times a week, like 3."
                : "A number, like 500."}
          </FieldDescription>
        </Field>
        <ApiErrorAlert error={setTarget.error} title="Couldn't save the goal" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || setTarget.isPending}
            onClick={() =>
              goal &&
              setTarget.mutate(
                { key: goal.key, target: parsed },
                {
                  onSuccess: () => {
                    toast.add({ title: "Goal updated", type: "success" })
                    onClose()
                  },
                }
              )
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
