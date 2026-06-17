"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import {
  formatDate,
  PRIORITY_VARIANT,
  SUBMISSION_TYPE_LABEL,
  SUBMISSION_TYPE_VARIANT,
} from "../format"
import type { PlaceMissingDetails, SubmissionListItem } from "../types"

function TargetCell({ submission }: { submission: SubmissionListItem }) {
  if (submission.type === "place_missing") {
    const details = submission.details as PlaceMissingDetails | null
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {details?.placeName ?? "New place"}
        </span>
        {submission.branch?.status === "draft" ? (
          <Badge variant="outline">draft</Badge>
        ) : null}
      </div>
    )
  }
  return <span className="text-sm">{submission.branch?.label ?? "—"}</span>
}

export const submissionColumns: ColumnDef<SubmissionListItem>[] = [
  {
    id: "target",
    header: "Target",
    cell: ({ row }) => <TargetCell submission={row.original} />,
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={SUBMISSION_TYPE_VARIANT[row.original.type]}>
        {SUBMISSION_TYPE_LABEL[row.original.type]}
      </Badge>
    ),
  },
  {
    id: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <Badge variant={PRIORITY_VARIANT[row.original.priority]}>
        {row.original.priority}
      </Badge>
    ),
  },
  {
    id: "reporter",
    accessorFn: (row) => row.user.displayName ?? "Unknown",
    header: "Reporter",
    cell: ({ row }) => (
      <div>
        <div className="text-sm">
          {row.original.user.displayName ?? "Unknown"}
        </div>
        <div className="text-xs capitalize text-muted-foreground">
          {row.original.user.trustLevel}
        </div>
      </div>
    ),
  },
  {
    id: "submitted",
    header: "Submitted",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
]
