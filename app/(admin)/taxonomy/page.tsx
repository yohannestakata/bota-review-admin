import { PageScaffold } from "@/components/page-scaffold"

export default function TaxonomyPage() {
  return (
    <PageScaffold
      title="Taxonomy"
      description="Cuisines, tags, and amenities that classify branches."
      planned={[
        "Manage cuisines, tags, and amenities (tabbed)",
        "Create, rename, and archive taxonomy entries",
        "Merge duplicates",
      ]}
    />
  )
}
