ALTER TABLE public.guide_leads
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS guide_leads_session_id_idx ON public.guide_leads(session_id);
CREATE INDEX IF NOT EXISTS guide_leads_user_id_idx ON public.guide_leads(user_id);