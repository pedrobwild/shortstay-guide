-- ============================================================
-- T3 — Score de prontidão de fechamento do lead (painel admin)
--
-- Objetivo: transformar a telemetria já capturada (guide_events) +
-- as premissas simuladas (project_assumptions) em priorização comercial.
--
-- Este migration faz três coisas:
--   1. Vincula o lead à sua sessão de navegação (session_id), para que os
--      eventos anônimos (scroll, simulações, quiz) possam ser correlacionados
--      ao lead que os gerou.
--   2. Endurece o RLS de guide_leads / guide_events: leitura passa a ser
--      exclusiva de admins (antes qualquer autenticado lia tudo).
--   3. Expõe uma RPC SECURITY DEFINER (admin_lead_scores) que agrega, por
--      lead, os sinais brutos de prontidão. O cálculo do score ponderado
--      fica no front (src/lib/leadScore.ts) para ser testável e ajustável.
-- ============================================================

-- 1. Vínculo lead → sessão de eventos --------------------------------------
ALTER TABLE public.guide_leads
  ADD COLUMN IF NOT EXISTS session_id text;

CREATE INDEX IF NOT EXISTS guide_leads_session_id_idx
  ON public.guide_leads (session_id);

-- Acelera o JOIN de agregação evento → sessão do lead.
CREATE INDEX IF NOT EXISTS idx_ge_session ON public.guide_events (session_id);

-- 2. Endurecimento do RLS de leitura (admin-only) --------------------------
-- Antes: "Allow authenticated read" com USING (true) — qualquer usuário
-- autenticado conseguia ler todos os leads e eventos. Critério de aceite do
-- T3 exige não expor esses dados a não-admins.
DROP POLICY IF EXISTS "Allow authenticated read on guide_leads" ON public.guide_leads;
DROP POLICY IF EXISTS "Allow authenticated read on guide_events" ON public.guide_events;

CREATE POLICY "Admins can read guide_leads"
  ON public.guide_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read guide_events"
  ON public.guide_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. RPC de agregação de sinais por lead -----------------------------------
-- SECURITY DEFINER + checagem explícita de role: a função roda com privilégios
-- elevados (para cruzar projects/project_assumptions de outros donos), mas só
-- retorna linhas se quem chama for admin. Para não-admins retorna vazio.
CREATE OR REPLACE FUNCTION public.admin_lead_scores()
RETURNS TABLE (
  lead_id uuid,
  name text,
  whatsapp text,
  neighborhood text,
  area_sqm text,
  objective text,
  source text,
  created_at timestamptz,
  user_id uuid,
  session_id text,
  has_account boolean,
  project_count integer,
  has_assumptions boolean,
  property_value numeric,
  assumption_adr numeric,
  event_count integer,
  max_scroll integer,
  sections_viewed integer,
  simulator_uses integer,
  exported_simulation boolean,
  quiz_interactions integer,
  chatbot_interactions integer,
  cta_clicks integer,
  last_event_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id AS lead_id,
    l.name,
    l.whatsapp,
    l.neighborhood,
    l.area_sqm,
    l.objective,
    l.source,
    l.created_at,
    l.user_id,
    l.session_id,
    (l.user_id IS NOT NULL) AS has_account,
    COALESCE(pr.project_count, 0) AS project_count,
    COALESCE(pa.has_assumptions, false) AS has_assumptions,
    pa.property_value,
    pa.assumption_adr,
    COALESCE(ev.event_count, 0) AS event_count,
    COALESCE(ev.max_scroll, 0) AS max_scroll,
    COALESCE(ev.sections_viewed, 0) AS sections_viewed,
    COALESCE(ev.simulator_uses, 0) AS simulator_uses,
    COALESCE(ev.exported_simulation, false) AS exported_simulation,
    COALESCE(ev.quiz_interactions, 0) AS quiz_interactions,
    COALESCE(ev.chatbot_interactions, 0) AS chatbot_interactions,
    COALESCE(ev.cta_clicks, 0) AS cta_clicks,
    ev.last_event_at
  FROM public.guide_leads l
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS project_count
    FROM public.projects p
    WHERE p.user_id = l.user_id
  ) pr ON l.user_id IS NOT NULL
  LEFT JOIN LATERAL (
    SELECT
      true AS has_assumptions,
      max(a.property_value) AS property_value,
      max(a.adr) AS assumption_adr
    FROM public.project_assumptions a
    JOIN public.projects p ON p.id = a.project_id
    WHERE p.user_id = l.user_id
    HAVING count(*) > 0
  ) pa ON l.user_id IS NOT NULL
  LEFT JOIN LATERAL (
    SELECT
      count(*)::int AS event_count,
      COALESCE(max(
        CASE WHEN e.event_type ~ '^scroll_[0-9]+$'
          THEN substring(e.event_type FROM 8)::int
          ELSE 0 END
      ), 0) AS max_scroll,
      count(DISTINCT e.event_data->>'section_id')
        FILTER (WHERE e.event_type = 'section_enter')::int AS sections_viewed,
      count(*) FILTER (WHERE e.event_type IN ('simulator_used', 'mercado_used'))::int AS simulator_uses,
      bool_or(e.event_type = 'export_simulation') AS exported_simulation,
      count(*) FILTER (WHERE e.event_type = 'persona_toggle')::int AS quiz_interactions,
      count(*) FILTER (WHERE e.event_type IN ('chatbot_opened', 'chatbot_message', 'chatbot_cta_specialist'))::int AS chatbot_interactions,
      count(*) FILTER (WHERE e.event_type = 'cta_clicked')::int AS cta_clicks,
      max(e.created_at) AS last_event_at
    FROM public.guide_events e
    WHERE l.session_id IS NOT NULL AND e.session_id = l.session_id
  ) ev ON true
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY l.created_at DESC;
$$;

COMMENT ON FUNCTION public.admin_lead_scores() IS
  'Agrega sinais de prontidão de fechamento por lead (eventos + premissas + conta). Admin-only. Score ponderado é calculado no front.';

REVOKE ALL ON FUNCTION public.admin_lead_scores() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_lead_scores() TO authenticated;
