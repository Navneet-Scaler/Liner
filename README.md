<p align="center">
  <img src="src/app/icon.svg" width="64" height="64" alt="Liner logo" />
</p>

<h1 align="center">Liner</h1>

<p align="center">A visual habit and task tracker — plan subjects on a roadmap canvas, track daily habits, see it all on one dashboard.</p>

<p align="center"><a href="https://liner-xi.vercel.app/">liner-xi.vercel.app</a></p>

A hobby project — I wanted a visual way to plan what I'm learning and track
daily habits, instead of scattering it across notes apps and spreadsheets.

## Features

- **Roadmap canvas** — chapter → topic trees on an infinite, zoomable canvas
  (React Flow): drag-to-reposition, collapsible branches, auto-arrange.
- **Bulk creation** — paste an outline (headings, bullets, or indentation)
  and the whole tree is created at once.
- **Topic detail** — status, priority, dates, checklists, tags, notes,
  resource links, and a deadline scheduler for sub-topics.
- **Activity tracker** — a second line type for recurring habits, with
  per-day checklists and streaks.
- **Dashboard** — today's plan, deadlines, a weekly chart, and a
  GitHub-style completion heatmap.
- **Accounts** — email/password auth via Supabase, data isolated per user
  with row-level security, synced across devices.
- **Backup & restore** — export/import everything as JSON.
- Light/dark themes, glass UI.

## Roadmap

Single-player for now. Next up: sharing progress with friends, groups for
tracking a habit together, integrations (LeetCode and similar), and peer
profiles. None of that exists yet.

## Project structure

```
src/
  app/                 Next.js routes (dashboard, /login)
  components/
    auth/              Login form + auth session provider
    canvas/            Roadmap canvas, node cards, outline import
    activity/          Activity tracker (daily habit) view
    dashboard/         Dashboard view
    node-panel/        Topic detail side panel
    sidebar/           Line list, mobile drawer, new-line dialog
    shared/            Reusable bits (logo, tooltips, date picker, icons)
    ui/                shadcn/ui primitives
  lib/                 Types, progress math, outline parsing, color/icon
                        maps, Supabase client + data sync
  store/               Zustand stores (app data, auth, UI state)
  proxy.ts             Route protection (redirects signed-out users)
supabase/
  schema.sql           DB schema + row-level security policies
```

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui ·
Supabase (DB + auth) · Zustand · [@xyflow/react](https://reactflow.dev) ·
Framer Motion · Recharts · date-fns

## Running it yourself

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run `supabase/schema.sql` from this repo once.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API in the Supabase dashboard).
4. `npm install && npm run dev`

Open [http://localhost:3000](http://localhost:3000) and sign up.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint the codebase
```

## Deployment

Deployed on [Vercel](https://vercel.com). Add the same two env vars from
`.env.example` to the Vercel project settings and redeploy.

## License

All rights reserved.
