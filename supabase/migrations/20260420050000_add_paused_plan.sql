-- Add 'paused' plan value and hotmart_transaction column to profiles

-- Drop the old check constraint (name may vary — drop all variants defensively)
alter table public.profiles
  drop constraint if exists profiles_plan_check;

-- Add extended plan check: free | trial | pro | paused
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'trial', 'pro', 'paused'));

-- Track Hotmart transaction ID for reference / support
alter table public.profiles
  add column if not exists hotmart_transaction text;

-- Update drawing-limit trigger to block paused users (treat as free)
create or replace function check_drawing_limit()
returns trigger
language plpgsql
security definer
as $$
declare
  v_plan       text;
  v_trial_ends timestamptz;
  v_effective  text;
  v_count      int;
  v_limit      int;
begin
  select plan, trial_ends_at
  into v_plan, v_trial_ends
  from public.profiles
  where id = new.user_id;

  -- expired trial or paused → treat as free
  if v_plan = 'trial' and (v_trial_ends is null or v_trial_ends < now()) then
    v_effective := 'free';
  elsif v_plan = 'paused' then
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
