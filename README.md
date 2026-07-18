# Liner

A personal habit and task tracker, built as a hobby project. I wanted a
visual way to plan out what I'm learning — break a subject into chapters and
topics on a canvas, track daily habits like LeetCode or reading, and see all
of it on one dashboard — instead of scattering it across notes apps and
spreadsheets.

**Live demo:** [liner-xi.vercel.app](https://liner-xi.vercel.app/)

## What it does today

- **Roadmap canvas** — lay out a subject as a chapter → topic tree on an
  infinite, zoomable canvas (React Flow), with drag-to-reposition,
  collapsible branches, and auto-arrange.
- **Bulk creation** — paste a whole outline (markdown headings, bullets, or
  indentation) and the entire tree is created in one shot.
- **Rich topic detail** — status, priority, difficulty, dates, checklists,
  tags, notes, and resource links per topic, plus a "spread deadlines evenly
  across sub-topics" scheduler.
- **Activity tracker** — a second line type for recurring habits (daily
  problems, reading, workouts), with per-day checklists and streaks.
- **Dashboard** — today's plan, upcoming deadlines, overdue items, a weekly
  chart, and a GitHub-style completion heatmap.
- **Accounts** — email/password auth via Supabase, data isolated per account
  with row-level security, synced across devices.
- **Backup & restore** — export everything as JSON and re-import it.
- Light/dark themes with a glass UI.

## Where this is headed

Right now it's single-player — just you and your own lines. The next things
I want to add:

- Sharing progress with friends and seeing theirs
- Groups, so a few people can track the same habit together
- Integrations with things like LeetCode to pull progress in automatically
- Public-ish peer profiles

None of that exists yet — today it's a solo habit/task tracker.

## Project structure

```
src/
  app/                 Next.js routes (dashboard, /login)
  components/
    auth/              Login form + auth session provider
    canvas/             Roadmap canvas, node cards, outline import
    activity/           Activity tracker (daily habit) view
    dashboard/           Dashboard view
    node-panel/          Topic detail side panel
    sidebar/             Line list, mobile drawer, new-line dialog
    shared/              Small reusable bits (tooltips, date picker, icons)
    ui/                  shadcn/ui primitives
  lib/                 Pure logic: types, progress math, outline parsing,
                        color/icon maps, Supabase client + data sync
  store/               Zustand stores (app data, auth, UI state)
  proxy.ts             Route protection (redirects signed-out users to /login)
supabase/
  schema.sql           DB schema + row-level security policies
```

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives)
- [Supabase](https://supabase.com) for the database and email/password auth
- [Zustand](https://zustand-demo.pmnd.rs) for client-side state, synced to Supabase
- [@xyflow/react](https://reactflow.dev) for the roadmap canvas
- [Framer Motion](https://www.framer.com/motion) for animation
- [Recharts](https://recharts.org) for the dashboard charts
- [date-fns](https://date-fns.org) for date handling

## Running it yourself

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run `supabase/schema.sql` from this repo once
   — it creates the `lines`/`nodes` tables and row-level security policies.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API in the Supabase dashboard).
4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the
login page; sign up with an email and password to get started.

### Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint the codebase
```

## Deployment

Deployed on [Vercel](https://vercel.com) at [liner-xi.vercel.app](https://liner-xi.vercel.app/).
Add the same two env vars from `.env.example` to the Vercel project settings
(Project → Settings → Environment Variables) and redeploy.

## License

All rights reserved.
