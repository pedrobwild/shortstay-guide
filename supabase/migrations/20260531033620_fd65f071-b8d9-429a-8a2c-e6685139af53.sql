-- ============================================================
-- Tabela: project_assumptions
-- Finalidade: Persistir as premissas financeiras de cada projeto
--   (ADR, limpeza, gestão %, impostos %, condomínio, valor do imóvel,
--    bairro e área). Antes ficavam apenas em localStorage, o que fazia
--    o lead perder a simulação ao trocar de device e impedia o time
--    comercial de enxergar o que cada lead simulou.
-- 1 conjunto de premissas por projeto (UNIQUE em project_id → upsert).
-- ============================================================
CREATE TABLE public.project_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  adr numeric,
  cleaning_per_stay numeric,
  management_pct numeric,
  taxes_pct numeric,
  condo_monthly numeric,
  property_value numeric,
  neighborhood text,
  area_sqm text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_assumptions_project_id_key UNIQUE (project_id)
);

COMMENT ON TABLE public.project_assumptions IS 'Premissas financeiras por projeto. Base para o score de prontidão de fechamento e o painel comercial.';

CREATE INDEX idx_project_assumptions_project
  ON public.project_assumptions (project_id);

-- Mantém updated_at sempre atualizado no UPDATE
CREATE OR REPLACE FUNCTION public.touch_project_assumptions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_project_assumptions_updated_at
  BEFORE UPDATE ON public.project_assumptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_assumptions_updated_at();

ALTER TABLE public.project_assumptions ENABLE ROW LEVEL SECURITY;

-- RLS reaproveitando public.user_owns_project — mesmo padrão de ota_connections.
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
