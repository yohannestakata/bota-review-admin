import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"

import { DAYS } from "./labels"
import type { DayKey, Hours } from "./types"

/**
 * Opening hours as ranges per day. A day with no ranges is closed. A range
 * that ends earlier than it starts runs past midnight.
 */
export function HoursEditor({
  value,
  onChange,
}: {
  value: Hours
  onChange: (value: Hours) => void
}) {
  const setDay = (day: DayKey, ranges: [string, string][]) =>
    onChange({ ...value, [day]: ranges })

  // Overwrites the whole week, so offer a way back.
  const copyToAll = (day: DayKey) => {
    const before = value
    onChange(
      Object.fromEntries(
        DAYS.map((d) => [d.key, (value[day] ?? []).map((r) => [...r])])
      ) as Hours
    )
    toast.add({
      title: "Copied to every day",
      actionProps: { children: "Undo", onClick: () => onChange(before) },
    })
  }

  // The same hours all week collapse to one "Every day" row.
  const sameAllWeek = DAYS.every(
    (d) =>
      JSON.stringify(value[d.key] ?? []) === JSON.stringify(value.mon ?? [])
  )
  const [perDay, setPerDay] = useState(!sameAllWeek)
  const setEveryDay = (ranges: [string, string][]) =>
    onChange(
      Object.fromEntries(
        DAYS.map((d) => [d.key, ranges.map((r) => [...r])])
      ) as Hours
    )

  if (!perDay) {
    return (
      <FieldGroup>
        <DayRow
          label="Every day"
          ranges={value.mon ?? []}
          onChange={setEveryDay}
          extra={
            <Button variant="ghost" size="sm" onClick={() => setPerDay(true)}>
              Set per day
            </Button>
          }
        />
      </FieldGroup>
    )
  }

  return (
    <FieldGroup>
      {DAYS.map(({ key, label }) => (
        <DayRow
          key={key}
          label={label}
          ranges={value[key] ?? []}
          onChange={(ranges) => setDay(key, ranges)}
          extra={
            key === "mon" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToAll("mon")}
              >
                Copy to all days
              </Button>
            ) : null
          }
        />
      ))}
    </FieldGroup>
  )
}

function DayRow({
  label,
  ranges,
  onChange,
  extra,
}: {
  label: string
  ranges: [string, string][]
  onChange: (ranges: [string, string][]) => void
  extra?: React.ReactNode
}) {
  return (
    <Field orientation="horizontal" className="flex-wrap">
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
        {ranges.length === 0 ? (
          <FieldDescription>Closed</FieldDescription>
        ) : null}
      </FieldContent>
      <div className="flex flex-wrap gap-2">
        {ranges.map(([open, close], i) => (
          <ButtonGroup key={i}>
            <Input
              type="time"
              aria-label={`${label} opens`}
              value={open}
              onChange={(e) =>
                onChange(
                  ranges.map((r, j) => (j === i ? [e.target.value, r[1]] : r))
                )
              }
            />
            <ButtonGroupText>to</ButtonGroupText>
            <Input
              type="time"
              aria-label={`${label} closes`}
              value={close}
              onChange={(e) =>
                onChange(
                  ranges.map((r, j) => (j === i ? [r[0], e.target.value] : r))
                )
              }
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Remove hours"
              onClick={() => onChange(ranges.filter((_, j) => j !== i))}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={Cancel01Icon}
                strokeWidth={2}
              />
            </Button>
          </ButtonGroup>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange([
            ...ranges,
            ranges.length ? ["18:00", "22:00"] : ["08:00", "22:00"],
          ])
        }
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={Add01Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Hours
      </Button>
      {extra}
    </Field>
  )
}

/** Times must be filled in, so the server's HH:MM check passes. */
export function hoursComplete(hours: Hours) {
  return Object.values(hours).every((ranges) =>
    ranges.every(([a, b]) => Boolean(a && b))
  )
}
