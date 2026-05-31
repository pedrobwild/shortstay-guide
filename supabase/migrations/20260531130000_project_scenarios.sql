-- ============================================================
-- Tabela: project_scenarios
-- Finalidade: Permitir que o cliente salve e compare múltiplos cenários
--   de investimento (conservador / realista / otimista / custom) por projeto,
--   lado a lado. Cada cenário guarda seu próprio conjunto de premissas
--   (ocupação, ADR, custos, valor do imóvel) — diferente de
--   `project_assumptions`, que mantém 1 conjunto "oficial" por projeto.
--
-- Vários cenários por projeto (sem UNIQUE em project_id). `position` ordena
-- as colunas na UI de comparação; `kind` registra o preset de origem.
-- ============================================================
CREATE TABLE public.project_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'custom',  -- 'conservador' | 'realista' | 'otimista' | 'custom'
  adr numeric,
  cleaning_per_stay numeric,
  management_pct numeric,
  taxes_pct numeric,
  condo_monthly numeric,
  property_value numeric,
  occupancy_pct numeric,
  avg_stay_nights numeric,
  neighborhood text,
  area_sqm text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_scenarios IS 'Cenários de investimento nomeados por projeto para o comparador multi-cenário (conservador/realista/otimista).';

CREATE INDEX idx_project_scenarios_project
  ON public.project_scenarios (project_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_scenarios TO authenticated;
GRANT ALL ON public.project_scenarios TO service_role;

-- Mantém updated_at sempre atualizado no UPDATE (reaproveita a função padrão).
CREATE TRIGGER update_project_scenarios_updated_at
  BEFORE UPDATE ON public.project_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS reaproveitando public.user_owns_project — mesmo padrão de project_assumptions.
CREATE POLICY "Users can view own project_scenarios"
  ON public.project_scenarios FOR SELECT TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can insert own project_scenarios"
  ON public.project_scenarios FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can update own project_scenarios"
  ON public.project_scenarios FOR UPDATE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id))
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can delete own project_scenarios"
  ON public.project_scenarios FOR DELETE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));
