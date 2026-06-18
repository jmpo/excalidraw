-- Subscription plans (monthly/annual) with expiration tracking from Hotmart.
-- Pro access is no longer permanent for subscription buyers: it expires at
-- pro_ends_at (derived from Hotmart's date_next_charge + grace) and is renewed
-- automatically on each PURCHASE_APPROVED. When it lapses, the account is paused.
-- Manual Pro grants from the admin panel leave pro_ends_at NULL = permanent.

alter table public.profiles
  add column if not exists plan_period      text,         -- 'monthly' | 'annual' | null
  add column if not exists pro_ends_at       timestamptz, -- when Pro lapses; null = permanent
  add column if not exists plan_price        numeric,     -- last paid amount
  add column if not exists plan_currency     text,        -- e.g. 'BRL', 'USD'
  add column if not exists hotmart_subscriber text;       -- subscriber code for support

-- Treat Pro with an expired pro_ends_at as free in the drawing-limit trigger.
create or replace function check_drawing_limit()
returns trigger
language plpgsql
security definer
as $$
declare
  v_plan       text;
  v_trial_ends timestamptz;
  v_pro_ends   timestamptz;
  v_effective  text;
  v_count      int;
  v_limit      int;
begin
  select plan, trial_ends_at, pro_ends_at
  into v_plan, v_trial_ends, v_pro_ends
  from public.profiles
  where id = new.user_id;

  -- expired trial or paused → treat as free
  if v_plan = 'trial' and (v_trial_ends is null or v_trial_ends < now()) then
    v_effective := 'free';
  elsif v_plan = 'paused' then
    v_effective := 'free';
  -- expired subscription Pro (pro_ends_at set and in the past) → treat as free
  elsif v_plan = 'pro' and v_pro_ends is not null and v_pro_ends < now() then
    v_effective := 'free';
  else
    v_effective := coalesce(v_plan, 'free');
  end if;

  if v_effective = 'pro' then
    return new;
  end if;

  select count(*) into v_count
  from public.drawings
  where user_id = new.user_id;

  v_limit := case v_effective
    when 'trial' then 5
    else 2
  end;

  if v_count >= v_limit then
    raise exception 'DRAWING_LIMIT_REACHED: plan=%, limit=%', v_effective, v_limit;
  end if;

  return new;
end;
$$;

-- Daily cron: pause Pro accounts whose subscription lapsed without renewal.
-- Only touches subscription Pro (pro_ends_at NOT NULL); manual permanent grants
-- (pro_ends_at NULL) are never affected.
select cron.schedule(
  'pause-expired-pro',
  '0 6 * * *',
  $$
    update public.profiles
    set plan = 'paused'
    where plan = 'pro'
      and pro_ends_at is not null
      and pro_ends_at < now();
  $$
);
