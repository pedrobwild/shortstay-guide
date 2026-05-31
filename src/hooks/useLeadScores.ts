import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeLeadScore, type LeadScore } from "@/lib/leadScore";

/** Linha bruta retornada pela RPC `admin_lead_scores`. */
export interface LeadScoreRow {
  lead_id: string;
  name: string;
  whatsapp: string;
  neighborhood: string | null;
  area_sqm: string | null;
  objective: string | null;
  source: string | null;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
  has_account: boolean;
  project_count: number;
  has_assumptions: boolean;
  property_value: number | null;
  assumption_adr: number | null;
  event_count: number;
  max_scroll: number;
  sections_viewed: number;
  simulator_uses: number;
  exported_simulation: boolean;
  quiz_interactions: number;
  chatbot_interactions: number;
  cta_clicks: number;
  last_event_at: string | null;
}

/** Lead já enriquecido com o score de prontidão calculado. */
export type ScoredLead = LeadScoreRow & { scoring: LeadScore };

/**
 * Busca os leads agregados (admin-only via RPC) e calcula o score de prontidão
 * no cliente. A RPC já gateia por role, então não-admins recebem lista vazia.
 */
export function useLeadScores() {
  return useQuery({
    queryKey: ["admin-lead-scores"],
    queryFn: async (): Promise<ScoredLead[]> => {
      // RPC admin_lead_scores ainda não existe no schema gerado; cast pontual.
      const { data, error } = await (supabase.rpc as (fn: string) => Promise<{ data: unknown; error: unknown }>)("admin_lead_scores");
      if (error) throw error as Error;
      if (error) throw error;
      const rows = (data ?? []) as LeadScoreRow[];
      return rows.map((row) => ({
        ...row,
        scoring: computeLeadScore({
          neighborhood: row.neighborhood,
          area_sqm: row.area_sqm,
          objective: row.objective,
          has_account: row.has_account,
          project_count: row.project_count,
          property_value: row.property_value,
          max_scroll: row.max_scroll,
          sections_viewed: row.sections_viewed,
          simulator_uses: row.simulator_uses,
          exported_simulation: row.exported_simulation,
          quiz_interactions: row.quiz_interactions,
          chatbot_interactions: row.chatbot_interactions,
          cta_clicks: row.cta_clicks,
        }),
      }));
    },
  });
}

/** Eventos brutos de uma sessão, para a timeline no detalhe do lead. */
export interface LeadEvent {
  id: string;
  event_type: string;
  event_data: unknown;
  created_at: string | null;
  device_type: string | null;
}

export function useLeadEvents(sessionId: string | null) {
  return useQuery({
    queryKey: ["lead-events", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<LeadEvent[]> => {
      const { data, error } = await supabase
        .from("guide_events")
        .select("id, event_type, event_data, created_at, device_type")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LeadEvent[];
    },
  });
}
