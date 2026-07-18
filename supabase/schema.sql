-- Learning Lines schema. Run this once in the Supabase SQL Editor
-- (Project -> SQL Editor -> New query) on a fresh project.

create table if not exists public.lines (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null,
  emoji text not null,
  color text not null,
  description text not null default '',
  root_node_ids jsonb not null default '[]',
  pinned boolean not null default false,
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nodes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  line_id text not null references public.lines(id) on delete cascade,
  parent_id text references public.nodes(id) on delete cascade,
  child_ids jsonb not null default '[]',
  title text not null default '',
  description text not null default '',
  notes text not null default '',
  status text not null default 'not_started',
  priority text,
  difficulty text,
  emoji text,
  color text,
  start_date date,
  deadline date,
  completed_date timestamptz,
  estimated_hours numeric,
  actual_hours numeric,
  tags jsonb not null default '[]',
  checklist jsonb not null default '[]',
  resources jsonb not null default '[]',
  depends_on jsonb not null default '[]',
  plan_bucket text,
  collapsed boolean not null default false,
  pinned boolean not null default false,
  archived boolean not null default false,
  position jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lines enable row level security;
alter table public.nodes enable row level security;

drop policy if exists "own lines" on public.lines;
create policy "own lines" on public.lines for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own nodes" on public.nodes;
create policy "own nodes" on public.nodes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists nodes_line_id_idx on public.nodes(line_id);
create index if not exists nodes_user_id_idx on public.nodes(user_id);
create index if not exists lines_user_id_idx on public.lines(user_id);
