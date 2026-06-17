import { PageScaffold } from "@/components/page-scaffold"

export default function ReviewsPage() {
  return (
    <PageScaffold
      title="Reviews"
      description="User reviews and the reports flagged against them."
      planned={[
        "Browse reviews across branches",
        "Resolve review reports from the moderation queue",
        "Hide or restore reviews and recompute branch ratings",
      ]}
    />
  )
}
