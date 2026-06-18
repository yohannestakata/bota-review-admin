"use client"

import { parseDate } from "chrono-node"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) return ""
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function NaturalDatePicker({
  value,
  onChange,
  id,
  placeholder = "Today or 2 weeks ago",
}: {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  id?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => formatDate(value))

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          if (!next.trim()) {
            onChange(undefined)
            return
          }
          const parsed = parseDate(next)
          if (parsed) onChange(parsed)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
              >
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            }
          />
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            sideOffset={8}
          >
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              defaultMonth={value}
              onSelect={(date) => {
                onChange(date)
                setText(formatDate(date))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}
