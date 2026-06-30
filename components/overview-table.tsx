"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { CircleCheckIcon, LoaderIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type OverviewRow = {
  id: number
  header: string
  type: string
  status: string
  target: string
  limit: string
  reviewer: string
}

const columns: ColumnDef<OverviewRow>[] = [
  {
    id: "header",
    header: "Header",
    enableHiding: false,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.header}</span>
    ),
  },
  {
    id: "section type",
    header: "Section Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.type}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.status === "Done" ? (
          <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
        ) : (
          <LoaderIcon />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "target",
    header: () => <div className="text-right">Target</div>,
    cell: ({ row }) => <div className="text-right">{row.original.target}</div>,
  },
  {
    id: "limit",
    header: () => <div className="text-right">Limit</div>,
    cell: ({ row }) => <div className="text-right">{row.original.limit}</div>,
  },
  {
    id: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => row.original.reviewer,
  },
]

export function OverviewTable({ data }: { data: OverviewRow[] }) {
  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-4"
    >
      <div className="px-4 lg:px-6">
        <TabsList>
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="outline" className="px-4 lg:px-6">
        <DataTable
          columns={columns}
          data={data}
          getRowId={(row) => String(row.id)}
        />
      </TabsContent>
      <TabsContent value="past-performance" className="px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
      </TabsContent>
      <TabsContent value="key-personnel" className="px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
      </TabsContent>
      <TabsContent value="focus-documents" className="px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
      </TabsContent>
    </Tabs>
  )
}
