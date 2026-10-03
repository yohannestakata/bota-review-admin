import { isRouteErrorResponse, Link, useRouteError } from "react-router"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

/** Shown when a page crashes, so one bad screen doesn't blank the app. */
export function ErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Something went wrong."
  // A stale tab after a deploy can't load the new page code: reload fixes it.
  const staleChunk =
    error instanceof Error &&
    /Failed to fetch dynamically imported module|Importing a module script failed/.test(
      error.message
    )

  return (
    <Empty className="min-h-[60svh]">
      <EmptyHeader>
        <EmptyTitle>
          {staleChunk ? "Admin was updated" : "This page hit a problem"}
        </EmptyTitle>
        <EmptyDescription>
          {staleChunk ? "Reload to get the latest version." : message}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button variant="outline" render={<Link to="/" />} nativeButton={false}>
          Back to Inbox
        </Button>
      </EmptyContent>
    </Empty>
  )
}
