-- ============================================================
-- Timeline / acompanhamento da reforma (T2)
-- Tabelas: project_phases (cronograma físico-financeiro) e
-- project_updates (atualizações/fotos de andamento).
-- Ambas ligadas a projects via RLS user_owns_project.
-- Campos compatíveis com cronograma físico-financeiro para
-- futura integração ao software de gestão de obras da BWild.
-- ============================================================

-- ============================================================
-- Tabela: project_phases
-- Finalidade: marcos/etapas do cronograma da reforma.
-- ============================================================
CREATE TABLE public.project_phases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned',
  physical_pct numeric NOT NULL DEFAULT 0,   -- avanço físico (0-100)
  financial_pct numeric NOT NULL DEFAULT 0,  -- avanço financeiro (0-100)
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_phases IS 'Fases/marcos do cronograma físico-financeiro da reforma de um projeto.';

-- Validação de status e percentuais (trigger, p/ flexibilidade)
CREATE OR REPLACE FUNCTION public.validate_project_phase()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('planned', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'Status inválido: %. Aceitos: planned, in_progress, completed', NEW.status;
  END IF;
  IF NEW.physical_pct < 0 OR NEW.physical_pct > 100 THEN
    RAISE EXCEPTION 'physical_pct (%) deve estar entre 0 e 100', NEW.physical_pct;
  END IF;
  IF NEW.financial_pct < 0 OR NEW.financial_pct > 100 THEN
    RAISE EXCEPTION 'financial_pct (%) deve estar entre 0 e 100', NEW.financial_pct;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_phase
  BEFORE INSERT OR UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_phase();

CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_phases_project
  ON public.project_phases (project_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_phases TO authenticated;
GRANT ALL ON public.project_phases TO service_role;

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_phases"
  ON public.project_phases FOR SELECT TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can insert own project_phases"
  ON public.project_phases FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can update own project_phases"
  ON public.project_phases FOR UPDATE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id))
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can delete own project_phases"
  ON public.project_phases FOR DELETE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

-- ============================================================
-- Tabela: project_updates
-- Finalidade: atualizações/fotos de andamento da obra.
-- ============================================================
CREATE TABLE public.project_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  title text,
  body text,
  image_url text,
  update_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_updates IS 'Atualizações de andamento da reforma (foto/legenda/data), opcionalmente ligadas a uma fase.';

CREATE TRIGGER update_project_updates_updated_at
  BEFORE UPDATE ON public.project_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_updates_project
  ON public.project_updates (project_id, update_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_updates TO authenticated;
GRANT ALL ON public.project_updates TO service_role;

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_updates"
  ON public.project_updates FOR SELECT TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can insert own project_updates"
  ON public.project_updates FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can update own project_updates"
  ON public.project_updates FOR UPDATE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id))
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can delete own project_updates"
  ON public.project_updates FOR DELETE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));
