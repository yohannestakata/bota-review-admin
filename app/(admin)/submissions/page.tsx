import { Suspense } from "react"

import { SubmissionsView } from "@/features/submissions"

export default function SubmissionsPage() {
  return (
    <Suspense>
      <SubmissionsView />
    </Suspense>
  )
}
