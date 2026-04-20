-- Add Stripe-related columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for fast webhook lookups by subscription ID
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_sub
  ON public.profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
