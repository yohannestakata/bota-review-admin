# Bota Admin

The admin for Bota Review: moderation inbox, places, data fixes, collections,
people and settings. Vite, React, shadcn (Base UI), TanStack Query, Clerk.

Only accounts with the `admin` role can sign in.

## Run locally

```bash
cp .env.example .env.local   # then fill in the two values
pnpm install
pnpm dev                     # http://localhost:5173
```

The API must allow `http://localhost:5173` in `ALLOWED_ORIGINS` and
`CLERK_AUTHORIZED_PARTIES` (the backend's `.env.example` already does).

## Checks

```bash
pnpm lint
pnpm build
```

## Deploy

`render.yaml` describes a Render static site. Create it from the Blueprint,
then set:

- `VITE_API_URL`: the API's public URL including `/v1`.
- `VITE_CLERK_PUBLISHABLE_KEY`: the production Clerk publishable key.

Then add the admin's URL to the API service's `ALLOWED_ORIGINS` and
`CLERK_AUTHORIZED_PARTIES`, and to the Clerk instance's allowed origins.

Vite bakes env values into the build, so redeploy after changing them.

## Layout

- `src/app`: shell, routing, sign-in gate, ⌘K menu.
- `src/features/<area>`: one folder per section, each with its own
  `queries.ts` (API calls) and pages.
- `src/components/ui`: shadcn components, added with
  `pnpm dlx shadcn@latest add <name>`.
