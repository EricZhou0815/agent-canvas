-- AgentCanvas: actions table — structured events queue from user interactions
-- Run this in Supabase Dashboard → SQL Editor
-- The table stores every user interaction (checkbox, button, form, free text)
-- as a structured event. Local agents (no public IP) poll pending events;
-- cloud agents receive them via webhook. Both read from this queue.

create table if not exists public.actions (
  id          bigint generated always as identity primary key,
  user_id     text not null,
  canvas_id   text not null default 'unknown',
  action      text not null,
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'pending' check (status in ('pending', 'done')),
  created_at  timestamptz not null default now(),
  acked_at    timestamptz
);

-- Local agents poll pending events per user (fast path)
create index if not exists actions_user_pending_idx
  on public.actions (user_id, status, created_at);

-- Supabase Realtime: allow local agents to subscribe to INSERTs (optional tier)
alter publication supabase_realtime add table public.actions;

-- RLS: service role key bypasses RLS, so API routes can read/write freely.
-- The public cannot read actions (no anon policy = denied by default).
alter table public.actions enable row level security;
