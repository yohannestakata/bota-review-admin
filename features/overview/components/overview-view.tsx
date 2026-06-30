"use client"

import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiErrorMessage } from "@/lib/api-client"
import { useOverview } from "../queries"
import type { OverviewActivity, OverviewMetric } from "../types"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function MetricCard({ metric }: { metric: OverviewMetric }) {
  const value =
    metric.value !== null && Number.isFinite(metric.value) ? metric.value : null
  const needsWork = (value ?? 0) > 0
  return (
    <Card>
      <CardHeader>
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value === null ? "-" : String(value)}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-sm text-muted-foreground">
          {metric.detail}
        </div>
        <Button
          variant={needsWork ? "default" : "outline"}
          size="sm"
          nativeButton={false}
          render={<Link href={metric.href} />}
        >
          Open
          <ArrowRightIcon className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function ActivityRow({ item }: { item: OverviewActivity }) {
  return (
    <Link
      href={item.href}
      className="grid gap-1 rounded-md border p-3 transition-colors hover:bg-muted/60"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium">{item.label}</span>
        {item.priority ? (
          <Badge
            variant={item.priority === "high" ? "destructive" : "outline"}
            className="capitalize"
          >
            {item.priority}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate capitalize">{item.detail}</span>
        <span className="shrink-0">{formatDate(item.createdAt)}</span>
      </div>
    </Link>
  )
}

export function OverviewView() {
  const { data, isPending, isError, error } = useOverview()

  if (isError) {
    return (
      <div className="p-4 text-sm text-destructive lg:p-6">
        {apiErrorMessage(error)}
      </div>
    )
  }

  if (isPending || !data) {
    return (
      <div className="grid gap-4 p-4 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  const urgent = data.metrics.filter(
    (metric) =>
      metric.value !== null && Number.isFinite(metric.value) && metric.value > 0
  )
  const quiet = urgent.length === 0

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Admin overview</h2>
          <p className="text-sm text-muted-foreground">
            Moderation, curation, and catalog health at a glance.
          </p>
        </div>
        <Badge variant={quiet ? "outline" : "destructive"}>
          {quiet ? (
            <CheckCircle2Icon className="size-4" />
          ) : (
            <AlertTriangleIcon className="size-4" />
          )}
          {quiet ? "No urgent queues" : `${urgent.length} active queues`}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardListIcon className="size-5" />
            Recent queue items
          </CardTitle>
          <CardDescription>
            Newest submissions, reviews, replies, claims, and photos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {data.workQueue.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nothing needs attention right now.
            </div>
          ) : (
            data.workQueue.map((item) => <ActivityRow key={item.id} item={item} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
