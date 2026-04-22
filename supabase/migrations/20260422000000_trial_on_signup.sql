-- Assign 7-day trial immediately on signup (no longer requires onboarding completion).
-- If the user completes onboarding, completeOnboarding() extends it to 10 days from created_at.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    'trial',
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: give existing FREE users (no onboarding) a 7-day trial from now
UPDATE public.profiles
SET
  plan          = 'trial',
  trial_ends_at = NOW() + INTERVAL '7 days'
WHERE plan = 'free'
  AND trial_ends_at IS NULL;
