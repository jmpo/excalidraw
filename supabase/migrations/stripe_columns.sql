-- Add Hotmart transaction tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hotmart_transaction TEXT;
