-- Make the pending-activation lookup in handle_new_user case-insensitive.
-- Supabase Auth lowercases emails; this guards against any pending row stored
-- with different casing so a paid buyer never falls back to trial by mistake.

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
      hotmart_subscriber, hotmart_transaction
    )
    values (
      NEW.id, NEW.email, 'pro', null,
      v_act.pro_ends_at, v_act.plan_period, v_act.plan_price, v_act.plan_currency,
      v_act.hotmart_subscriber, v_act.hotmart_transaction
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
