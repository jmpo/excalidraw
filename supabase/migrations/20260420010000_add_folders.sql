-- Tabla de carpetas
create table public.folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.folders enable row level security;

create policy "Users manage own folders"
  on public.folders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Agregar folder_id a drawings
alter table public.drawings
  add column folder_id uuid references public.folders(id) on delete set null;
