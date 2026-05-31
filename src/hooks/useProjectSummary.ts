import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBairroData } from "@/hooks/useBairroData";
import {
  projectionSummary,
  DEFAULT_ADR_BRL,
  DEFAULT_PROJECTION_COSTS,
  type ProjectionSummary,
} from "@/lib/projectAnalytics";
import { deriveDeal, type DealStatus } from "@/lib/dealStatus";

interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
}

interface AssumptionsRow {
  adr: number | null;
  cleaning_per_stay: number | null;
  management_pct: number | null;
  taxes_pct: number | null;
  condo_monthly: number | null;
  property_value: number | null;
  neighborhood: string | null;
  area_sqm: string | null;
}

interface RawState {
  loading: boolean;
  hasProject: boolean;
  project: ProjectRow | null;
  assumptions: AssumptionsRow | null;
  hasConnection: boolean;
  hasRealEvents: boolean;
}

export interface ProjectSummary {
  loading: boolean;
  hasProject: boolean;
  project: ProjectRow | null;
  /** Projeção do studio (receita líquida anual + ROI). */
  projection: ProjectionSummary | null;
  hasNeighborhood: boolean;
  hasPropertyValue: boolean;
  hasConnection: boolean;
  hasRealEvents: boolean;
  deal: DealStatus | null;
}

const DEFAULT_OCCUPANCY_PCT = 75;
const DEFAULT_AREA_SQM = "26–35 m²";

/**
 * Reúne, para o painel pós-login, o estado consolidado do projeto mais recente
 * do cliente: a projeção do studio (receita líquida anual + ROI), o status da
 * negociação inferido do funil e o próximo passo sugerido.
 *
 * As premissas de mercado (ocupação/ADR) vêm de `useBairroData`; as financeiras,
 * de `project_assumptions`. Deve ser usado dentro de um `BairroProvider`.
 */
export function useProjectSummary(): ProjectSummary {
  const { user } = useAuth();
  const { bairros } = useBairroData();
  const [state, setState] = useState<RawState>({
    loading: true,
    hasProject: false,
    project: null,
    assumptions: null,
    hasConnection: false,
    hasRealEvents: false,
  });

  useEffect(() => {
    if (!user) {
      setState({
        loading: false,
        hasProject: false,
        project: null,
        assumptions: null,
        hasConnection: false,
        hasRealEvents: false,
      });
      return;
    }

    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const { data: projects, error: projErr } = await supabase
          .from("projects")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(1);
        if (projErr) throw projErr;

        const project = (projects?.[0] as ProjectRow | undefined) ?? null;
        if (!project) {
          if (!cancelled) {
            setState({
              loading: false,
              hasProject: false,
              project: null,
              assumptions: null,
              hasConnection: false,
              hasRealEvents: false,
            });
          }
          return;
        }

        const [{ data: assumptions }, { data: conns }] = await Promise.all([
          supabase
            .from("project_assumptions")
            .select(
              "adr, cleaning_per_stay, management_pct, taxes_pct, condo_monthly, property_value, neighborhood, area_sqm",
            )
            .eq("project_id", project.id)
            .maybeSingle(),
          supabase.from("ota_connections").select("id").eq("project_id", project.id),
        ]);

        const connectionIds = (conns ?? []).map((c) => c.id);
        let hasRealEvents = false;
        if (connectionIds.length > 0) {
          const { count } = await supabase
            .from("ota_calendar_events")
            .select("id", { count: "exact", head: true })
            .in("connection_id", connectionIds);
          hasRealEvents = (count ?? 0) > 0;
        }

        if (!cancelled) {
          setState({
            loading: false,
            hasProject: true,
            project,
            assumptions: (assumptions as AssumptionsRow | null) ?? null,
            hasConnection: connectionIds.length > 0,
            hasRealEvents,
          });
        }
      } catch (err) {
        console.error("useProjectSummary load error", err);
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return useMemo<ProjectSummary>(() => {
    const { loading, hasProject, project, assumptions } = state;
    if (!hasProject || !project) {
      return {
        loading,
        hasProject: false,
        project: null,
        projection: null,
        hasNeighborhood: false,
        hasPropertyValue: false,
        hasConnection: false,
        hasRealEvents: false,
        deal: null,
      };
    }

    const neighborhood = assumptions?.neighborhood ?? null;
    const areaSqm = assumptions?.area_sqm ?? DEFAULT_AREA_SQM;
    const bairro = bairros.find((b) => b.name === neighborhood);
    const occupancyPct = bairro?.avgOccupancy ?? DEFAULT_OCCUPANCY_PCT;
    const defaultAdr =
      bairro?.avgBySize[areaSqm as keyof typeof bairro.avgBySize] ?? DEFAULT_ADR_BRL;

    const projection = projectionSummary({
      occupancyPct,
      adr: assumptions?.adr ?? defaultAdr,
      cleaningPerStay: assumptions?.cleaning_per_stay ?? DEFAULT_PROJECTION_COSTS.cleaningPerStay,
      managementPct: assumptions?.management_pct ?? DEFAULT_PROJECTION_COSTS.managementPct,
      taxesPct: assumptions?.taxes_pct ?? DEFAULT_PROJECTION_COSTS.taxesPct,
      condoMonthly: assumptions?.condo_monthly ?? DEFAULT_PROJECTION_COSTS.condoMonthly,
      propertyValue: assumptions?.property_value ?? 0,
    });

    const hasNeighborhood = !!neighborhood;
    const hasPropertyValue = (assumptions?.property_value ?? 0) > 0;

    const deal = deriveDeal({
      projectId: project.id,
      hasNeighborhood,
      hasPropertyValue,
      hasConnection: state.hasConnection,
      hasRealEvents: state.hasRealEvents,
    });

    return {
      loading,
      hasProject: true,
      project,
      projection,
      hasNeighborhood,
      hasPropertyValue,
      hasConnection: state.hasConnection,
      hasRealEvents: state.hasRealEvents,
      deal,
    };
  }, [state, bairros]);
}
