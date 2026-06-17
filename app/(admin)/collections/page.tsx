import { PageScaffold } from "@/components/page-scaffold"

export default function CollectionsPage() {
  return (
    <PageScaffold
      title="Collections"
      description="Curated rails of branches surfaced on the app home screen."
      planned={[
        "Create and edit curated collections",
        "Add or remove branches and reorder them (drag and drop)",
        "Publish or unpublish collections and set cover images",
      ]}
    />
  )
}
