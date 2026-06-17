import { PageScaffold } from "@/components/page-scaffold"

export default function BranchesPage() {
  return (
    <PageScaffold
      title="Branches"
      description="Every location across all places, in draft, published, or archived state."
      planned={[
        "Browse and search branches, filter by status",
        "Create, edit, publish, and archive branches",
        "Manage cuisines, tags, amenities, hours, and photos",
        "Edit menus and menu items",
        "Set verification status and review the field-change audit trail",
      ]}
    />
  )
}
