import { Badge } from "@/components/ui/badge"

const LABEL = { published: "Live", draft: "Draft", archived: "Archived" } as const

export function StatusBadge({ status }: { status: keyof typeof LABEL }) {
  return (
    <Badge variant={status === "published" ? "default" : status === "draft" ? "secondary" : "outline"}>
      {LABEL[status]}
    </Badge>
  )
}
