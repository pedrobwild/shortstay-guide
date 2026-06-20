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
  last_event_at timestamptz,
  stage text,
  stage_entered_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      l.id AS lead_id, l.name, l.whatsapp, l.neighborhood, l.area_sqm,
      l.objective, l.source, l.created_at, l.user_id, l.session_id,
      (l.user_id IS NOT NULL) AS has_account,
      COALESCE(pr.project_count, 0) AS project_count,
      pr.first_project_at,
      COALESCE(pa.has_assumptions, false) AS has_assumptions,
      pa.property_value, pa.assumption_adr, pa.assumption_updated_at,
      pa.has_neighborhood,
      COALESCE(oc.has_connection, false) AS has_connection,
      oc.first_connection_at,
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
      SELECT count(*)::int AS project_count, min(p.created_at) AS first_project_at
      FROM public.projects p WHERE p.user_id = l.user_id
    ) pr ON l.user_id IS NOT NULL
    LEFT JOIN LATERAL (
      SELECT true AS has_assumptions,
        max(a.property_value) AS property_value,
        max(a.adr) AS assumption_adr,
        max(a.updated_at) AS assumption_updated_at,
        bool_or(a.neighborhood IS NOT NULL AND a.neighborhood <> '') AS has_neighborhood
      FROM public.project_assumptions a
      JOIN public.projects p ON p.id = a.project_id
      WHERE p.user_id = l.user_id
      HAVING count(*) > 0
    ) pa ON l.user_id IS NOT NULL
    LEFT JOIN LATERAL (
      SELECT true AS has_connection, min(c.created_at) AS first_connection_at
      FROM public.ota_connections c
      JOIN public.projects p ON p.id = c.project_id
      WHERE p.user_id = l.user_id
      HAVING count(*) > 0
    ) oc ON l.user_id IS NOT NULL
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS event_count,
        COALESCE(max(CASE WHEN e.event_type ~ '^scroll_[0-9]+$' THEN substring(e.event_type FROM 8)::int ELSE 0 END), 0) AS max_scroll,
        count(DISTINCT e.event_data->>'section_id') FILTER (WHERE e.event_type = 'section_enter')::int AS sections_viewed,
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
  )
  SELECT
    lead_id, name, whatsapp, neighborhood, area_sqm, objective, source,
    created_at, user_id, session_id, has_account, project_count,
    has_assumptions, property_value, assumption_adr, event_count,
    max_scroll, sections_viewed, simulator_uses, exported_simulation,
    quiz_interactions, chatbot_interactions, cta_clicks, last_event_at,
    CASE
      WHEN has_connection THEN 'operando'
      WHEN COALESCE(property_value, 0) > 0 THEN 'conexao'
      WHEN has_neighborhood THEN 'valor'
      WHEN project_count > 0 THEN 'projecao'
      ELSE 'lead'
    END AS stage,
    CASE
      WHEN has_connection THEN first_connection_at
      WHEN COALESCE(property_value, 0) > 0 THEN assumption_updated_at
      WHEN has_neighborhood THEN assumption_updated_at
      WHEN project_count > 0 THEN first_project_at
      ELSE created_at
    END AS stage_entered_at
  FROM base
  ORDER BY created_at DESC;
$$;

COMMENT ON FUNCTION public.admin_lead_scores() IS
  'Agrega sinais de prontidão por lead + etapa atual do funil e quando entrou nela. Admin-only.';