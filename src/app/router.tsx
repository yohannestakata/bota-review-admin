import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/app/app-layout"
import { AuthGate } from "@/app/auth-gate"
import { InboxPage } from "@/features/inbox/inbox-page"
import { ErrorPage } from "@/pages/error-page"
import { NotFoundPage } from "@/pages/not-found-page"

// Inbox is the landing page and ships in the main bundle; every other page
// loads on first visit.
export const router = createBrowserRouter([
  {
    element: <AuthGate />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            errorElement: <ErrorPage />,
            children: [
              { index: true, element: <InboxPage /> },
              {
                path: "places",
                lazy: () => import("@/features/places/places-page").then((m) => ({ Component: m.PlacesPage })),
              },
              {
                path: "places/:id",
                lazy: () => import("@/features/places/place-page").then((m) => ({ Component: m.PlacePage })),
              },
              {
                path: "fix",
                lazy: () => import("@/features/fix/fix-page").then((m) => ({ Component: m.FixPage })),
              },
              {
                path: "collections",
                lazy: () =>
                  import("@/features/collections/collections-page").then((m) => ({ Component: m.CollectionsPage })),
              },
              {
                path: "collections/:id",
                lazy: () =>
                  import("@/features/collections/collection-page").then((m) => ({ Component: m.CollectionPage })),
              },
              {
                path: "people",
                lazy: () => import("@/features/people/people-page").then((m) => ({ Component: m.PeoplePage })),
              },
              {
                path: "settings",
                lazy: () => import("@/features/settings/settings-page").then((m) => ({ Component: m.SettingsPage })),
              },
              { path: "*", element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])
