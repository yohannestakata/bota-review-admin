import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate } from "react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { useQualityIssues, useQualityRows } from "@/features/fix/queries"

/**
 * Places › Name, or Fix list › Check › Name when the place was opened from
 * the Fix list, with a button to the next place that has the same problem.
 */
export function PlaceBreadcrumb({
  name,
  fix,
  branchId,
}: {
  name: string
  fix: string | null
  branchId: string | undefined
}) {
  return (
    <div className="flex items-center gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          {fix ? (
            <FixCrumbs fix={fix} />
          ) : (
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/places" />}>
                Places
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {fix ? <NextInFixList fix={fix} branchId={branchId} /> : null}
    </div>
  )
}

function FixCrumbs({ fix }: { fix: string }) {
  const issues = useQualityIssues()
  const title = issues.data?.find((i) => i.key === fix)?.title ?? "Check"
  return (
    <>
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to="/fix" />}>Fix list</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to={`/fix?issue=${fix}`} />}>
          {title}
        </BreadcrumbLink>
      </BreadcrumbItem>
    </>
  )
}

function NextInFixList({
  fix,
  branchId,
}: {
  fix: string
  branchId: string | undefined
}) {
  const navigate = useNavigate()
  // Fixed places drop off the check, so the first other row is the next one.
  const rows = useQualityRows(fix, "", 1)
  const next = rows.data?.rows.find((row) => row.branchId !== branchId)
  if (!rows.data) return null
  return next ? (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto"
      onClick={() =>
        void navigate(
          `/places/${next.placeId}?branch=${next.branchId}&fix=${fix}`
        )
      }
    >
      Next: {next.placeName}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        data-icon="inline-end"
        aria-hidden="true"
      />
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto"
      render={<Link to="/fix" />}
      nativeButton={false}
    >
      All done here. Back to the Fix list
    </Button>
  )
}
