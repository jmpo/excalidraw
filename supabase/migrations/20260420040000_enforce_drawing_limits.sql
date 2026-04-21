-- Enforce drawing limits per plan at the DB level
-- free: 2 drawings, trial: 5 drawings, pro: unlimited

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
  -- get the user's plan
  select plan, trial_ends_at
  into v_plan, v_trial_ends
  from public.profiles
  where id = new.user_id;

  -- compute effective plan (expired trial → free)
  if v_plan = 'trial' and (v_trial_ends is null or v_trial_ends < now()) then
    v_effective := 'free';
  else
    v_effective := coalesce(v_plan, 'free');
  end if;

  -- pro users have no limit
  if v_effective = 'pro' then
    return new;
  end if;

  -- count existing drawings
  select count(*) into v_count
  from public.drawings
  where user_id = new.user_id;

  -- set limit
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

drop trigger if exists trg_drawing_limit on public.drawings;

create trigger trg_drawing_limit
  before insert on public.drawings
  for each row
  execute function check_drawing_limit();
