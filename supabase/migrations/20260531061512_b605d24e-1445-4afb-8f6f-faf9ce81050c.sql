-- Tabelas da Timeline da reforma
CREATE TABLE public.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  physical_pct NUMERIC NOT NULL DEFAULT 0,
  financial_pct NUMERIC NOT NULL DEFAULT 0,
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_phases TO authenticated;
GRANT ALL ON public.project_phases TO service_role;

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_phases" ON public.project_phases
  FOR SELECT TO authenticated USING (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can insert own project_phases" ON public.project_phases
  FOR INSERT TO authenticated WITH CHECK (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can update own project_phases" ON public.project_phases
  FOR UPDATE TO authenticated USING (user_owns_project(auth.uid(), project_id)) WITH CHECK (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can delete own project_phases" ON public.project_phases
  FOR DELETE TO authenticated USING (user_owns_project(auth.uid(), project_id));

CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_phases_project_id ON public.project_phases(project_id);

CREATE TABLE public.project_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  title TEXT,
  body TEXT,
  image_url TEXT,
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_updates TO authenticated;
GRANT ALL ON public.project_updates TO service_role;

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_updates" ON public.project_updates
  FOR SELECT TO authenticated USING (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can insert own project_updates" ON public.project_updates
  FOR INSERT TO authenticated WITH CHECK (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can update own project_updates" ON public.project_updates
  FOR UPDATE TO authenticated USING (user_owns_project(auth.uid(), project_id)) WITH CHECK (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can delete own project_updates" ON public.project_updates
  FOR DELETE TO authenticated USING (user_owns_project(auth.uid(), project_id));

CREATE TRIGGER update_project_updates_updated_at
  BEFORE UPDATE ON public.project_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX idx_project_updates_phase_id ON public.project_updates(phase_id);