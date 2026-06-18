"use client"

import { ClockIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const PERIODS = ["AM", "PM"] as const

type Period = (typeof PERIODS)[number]
type Parts = { hour12: number; minute: number; period: Period }

const pad = (n: number) => String(n).padStart(2, "0")

// "HH:MM" (24h) -> 12h parts. Null for empty/invalid.
function parse(value: string): Parts | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null
  const [h, m] = value.split(":").map(Number)
  if (h > 23 || m > 59) return null
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return { hour12, minute: m, period: h < 12 ? "AM" : "PM" }
}

function compose({ hour12, minute, period }: Parts): string {
  let h = hour12 % 12
  if (period === "PM") h += 12
  return `${pad(h)}:${pad(minute)}`
}

function label(value: string): string | null {
  const parts = parse(value)
  if (!parts) return null
  return `${parts.hour12}:${pad(parts.minute)} ${parts.period}`
}

const DEFAULT: Parts = { hour12: 9, minute: 0, period: "AM" }

function Column({
  values,
  selected,
  format = (v: number) => String(v),
  onSelect,
}: {
  values: readonly (number | string)[]
  selected: number | string | null
  format?: (v: number) => string
  onSelect: (value: number | string) => void
}) {
  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto p-1">
      {values.map((value) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant={value === selected ? "default" : "ghost"}
          className="justify-center"
          onClick={() => onSelect(value)}
        >
          {typeof value === "number" ? format(value) : value}
        </Button>
      ))}
    </div>
  )
}

export function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const parts = parse(value)
  const base = parts ?? DEFAULT
  const text = label(value)

  function set(patch: Partial<Parts>) {
    onChange(compose({ ...base, ...patch }))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            data-empty={!text}
            className={cn(
              "w-32 justify-start gap-2 font-normal data-[empty=true]:text-muted-foreground",
              className
            )}
          />
        }
      >
        <ClockIcon className="size-4" />
        {text ?? "Set time"}
      </PopoverTrigger>
      <PopoverContent className="flex w-auto gap-1 p-1" align="start">
        <Column
          values={HOURS}
          selected={parts?.hour12 ?? null}
          onSelect={(hour12) => set({ hour12: hour12 as number })}
        />
        <Column
          values={MINUTES}
          selected={parts?.minute ?? null}
          format={pad}
          onSelect={(minute) => set({ minute: minute as number })}
        />
        <Column
          values={PERIODS}
          selected={parts?.period ?? null}
          onSelect={(period) => set({ period: period as Period })}
        />
      </PopoverContent>
    </Popover>
  )
}
