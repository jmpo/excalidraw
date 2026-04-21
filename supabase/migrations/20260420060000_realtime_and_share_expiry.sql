-- Full replica identity so Realtime sends old + new values on UPDATE
alter table public.profiles replica identity full;

-- Share link expiration
alter table public.drawings
  add column if not exists share_expires_at timestamptz;
