import { PageScaffold } from "@/components/page-scaffold"

export default function ClaimsPage() {
  return (
    <PageScaffold
      title="Business claims"
      description="Ownership claims that unlock authoritative editing for a branch."
      planned={[
        "Review pending business ownership claims",
        "Approve a claim to grant the owner authoritative editing",
        "Reject a claim or request more information",
      ]}
    />
  )
}
