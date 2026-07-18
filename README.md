# Liner

A visual learning and progress roadmap builder. Break a subject down into
chapters and topics on an interactive canvas, track recurring daily practice
in an activity tracker, and follow overall progress from a single dashboard.

**Live demo:** [liner-xi.vercel.app](https://liner-xi.vercel.app/)

Accounts are backed by [Supabase](https://supabase.com) (Postgres + email
auth) — sign up with an email and password and your data syncs across
devices. A JSON export/import feature is still built in for manual backups.

## Features

- **Roadmap canvas** — build nested chapter → topic trees on an infinite,
  zoomable/pannable canvas (powered by React Flow), with drag-to-reposition,
  collapsible branches, and auto-arrange.
- **Bulk creation** — paste a whole outline (markdown headings, bullets, or
  indentation) and the entire tree is created in one shot, instead of adding
  nodes one at a time.
- **Rich topic detail** — status, priority, difficulty, dates, checklists,
  tags, notes, and resource links per topic, with a calendar date picker and
  a "spread deadlines evenly across sub-topics" scheduler.
- **Activity tracker** — a second line type for recurring practice (e.g. a
  daily problem-solving habit), with per-day checklists and streak tracking.
- **Dashboard** — today's plan, upcoming deadlines, overdue items, a weekly
  activity chart, and a GitHub-style completion heatmap.
- **Accounts** — email/password auth via Supabase; each account's data is
  isolated with row-level security.
- **Backup & restore** — export all data as a JSON file and re-import it.
- **Light/dark themes**, with an interactive glass UI.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives)
- [Supabase](https://supabase.com) for the database and email/password auth
- [Zustand](https://zustand-demo.pmnd.rs) for client-side state, synced to Supabase
- [@xyflow/react](https://reactflow.dev) for the roadmap canvas
- [Framer Motion](https://www.framer.com/motion) for animation
- [Recharts](https://recharts.org) for the dashboard charts
- [date-fns](https://date-fns.org) for date handling

## Getting started

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
