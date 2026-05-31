/**
 * Modelo puro do comparador multi-cenário de investimento.
 *
 * Sem dependências de React ou Supabase. Reúne:
 *  - a geração de presets (conservador / realista / otimista) a partir das
 *    bandas de mercado do bairro;
 *  - o resumo de KPIs de cada cenário (reaproveita `projectionSummary`);
 *  - o cálculo de deltas entre um cenário e a baseline.
 *
 * Mantém a mesma cadeia de cálculo do dashboard, então comparador e projeção
 * nunca divergem.
 */
import {
  projectionSummary,
  DEFAULT_ADR_BRL,
  DEFAULT_SP_SEASONALITY,
  DEFAULT_PROJECTION_COSTS,
  type ProjectionSummary,
} from "@/lib/projectAnalytics";
import type { BairroItem } from "@/data/guide-data";

export type ScenarioKind = "conservador" | "realista" | "otimista" | "custom";

/** Ocupação padrão quando o bairro não tem dado (espelha useProjectSummary). */
export const DEFAULT_OCCUPANCY_PCT = 75;
/** Duração média de estadia padrão de uma projeção. */
export const DEFAULT_AVG_STAY_NIGHTS = 3;

/** Conjunto de premissas que define um cenário. */
export interface ScenarioAssumptions {
  occupancyPct: number;   // 0-100
  adr: number;            // diária bruta
  cleaningPerStay: number;
  managementPct: number;  // 0-100
  taxesPct: number;       // 0-100
  condoMonthly: number;
  propertyValue: number;  // 0 = ROI indisponível
  avgStayNights: number;
}

interface PresetConfig {
  kind: Exclude<ScenarioKind, "custom">;
  label: string;
  /** Pontos percentuais somados à ocupação média do bairro. */
  occupancyDeltaPct: number;
  /** Fator multiplicador sobre o ADR médio da faixa de área. */
  adrFactor: number;
}

/**
 * Presets ancorados na banda de mercado do bairro. Variamos ocupação e ADR
 * (os dois drivers que mudam por bairro); os custos operacionais partem dos
 * defaults e podem ser ajustados pelo cliente em cada coluna.
 */
export const SCENARIO_PRESETS: readonly PresetConfig[] = [
  { kind: "conservador", label: "Conservador", occupancyDeltaPct: -12, adrFactor: 0.85 },
  { kind: "realista", label: "Realista", occupancyDeltaPct: 0, adrFactor: 1.0 },
  { kind: "otimista", label: "Otimista", occupancyDeltaPct: 8, adrFactor: 1.15 },
] as const;

const SIZE_FALLBACK: keyof BairroItem["avgBySize"] = "26–35 m²";

const clampPct = (v: number) => Math.min(100, Math.max(0, v));
const round = (v: number) => Math.round(v);

/** Rótulo amigável do preset (ou "Cenário" para custom). */
export function scenarioKindLabel(kind: ScenarioKind): string {
  return SCENARIO_PRESETS.find((p) => p.kind === kind)?.label ?? "Cenário";
}

/**
 * Gera as premissas de um preset a partir das bandas de mercado do bairro.
 * `basePropertyValue` é carregado entre cenários (o valor do imóvel não muda
 * por cenário, só as premissas de operação/mercado).
 */
export function presetAssumptions(
  kind: Exclude<ScenarioKind, "custom">,
  bairro: BairroItem | undefined,
  sizeKey: keyof BairroItem["avgBySize"] = SIZE_FALLBACK,
  basePropertyValue = 0,
): ScenarioAssumptions {
  const preset = SCENARIO_PRESETS.find((p) => p.kind === kind) ?? SCENARIO_PRESETS[1];
  const baseOccupancy = bairro?.avgOccupancy ?? DEFAULT_OCCUPANCY_PCT;
  const baseAdr = bairro?.avgBySize[sizeKey] ?? DEFAULT_ADR_BRL;
  return {
    occupancyPct: clampPct(round(baseOccupancy + preset.occupancyDeltaPct)),
    adr: round(baseAdr * preset.adrFactor),
    cleaningPerStay: DEFAULT_PROJECTION_COSTS.cleaningPerStay,
    managementPct: DEFAULT_PROJECTION_COSTS.managementPct,
    taxesPct: DEFAULT_PROJECTION_COSTS.taxesPct,
    condoMonthly: DEFAULT_PROJECTION_COSTS.condoMonthly,
    propertyValue: Math.max(0, basePropertyValue),
    avgStayNights: DEFAULT_AVG_STAY_NIGHTS,
  };
}

/**
 * Resumo de KPIs de um cenário (receita líquida anual, cap rate, payback…),
 * usando a mesma engine de projeção do dashboard.
 */
export function scenarioSummary(a: ScenarioAssumptions): ProjectionSummary {
  return projectionSummary({
    occupancyPct: a.occupancyPct,
    adr: a.adr,
    cleaningPerStay: a.cleaningPerStay,
    managementPct: a.managementPct,
    taxesPct: a.taxesPct,
    condoMonthly: a.condoMonthly,
    propertyValue: a.propertyValue,
    avgStayNights: a.avgStayNights,
    months: 12,
    seasonality: DEFAULT_SP_SEASONALITY,
  });
}

/**
 * Delta percentual de `value` em relação à `baseline`.
 * Quando a baseline é 0, devolve 0 (sem variação) ou 100 (do zero a algo).
 */
export function pctDelta(value: number, baseline: number): number {
  if (baseline === 0) return value === 0 ? 0 : 100;
  return ((value - baseline) / Math.abs(baseline)) * 100;
}
