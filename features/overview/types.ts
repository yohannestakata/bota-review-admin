export type OverviewMetric = {
  key: string
  label: string
  value: number | null
  href: string
  tone: "default" | "warning" | "danger" | "muted"
  detail: string
}

export type OverviewActivity = {
  id: string
  label: string
  detail: string
  href: string
  createdAt: string
  priority?: "low" | "normal" | "high"
}

export type OverviewData = {
  metrics: OverviewMetric[]
  workQueue: OverviewActivity[]
}
