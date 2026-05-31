CREATE TABLE public.project_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'custom',
  position INTEGER NOT NULL DEFAULT 0,
  occupancy_pct NUMERIC,
  adr NUMERIC,
  cleaning_per_stay NUMERIC,
  management_pct NUMERIC,
  taxes_pct NUMERIC,
  condo_monthly NUMERIC,
  property_value NUMERIC,
  avg_stay_nights NUMERIC,
  neighborhood TEXT,
  area_sqm TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_scenarios TO authenticated;
GRANT ALL ON public.project_scenarios TO service_role;

ALTER TABLE public.project_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_scenarios" ON public.project_scenarios
  FOR SELECT TO authenticated USING (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can insert own project_scenarios" ON public.project_scenarios
  FOR INSERT TO authenticated WITH CHECK (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can update own project_scenarios" ON public.project_scenarios
  FOR UPDATE TO authenticated USING (user_owns_project(auth.uid(), project_id)) WITH CHECK (user_owns_project(auth.uid(), project_id));
CREATE POLICY "Users can delete own project_scenarios" ON public.project_scenarios
  FOR DELETE TO authenticated USING (user_owns_project(auth.uid(), project_id));

CREATE TRIGGER update_project_scenarios_updated_at
  BEFORE UPDATE ON public.project_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_scenarios_project_id ON public.project_scenarios(project_id);