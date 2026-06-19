-- Fase 0: capture the data the admin panel will need (phone, payment date,
-- abandoned carts). Additive and safe.

-- Payment date on profiles ("member since / last payment")
alter table public.profiles
  add column if not exists last_payment_at timestamptz;

-- Carry phone + payment date through pending activations (direct purchase)
alter table public.pending_activations
  add column if not exists phone           text,
  add column if not exists last_payment_at  timestamptz;

-- Abandoned checkouts pushed by Hotmart (PURCHASE_OUT_OF_SHOPPING_CART)
create table if not exists public.abandoned_carts (
  id            uuid primary key default gen_random_uuid(),
  email         text,
  name          text,
  phone         text,
  plan_name     text,
  hotmart_event text,
  recovered     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists abandoned_carts_email_idx on public.abandoned_carts (email);
create index if not exists abandoned_carts_created_idx on public.abandoned_carts (created_at desc);

-- Lock down (admin/service-role only)
alter table public.abandoned_carts enable row level security;

-- handle_new_user: also copy phone + last_payment_at when granting Pro from a
-- pending activation (direct purchase). Keeps case-insensitive matching.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_act public.pending_activations%rowtype;
begin
  select * into v_act
  from public.pending_activations
  where lower(email) = lower(NEW.email);

  if found and (v_act.pro_ends_at is null or v_act.pro_ends_at > now()) then
    insert into public.profiles (
      id, email, plan, trial_ends_at,
      pro_ends_at, plan_period, plan_price, plan_currency,
      hotmart_subscriber, hotmart_transaction, phone, last_payment_at
    )
    values (
      NEW.id, NEW.email, 'pro', null,
      v_act.pro_ends_at, v_act.plan_period, v_act.plan_price, v_act.plan_currency,
      v_act.hotmart_subscriber, v_act.hotmart_transaction, v_act.phone, v_act.last_payment_at
    )
    on conflict (id) do nothing;
    delete from public.pending_activations where lower(email) = lower(NEW.email);
  else
    insert into public.profiles (id, email, plan, trial_ends_at)
    values (NEW.id, NEW.email, 'trial', now() + interval '7 days')
    on conflict (id) do nothing;
    if found then
      delete from public.pending_activations where lower(email) = lower(NEW.email);
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;
