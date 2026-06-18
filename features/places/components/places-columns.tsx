"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { formatDate, STATUS_VARIANT } from "@/features/branches/format"
import type { AdminPlace } from "../types"

export const placeColumns: ColumnDef<AdminPlace>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/places/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize text-muted-foreground">
        {row.original.type}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "branches",
    header: "Branches",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.branchCount}
      </span>
    ),
  },
  {
    id: "updated",
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.updatedAt)}
      </span>
    ),
  },
]
