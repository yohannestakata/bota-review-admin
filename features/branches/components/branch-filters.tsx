"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { STATUS_TABS } from "../format"
import type { BranchStatus } from "../types"

export function BranchFilters({ status }: { status?: BranchStatus }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setStatus(value: BranchStatus | "all") {
    const next = new URLSearchParams(searchParams.toString())
    if (value === "all") next.delete("status")
    else next.set("status", value)
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const current = status ?? "all"

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {STATUS_TABS.map((tab) => (
        <Button
          key={tab.value}
          size="sm"
          variant={current === tab.value ? "outline" : "ghost"}
          className={current === tab.value ? "bg-background shadow-sm" : ""}
          onClick={() => setStatus(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
