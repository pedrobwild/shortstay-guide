import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DEFAULT_AVG_STAY_NIGHTS,
  DEFAULT_OCCUPANCY_PCT,
  type ScenarioAssumptions,
  type ScenarioKind,
} from "@/lib/scenarioModel";
import { DEFAULT_ADR_BRL, DEFAULT_PROJECTION_COSTS } from "@/lib/projectAnalytics";

type ScenarioRow = Database["public"]["Tables"]["project_scenarios"]["Row"];
type ScenarioInsert = Database["public"]["Tables"]["project_scenarios"]["Insert"];

/** Cenário hidratado para a UI (premissas + metadados). */
export interface Scenario extends ScenarioAssumptions {
  id: string;
  name: string;
  kind: ScenarioKind;
  position: number;
  neighborhood: string | null;
  areaSqm: string | null;
}

/** Entrada para criar um novo cenário. */
export interface NewScenarioInput {
  name: string;
  kind: ScenarioKind;
  assumptions: ScenarioAssumptions;
  neighborhood?: string | null;
  areaSqm?: string | null;
}

const SAVE_DEBOUNCE_MS = 700;

function rowToScenario(row: ScenarioRow): Scenario {
  return {
    id: row.id,
    name: row.name,
    kind: (row.kind as ScenarioKind) ?? "custom",
    position: row.position ?? 0,
    occupancyPct: row.occupancy_pct ?? DEFAULT_OCCUPANCY_PCT,
    adr: row.adr ?? DEFAULT_ADR_BRL,
    cleaningPerStay: row.cleaning_per_stay ?? DEFAULT_PROJECTION_COSTS.cleaningPerStay,
    managementPct: row.management_pct ?? DEFAULT_PROJECTION_COSTS.managementPct,
    taxesPct: row.taxes_pct ?? DEFAULT_PROJECTION_COSTS.taxesPct,
    condoMonthly: row.condo_monthly ?? DEFAULT_PROJECTION_COSTS.condoMonthly,
    propertyValue: row.property_value ?? 0,
    avgStayNights: row.avg_stay_nights ?? DEFAULT_AVG_STAY_NIGHTS,
    neighborhood: row.neighborhood ?? null,
    areaSqm: row.area_sqm ?? null,
  };
}

function inputToRow(projectId: string, input: NewScenarioInput, position: number): ScenarioInsert {
  const a = input.assumptions;
  return {
    project_id: projectId,
    name: input.name,
    kind: input.kind,
    position,
    occupancy_pct: a.occupancyPct,
    adr: a.adr,
    cleaning_per_stay: a.cleaningPerStay,
    management_pct: a.managementPct,
    taxes_pct: a.taxesPct,
    condo_monthly: a.condoMonthly,
    property_value: a.propertyValue,
    avg_stay_nights: a.avgStayNights,
    neighborhood: input.neighborhood ?? null,
    area_sqm: input.areaSqm ?? null,
  };
}

/** Mapeia campos da UI (Scenario) → colunas do Supabase para um patch. */
function patchToRow(patch: Partial<Scenario>): Partial<ScenarioRow> {
  const row: Partial<ScenarioRow> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.kind !== undefined) row.kind = patch.kind;
  if (patch.position !== undefined) row.position = patch.position;
  if (patch.occupancyPct !== undefined) row.occupancy_pct = patch.occupancyPct;
  if (patch.adr !== undefined) row.adr = patch.adr;
  if (patch.cleaningPerStay !== undefined) row.cleaning_per_stay = patch.cleaningPerStay;
  if (patch.managementPct !== undefined) row.management_pct = patch.managementPct;
  if (patch.taxesPct !== undefined) row.taxes_pct = patch.taxesPct;
  if (patch.condoMonthly !== undefined) row.condo_monthly = patch.condoMonthly;
  if (patch.propertyValue !== undefined) row.property_value = patch.propertyValue;
  if (patch.avgStayNights !== undefined) row.avg_stay_nights = patch.avgStayNights;
  return row;
}

/**
 * CRUD dos cenários de investimento de um projeto.
 *
 * Supabase é a fonte de verdade (RLS por projeto). Edições de premissas são
 * aplicadas de forma otimista no estado local e persistidas com debounce por
 * cenário, para não disparar um write a cada tecla.
 */
export function useProjectScenarios(projectId: string | undefined) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Timers de save debounced, indexados por id de cenário.
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Patch pendente acumulado por cenário: junta múltiplos campos editados
  // dentro da mesma janela de debounce para não perder nenhuma edição.
  const pendingPatches = useRef<Map<string, Partial<Scenario>>>(new Map());

  const persistPatch = useCallback(async (id: string, patch: Partial<Scenario>) => {
    const row = patchToRow(patch);
    if (Object.keys(row).length === 0) return;
    const { error } = await supabase.from("project_scenarios").update(row).eq("id", id);
    if (error) console.error("project_scenarios update error", error);
  }, []);

  /** Persiste imediatamente o patch pendente de um cenário (cancela o timer). */
  const flushScenario = useCallback(
    (id: string) => {
      const timer = saveTimers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        saveTimers.current.delete(id);
      }
      const patch = pendingPatches.current.get(id);
      if (patch && Object.keys(patch).length > 0) {
        pendingPatches.current.delete(id);
        void persistPatch(id, patch);
      }
    },
    [persistPatch],
  );

  /** Persiste todos os patches pendentes (troca de projeto / unmount). */
  const flushAll = useCallback(() => {
    const ids = Array.from(pendingPatches.current.keys());
    ids.forEach((id) => flushScenario(id));
    saveTimers.current.forEach((t) => clearTimeout(t));
    saveTimers.current.clear();
  }, [flushScenario]);

  useEffect(() => {
    if (!projectId) {
      setScenarios([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("project_scenarios")
          .select("*")
          .eq("project_id", projectId)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!cancelled) setScenarios((data ?? []).map(rowToScenario));
      } catch (err) {
        console.error("useProjectScenarios load error", err);
        if (!cancelled) setScenarios([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    // Ao trocar de projeto ou desmontar, persiste o que estiver pendente
    // antes de descartar (premissas são anunciadas como salvas automaticamente).
    return () => {
      cancelled = true;
      flushAll();
    };
  }, [projectId, flushAll]);

  /** Atualiza um cenário (otimista + persistência debounced acumulada). */
  const updateScenario = useCallback(
    (id: string, patch: Partial<Scenario>) => {
      setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      // Acumula o patch: junta este campo aos já editados nesta janela de debounce.
      const merged = { ...(pendingPatches.current.get(id) ?? {}), ...patch };
      pendingPatches.current.set(id, merged);
      const timers = saveTimers.current;
      const existing = timers.get(id);
      if (existing) clearTimeout(existing);
      timers.set(id, setTimeout(() => flushScenario(id), SAVE_DEBOUNCE_MS));
    },
    [flushScenario],
  );

  /** Insere um ou mais cenários (ex.: "gerar 3 presets") e devolve os criados. */
  const addScenarios = useCallback(
    async (inputs: NewScenarioInput[]): Promise<Scenario[]> => {
      if (!projectId || inputs.length === 0) return [];
      setBusy(true);
      try {
        const basePos = scenarios.reduce((max, s) => Math.max(max, s.position), -1) + 1;
        const rows = inputs.map((input, i) => inputToRow(projectId, input, basePos + i));
        const { data, error } = await supabase.from("project_scenarios").insert(rows).select("*");
        if (error) throw error;
        const created = (data ?? []).map(rowToScenario);
        setScenarios((prev) => [...prev, ...created]);
        return created;
      } catch (err) {
        console.error("project_scenarios insert error", err);
        return [];
      } finally {
        setBusy(false);
      }
    },
    [projectId, scenarios],
  );

  const addScenario = useCallback(
    async (input: NewScenarioInput): Promise<Scenario | null> => {
      const [created] = await addScenarios([input]);
      return created ?? null;
    },
    [addScenarios],
  );

  /** Remove um cenário (descarta save pendente: seria sobre uma linha apagada). */
  const removeScenario = useCallback(async (id: string) => {
    const timer = saveTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
    }
    pendingPatches.current.delete(id);
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("project_scenarios").delete().eq("id", id);
    if (error) console.error("project_scenarios delete error", error);
  }, []);

  return {
    scenarios,
    loading,
    busy,
    updateScenario,
    addScenario,
    addScenarios,
    removeScenario,
  };
}
