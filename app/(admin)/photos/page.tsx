import { PageScaffold } from "@/components/page-scaffold"

export default function PhotosPage() {
  return (
    <PageScaffold
      title="Photos"
      description="The photo moderation queue for user-submitted images."
      planned={[
        "Work the queue (pending / approved / rejected)",
        "Approve or reject user-submitted photos",
        "Set or change a branch's cover photo",
      ]}
    />
  )
}
