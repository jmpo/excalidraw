ALTER TABLE public.drawings
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'canvas'
    CHECK (type IN ('canvas', 'mindmap'));
