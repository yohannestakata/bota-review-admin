import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { OverviewTable, type OverviewRow } from "@/components/overview-table"
import { SectionCards } from "@/components/section-cards"

import data from "./data.json"

export default function OverviewPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <OverviewTable data={data as OverviewRow[]} />
      </div>
    </div>
  )
}
