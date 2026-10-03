import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useLocation } from "react-router"

import { Button } from "@/components/ui/button"

const count = new Intl.NumberFormat()

/** "21–40 of 2,431" with previous / next as links to `?page=`. */
export function Pager({
  page,
  limit,
  total,
}: {
  page: number
  limit: number
  total: number
}) {
  const { pathname, search } = useLocation()
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const href = (target: number) => {
    const params = new URLSearchParams(search)
    if (target <= 1) params.delete("page")
    else params.set("page", String(target))
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const step = (
    target: number,
    label: string,
    icon: typeof ArrowLeft01Icon,
    enabled: boolean
  ) =>
    enabled ? (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={label}
        render={<Link to={href(target)} />}
        nativeButton={false}
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
      </Button>
    ) : (
      <Button variant="outline" size="icon-sm" aria-label={label} disabled>
        <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
      </Button>
    )

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground tabular-nums">
        {count.format(from)}–{count.format(to)} of {count.format(total)}
      </span>
      <div className="flex gap-1">
        {step(page - 1, "Previous page", ArrowLeft01Icon, page > 1)}
        {step(page + 1, "Next page", ArrowRight01Icon, page < pages)}
      </div>
    </div>
  )
}
