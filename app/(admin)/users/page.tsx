import { PageScaffold } from "@/components/page-scaffold"

export default function UsersPage() {
  return (
    <PageScaffold
      title="Users"
      description="Accounts, trust levels, and editor/admin roles."
      planned={[
        "Browse users and their trust levels",
        "Grant or revoke editor / admin roles",
        "View a user's reviews, photos, and submissions",
      ]}
    />
  )
}
