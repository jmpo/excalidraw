-- Email log: every Resend send is recorded here so the admin can see the
-- history (recipient, subject, status) without depending on Resend's API.

create table if not exists public.email_log (
  id         uuid primary key default gen_random_uuid(),
  recipient  text not null,
  subject    text,
  resend_id  text,
  status     text not null default 'sent',  -- sent | failed | delivered | opened | bounced
  error      text,
  created_at timestamptz not null default now()
);

create index if not exists email_log_created_idx   on public.email_log (created_at desc);
create index if not exists email_log_recipient_idx on public.email_log (recipient);

alter table public.email_log enable row level security;

-- Admin read policies (same pattern as profiles/drawings).
do $$ begin
  if not exists (select 1 from pg_policies where tablename='email_log' and policyname='admin_read_email_log') then
    create policy "admin_read_email_log" on public.email_log
      for select using (auth.jwt() ->> 'email' = 'pompa.07@gmail.com');
  end if;
  if not exists (select 1 from pg_policies where tablename='abandoned_carts' and policyname='admin_read_abandoned_carts') then
    create policy "admin_read_abandoned_carts" on public.abandoned_carts
      for select using (auth.jwt() ->> 'email' = 'pompa.07@gmail.com');
  end if;
end $$;
