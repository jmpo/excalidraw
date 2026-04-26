-- ── Historial de versiones de dibujos ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.drawing_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id  UUID NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT,                    -- optional name e.g. "Antes de cambiar layout"
  snapshot    JSONB NOT NULL,          -- { elements, appState } or { mindElixir } etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS drawing_versions_drawing ON public.drawing_versions(drawing_id, created_at DESC);

ALTER TABLE public.drawing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "versions_owner_all"
  ON public.drawing_versions FOR ALL
  USING (user_id = auth.uid());
