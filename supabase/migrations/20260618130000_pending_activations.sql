-- Frictionless access for direct Hotmart purchases (buyer pays before having an account).
-- The webhook stores the purchase here when no profile exists yet; when the person
-- signs up with that email, handle_new_user grants Pro directly instead of trial.

create table if not exists public.pending_activations (
  email               text primary key,
  plan                text not null default 'pro',
  plan_period         text,
  pro_ends_at         timestamptz,
  plan_price          numeric,
  plan_currency       text,
  hotmart_subscriber  text,
  hotmart_transaction text,
  created_at          timestamptz not null default now()
);

-- Lock down: contains purchase data. RLS on with no policies = only service role
-- (webhook) and SECURITY DEFINER functions can touch it.
alter table public.pending_activations enable row level security;

-- On signup: if there's a (non-expired) pending purchase for this email, create the
-- profile straight in Pro and consume the pending row. Otherwise, 7-day trial as before.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_act public.pending_activations%rowtype;
begin
  select * into v_act
  from public.pending_activations
  where email = NEW.email;

  if found and (v_act.pro_ends_at is null or v_act.pro_ends_at > now()) then
    insert into public.profiles (
      id, email, plan, trial_ends_at,
      pro_ends_at, plan_period, plan_price, plan_currency,
      hotmart_subscriber, hotmart_transaction
    )
    values (
      NEW.id, NEW.email, 'pro', null,
      v_act.pro_ends_at, v_act.plan_period, v_act.plan_price, v_act.plan_currency,
      v_act.hotmart_subscriber, v_act.hotmart_transaction
    )
    on conflict (id) do nothing;
    delete from public.pending_activations where email = NEW.email;
  else
    insert into public.profiles (id, email, plan, trial_ends_at)
    values (NEW.id, NEW.email, 'trial', now() + interval '7 days')
    on conflict (id) do nothing;
    -- drop stale/expired pending rows for this email, if any
    if found then
      delete from public.pending_activations where email = NEW.email;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;
