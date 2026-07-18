# Learning Lines

A visual learning and progress roadmap builder. Break a subject down into
chapters and topics on an interactive canvas, track recurring daily practice
in an activity tracker, and follow overall progress from a single dashboard.

**Live demo:** [liner-xi.vercel.app](https://liner-xi.vercel.app/)

Everything runs client-side — there is no backend or account system. Your
data is stored in the browser via `localStorage`, with built-in JSON
export/import for backups.

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
- **Backup & restore** — export all data as a JSON file and re-import it,
  since there's no server-side persistence.
- **Light/dark themes**, with an interactive glass UI.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives)
- [Zustand](https://zustand-demo.pmnd.rs) for state management, persisted to `localStorage`
- [@xyflow/react](https://reactflow.dev) for the roadmap canvas
- [Framer Motion](https://www.framer.com/motion) for animation
- [Recharts](https://recharts.org) for the dashboard charts
- [date-fns](https://date-fns.org) for date handling

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint the codebase
```

## Deployment

Deployed on [Vercel](https://vercel.com) at [liner-xi.vercel.app](https://liner-xi.vercel.app/).
It's a standard Next.js app with no server-side dependencies, so it deploys
as-is — no environment variables or database setup required.

## License

All rights reserved.
