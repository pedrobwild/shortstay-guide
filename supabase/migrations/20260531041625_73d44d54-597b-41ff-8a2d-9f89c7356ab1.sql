CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.project_assumptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL UNIQUE,
  adr numeric,
  cleaning_per_stay numeric,
  management_pct numeric,
  taxes_pct numeric,
  condo_monthly numeric,
  property_value numeric,
  neighborhood text,
  area_sqm text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_assumptions TO authenticated;
GRANT ALL ON public.project_assumptions TO service_role;

ALTER TABLE public.project_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_assumptions"
  ON public.project_assumptions FOR SELECT TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can insert own project_assumptions"
  ON public.project_assumptions FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can update own project_assumptions"
  ON public.project_assumptions FOR UPDATE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id))
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can delete own project_assumptions"
  ON public.project_assumptions FOR DELETE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

CREATE TRIGGER update_project_assumptions_updated_at
  BEFORE UPDATE ON public.project_assumptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();