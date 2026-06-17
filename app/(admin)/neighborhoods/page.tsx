import { PageScaffold } from "@/components/page-scaffold"

export default function NeighborhoodsPage() {
  return (
    <PageScaffold
      title="Neighborhoods"
      description="Addis Ababa areas used for location, distance, and filtering."
      planned={[
        "Manage neighborhoods and their centroids",
        "Create, rename, and merge neighborhoods",
        "Resolve free-text neighborhoods from submissions to canonical entries",
      ]}
    />
  )
}
