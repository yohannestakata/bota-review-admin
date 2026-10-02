import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/app/app-layout"
import { AuthGate } from "@/app/auth-gate"
import { InboxPage } from "@/features/inbox/inbox-page"
import { ComingSoonPage } from "@/pages/coming-soon-page"
import { NotFoundPage } from "@/pages/not-found-page"

export const router = createBrowserRouter([
  {
    element: <AuthGate />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <InboxPage /> },
          { path: "places", element: <ComingSoonPage title="Places" /> },
          { path: "fix", element: <ComingSoonPage title="Fix list" /> },
          { path: "collections", element: <ComingSoonPage title="Collections" /> },
          { path: "people", element: <ComingSoonPage title="People" /> },
          { path: "settings", element: <ComingSoonPage title="Settings" /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
