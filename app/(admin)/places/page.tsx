import { PageScaffold } from "@/components/page-scaffold"

export default function PlacesPage() {
  return (
    <PageScaffold
      title="Places"
      description="The brand/identity layer that branches belong to."
      planned={[
        "Manage places and their translations (name, description, type)",
        "See the branches that belong to each place",
        "Create, edit, and archive places",
      ]}
    />
  )
}
