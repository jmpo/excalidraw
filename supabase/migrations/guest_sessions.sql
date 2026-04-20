-- Run this in Supabase SQL Editor
create table if not exists guest_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_id    text unique not null,
  created_at    timestamptz default now(),
  last_active   timestamptz default now(),
  element_count int default 0
);

-- Allow anyone to insert/update their own session (anon key is fine — no auth needed)
alter table guest_sessions enable row level security;

create policy "anon can upsert own session"
  on guest_sessions
  for all
  using (true)
  with check (true);
