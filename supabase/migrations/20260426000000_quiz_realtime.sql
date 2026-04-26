-- ── Quiz en tiempo real ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,          -- 6-char join code e.g. "A4B2X9"
  questions   JSONB NOT NULL DEFAULT '[]',   -- QuizQuestion[]
  status      TEXT NOT NULL DEFAULT 'waiting', -- waiting | active | revealing | finished
  current_q   INT NOT NULL DEFAULT -1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  student_name   TEXT NOT NULL,
  answer         TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS quiz_answers_quiz_q ON public.quiz_answers(quiz_id, question_index);
CREATE INDEX IF NOT EXISTS quizzes_user ON public.quizzes(user_id);

-- RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Teachers manage their own quizzes
CREATE POLICY "quiz_owner_all"
  ON public.quizzes FOR ALL
  USING (user_id = auth.uid());

-- Anyone can read a quiz by code (students need to find it)
CREATE POLICY "quiz_public_read"
  ON public.quizzes FOR SELECT
  USING (true);

-- Anyone can submit an answer (students are unauthenticated)
CREATE POLICY "quiz_answers_insert"
  ON public.quiz_answers FOR INSERT
  WITH CHECK (true);

-- Quiz owner can read all answers
CREATE POLICY "quiz_answers_owner_read"
  ON public.quiz_answers FOR SELECT
  USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

-- Enable Realtime for status sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
