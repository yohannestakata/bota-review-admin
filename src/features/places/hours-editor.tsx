import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { DAYS } from "./labels"
import type { DayKey, Hours } from "./types"

/**
 * Opening hours as ranges per day. A day with no ranges is closed. A range
 * that ends earlier than it starts runs past midnight.
 */
export function HoursEditor({ value, onChange }: { value: Hours; onChange: (value: Hours) => void }) {
  const setDay = (day: DayKey, ranges: [string, string][]) => onChange({ ...value, [day]: ranges })

  const copyToAll = (day: DayKey) =>
    onChange(Object.fromEntries(DAYS.map((d) => [d.key, (value[day] ?? []).map((r) => [...r])])) as Hours)

  return (
    <div className="flex flex-col divide-y rounded-lg border">
      {DAYS.map(({ key, label }) => {
        const ranges = value[key] ?? []
        return (
          <div key={key} className="flex flex-wrap items-center gap-3 px-3 py-2">
            <span className="w-24 text-sm font-medium">{label}</span>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {ranges.length === 0 ? <span className="text-sm text-muted-foreground">Closed</span> : null}
              {ranges.map(([open, close], i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    type="time"
                    aria-label={`${label} opens`}
                    className="w-28"
                    value={open}
                    onChange={(e) => setDay(key, ranges.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    aria-label={`${label} closes`}
                    className="w-28"
                    value={close}
                    onChange={(e) => setDay(key, ranges.map((r, j) => (j === i ? [r[0], e.target.value] : r)))}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove hours"
                    onClick={() => setDay(key, ranges.filter((_, j) => j !== i))}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDay(key, [...ranges, ranges.length ? ["18:00", "22:00"] : ["08:00", "22:00"]])}
              >
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Hours
              </Button>
              {key === "mon" ? (
                <Button variant="ghost" size="sm" onClick={() => copyToAll("mon")}>
                  Copy to all days
                </Button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Times must be filled in, so the server's HH:MM check passes. */
export function hoursComplete(hours: Hours) {
  return Object.values(hours).every((ranges) => ranges.every(([a, b]) => Boolean(a && b)))
}
