-- ── profiles: one row per registered user ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='admin_read_profiles') THEN
    CREATE POLICY "admin_read_profiles" ON profiles
      FOR SELECT USING (auth.jwt() ->> 'email' = 'pompa.07@gmail.com');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='users_read_own_profile') THEN
    CREATE POLICY "users_read_own_profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Auto-insert profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (in case there are already users)
INSERT INTO public.profiles (id, email, created_at)
SELECT id, email, created_at FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ── Admin read-all policies for drawings and folders ──────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='drawings' AND policyname='admin_read_all_drawings') THEN
    CREATE POLICY "admin_read_all_drawings" ON drawings
      FOR SELECT USING (auth.jwt() ->> 'email' = 'pompa.07@gmail.com');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='folders' AND policyname='admin_read_all_folders') THEN
    CREATE POLICY "admin_read_all_folders" ON folders
      FOR SELECT USING (auth.jwt() ->> 'email' = 'pompa.07@gmail.com');
  END IF;
END $$;
