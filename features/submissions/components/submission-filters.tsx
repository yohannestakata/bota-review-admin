"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_TABS, TYPE_OPTIONS } from "../format"
import type { SubmissionStatus, SubmissionType } from "../types"

export function SubmissionFilters({
  status,
  type,
}: {
  status: SubmissionStatus
  type?: SubmissionType
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={type ?? "all"}
        onValueChange={(value) =>
          setParam("type", value === "all" ? null : String(value))
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={status === tab.value ? "outline" : "ghost"}
            className={status === tab.value ? "bg-background shadow-sm" : ""}
            onClick={() => setParam("status", tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
