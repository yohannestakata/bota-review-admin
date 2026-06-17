"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  formatDate,
  priceLabel,
  STATUS_VARIANT,
  VERIFICATION_LABEL,
  VERIFICATION_VARIANT,
} from "../format"
import type { AdminBranch } from "../types"
import { BranchActions } from "./branch-actions"

export const branchColumns: ColumnDef<AdminBranch>[] = [
  {
    id: "name",
    accessorFn: (row) => row.place.name ?? row.label ?? "",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/branches/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.place.name ?? row.original.label ?? "Untitled"}
      </Link>
    ),
  },
  {
    id: "neighborhood",
    header: "Neighborhood",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.neighborhood?.name ?? "—"}</span>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize text-muted-foreground">
        {row.original.place.type}
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
    id: "verification",
    header: "Verification",
    cell: ({ row }) => (
      <Badge variant={VERIFICATION_VARIANT[row.original.verificationStatus]}>
        {VERIFICATION_LABEL[row.original.verificationStatus]}
      </Badge>
    ),
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {priceLabel(row.original.priceLevel)}
      </span>
    ),
  },
  {
    id: "rating",
    header: "Rating",
    cell: ({ row }) =>
      row.original.reviewCount > 0 ? (
        <span className="text-sm">
          {Number(row.original.rating).toFixed(1)}{" "}
          <span className="text-muted-foreground">
            ({row.original.reviewCount})
          </span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">New</span>
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
  {
    id: "actions",
    enableHiding: false,
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <BranchActions branch={row.original} />
      </div>
    ),
  },
]
