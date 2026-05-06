# @beauty-diary/web

Next.js 15 (App Router) frontend for Beauty Diary.

## Quick start

From the **monorepo root**:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

Open <http://localhost:23000>.

## Stack

- **Next.js 15** App Router, React 19, RSC where possible.
- **Tailwind v4** with `@theme` tokens in `app/globals.css` (sourced from the Figma Make design system).
- **shadcn/ui** primitives (added in Phase F2 from `figma_make/`).
- **next-themes** for light/dark.
- **next/font/google** for Fraunces (display) + Inter (body) — no CDN.
- **TanStack Query + axios** for server state (Phase F4).
- **Zustand** for client UI state (Phase F4).
- **react-hook-form + zod** for forms — schemas come from `@beauty-diary/shared`.
- **Tiptap** for the rich-text post editor (Phase F6).
- **nuqs** for URL state on the feed.
- **lucide-react** icons.

## Layout

```
app/                    Next.js App Router
├── layout.tsx          Root layout (fonts, providers)
├── providers.tsx       Client-side providers (next-themes, TanStack Query)
├── globals.css         Tailwind v4 + design tokens (light + dark)
└── page.tsx            Foundation verification placeholder

components/             Shared UI components (shadcn primitives in components/ui/ from F2)
lib/                    Utilities (cn helper, api client)
public/                 Static assets
```

## Phase progress

See [`docs/STATUS.md`](../../docs/STATUS.md) and [`docs/FRONTEND_MIGRATION.md`](../../docs/FRONTEND_MIGRATION.md).

- F1 ✅ Foundation (this commit)
- F2 ⏳ shadcn primitives + Tiptap deps
- F3 ⏳ Composite components (NavigationBar, PostCard, …) ported from Figma
- F4 ⏳ API client + TanStack Query + auth pages
- F5 ⏳ Public surface (feed, post detail, profiles, search, landing)
- F6 ⏳ Editor + my-content
- F7 ⏳ Polish (error/loading boundaries, OG metadata, sitemap)
