-- Drawings table
create table public.drawings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Sin título',
  content     jsonb not null default '{"elements":[],"appState":{}}',
  thumbnail   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Drawing files (images embedded in canvas)
create table public.drawing_files (
  id          text primary key,
  drawing_id  uuid not null references public.drawings(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  mime_type   text not null,
  data        text not null,
  created_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger drawings_updated_at
  before update on public.drawings
  for each row execute procedure public.handle_updated_at();

-- Row Level Security
alter table public.drawings enable row level security;
alter table public.drawing_files enable row level security;

-- RLS policies: users only see their own data
create policy "users can manage own drawings"
  on public.drawings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can manage own drawing files"
  on public.drawing_files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index drawings_user_id_idx on public.drawings(user_id);
create index drawings_updated_at_idx on public.drawings(updated_at desc);
create index drawing_files_drawing_id_idx on public.drawing_files(drawing_id);
