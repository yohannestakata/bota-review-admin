"use client"

import { PlusIcon, XIcon } from "lucide-react"

import { TimePicker } from "@/components/time-picker"
import { Button } from "@/components/ui/button"
import type { BranchHours, DayKey, HoursInterval } from "../types"

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
]

export function BranchHoursEditor({
  value,
  onChange,
}: {
  value: BranchHours
  onChange: (next: BranchHours) => void
}) {
  function setDay(day: DayKey, intervals: HoursInterval[]) {
    onChange({ ...value, [day]: intervals })
  }

  function addInterval(day: DayKey) {
    setDay(day, [...(value[day] ?? []), ["09:00", "17:00"]])
  }

  function removeInterval(day: DayKey, index: number) {
    setDay(
      day,
      (value[day] ?? []).filter((_, i) => i !== index)
    )
  }

  function updateInterval(
    day: DayKey,
    index: number,
    pos: 0 | 1,
    time: string
  ) {
    setDay(
      day,
      (value[day] ?? []).map((interval, i) => {
        if (i !== index) return interval
        const next: HoursInterval = [interval[0], interval[1]]
        next[pos] = time
        return next
      })
    )
  }

  return (
    <div className="grid gap-3">
      {DAYS.map(({ key, label }) => {
        const intervals = value[key] ?? []
        return (
          <div
            key={key}
            className="grid grid-cols-[90px_1fr] items-start gap-3"
          >
            <div className="pt-1.5 text-sm font-medium">{label}</div>
            <div className="grid gap-2">
              {intervals.length === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Closed</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addInterval(key)}
                  >
                    <PlusIcon className="size-4" />
                    Add hours
                  </Button>
                </div>
              ) : (
                <>
                  {intervals.map((interval, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <TimePicker
                        value={interval[0]}
                        onChange={(time) =>
                          updateInterval(key, index, 0, time)
                        }
                      />
                      <span className="text-muted-foreground">–</span>
                      <TimePicker
                        value={interval[1]}
                        onChange={(time) =>
                          updateInterval(key, index, 1, time)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => removeInterval(key, index)}
                      >
                        <XIcon className="size-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addInterval(key)}
                    >
                      <PlusIcon className="size-4" />
                      Add hours
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Drops half-filled intervals before saving.
export function normalizeHours(hours: BranchHours): BranchHours {
  return Object.fromEntries(
    Object.entries(hours).map(([day, intervals]) => [
      day,
      (intervals ?? []).filter((interval) => interval[0] && interval[1]),
    ])
  )
}
