/**
 * Comparativo "fazer sozinho (DIY) vs. reformar/operar com a BWild".
 *
 * Biblioteca pura (sem React/Supabase) que projeta dois cenários do MESMO studio
 * a partir das premissas de mercado do bairro (`src/data/guide-data.ts` /
 * `districtMetrics.ts`) e devolve KPIs comparáveis + o delta de receita/ROI.
 *
 * Reaproveita o motor de projeção de `projectAnalytics.ts` (mesmos eventos
 * sintéticos consumidos pelo dashboard de projeção), garantindo consistência
 * de números entre o dashboard e este comparativo.
 */

import {
  generateProjectionEvents,
  computeKpis,
  investmentReturn,
  DEFAULT_ADR_BRL,
  DEFAULT_SP_SEASONALITY,
} from "./projectAnalytics";

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  MULTIPLICADORES — CONSTANTE ÚNICA E DOCUMENTADA
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Premissa central: a base de mercado (`avgBySize` para ADR e `avgOccupancy`
 * por bairro, fonte "Bwild/AirDNA 2025" em `districtMetrics.ts`) representa um
 * studio mobiliado MEDIANO, anunciado de forma razoável. A partir dela:
 *
 *  • DIY (fazer sozinho, sem reforma/decoração profissional) tende a ficar
 *    ABAIXO da média de mercado, porque:
 *      - ADR: acabamento e decoração amadores + fotos fracas não sustentam o
 *        topo da faixa de diária → fator 0.92× sobre a base.
 *        (Espelha a lógica de `DECORATION_LEVELS` em guide-data.ts, onde o nível
 *         "básico" = 1.0 e os níveis profissionais "premium"/"alto" valem
 *         1.2× / 1.45×; aqui descontamos levemente abaixo do "básico".)
 *      - Ocupação: sem precificação dinâmica, distribuição multicanal nem
 *        resposta rápida, a ocupação fica ~15% abaixo da média → fator 0.85×.
 *      - Gestão: auto-gestão, sem taxa de gestão (0%).
 *
 *  • BWild (reforma + decoração de alto padrão + operação profissional) tende a
 *    ficar ACIMA da média de mercado, porque:
 *      - ADR: design profissional sustenta diária premium → fator 1.18×.
 *        (Conservador frente ao multiplicador "alto padrão" de 1.45× de
 *         `DECORATION_LEVELS`; ficamos perto do nível "premium" de 1.2×.)
 *      - Ocupação: revenue management + multicanal + resposta < 1h elevam a
 *        ocupação acima da média → fator 1.06×, com TETO de 92% (saturação
 *        prática de short stay; é raro sustentar ocupação anual acima disso).
 *      - Gestão: taxa de gestão profissional de 18% (mesmo default já usado em
 *        DEFAULT_COSTS.managementPct no dashboard). Esse custo é incluído DE
 *        PROPÓSITO no cenário BWild para que o delta de receita LÍQUIDA seja
 *        honesto — já abatida a remuneração da BWild.
 *
 * Ajuste estes números em UM lugar só caso novos cases/dados de mercado mudem
 * as premissas. Não espalhe multiplicadores pela UI.
 */
export const BWILD_VS_DIY_ASSUMPTIONS = {
  /** Teto de ocupação anual realista para short stay (saturação prática). */
  occupancyCapPct: 92,
  diy: {
    label: "Fazer sozinho",
    occupancyMultiplier: 0.85,
    adrMultiplier: 0.92,
    managementPct: 0,
  },
  bwild: {
    label: "Com a BWild",
    occupancyMultiplier: 1.06,
    adrMultiplier: 1.18,
    managementPct: 18,
  },
} as const;

/** Custos operacionais compartilhados pelos dois cenários (iguais para ambos). */
export interface SharedCosts {
  cleaningPerStay: number; // BRL por reserva
  taxesPct: number;        // 0-100 sobre receita bruta
  condoMonthly: number;    // BRL por mês
}

export const DEFAULT_SHARED_COSTS: SharedCosts = {
  cleaningPerStay: 120,
  taxesPct: 6,
  condoMonthly: 500,
};

export interface ScenarioInput {
  adr: number;             // diária bruta do cenário
  occupancyPct: number;    // ocupação alvo do cenário (0-100)
  managementPct: number;   // taxa de gestão (0-100)
  propertyValue: number;   // valor do imóvel (para cap rate / payback)
  shared: SharedCosts;
}

export interface ScenarioResult {
  label: string;
  adr: number;
  occupancyPct: number;       // ocupação anual efetiva (realizada no calendário sintético)
  bookedNights: number;       // noites reservadas no ano
  grossRevenueBrl: number;    // receita bruta anual (12 meses)
  netRevenueBrl: number;      // receita líquida anual (12 meses)
  netMarginPct: number;       // margem líquida
  managementPct: number;
  capRatePct: number;         // yield líquido sobre o valor do imóvel
  paybackYears: number | null;
}

export interface ComparisonDelta {
  occupancyPctPoints: number;     // ocupação adicional (pp) BWild − DIY
  adrBrl: number;                 // diária adicional
  grossRevenueBrl: number;        // receita bruta anual incremental
  netRevenueBrl: number;          // receita LÍQUIDA anual incremental (o número de fechamento)
  netRevenueUpliftPct: number;    // % de aumento da líquida vs DIY
  paybackYearsShorter: number | null; // quantos anos a menos de payback (positivo = melhor)
}

export interface BwildVsDiyComparison {
  diy: ScenarioResult;
  bwild: ScenarioResult;
  delta: ComparisonDelta;
}

/** Projeta um cenário (12 meses) reaproveitando o motor de `projectAnalytics`. */
function computeScenario(label: string, input: ScenarioInput): ScenarioResult {
  const events = generateProjectionEvents({
    occupancyPct: input.occupancyPct,
    avgStayNights: 3,
    months: 12,
    seasonality: DEFAULT_SP_SEASONALITY,
  });
  const kpis = computeKpis(events, input.adr);

  const gross = kpis.estimatedRevenueBrl;
  const cleaningTotal = input.shared.cleaningPerStay * kpis.reservationsCount;
  const managementTotal = gross * (input.managementPct / 100);
  const taxesTotal = gross * (input.shared.taxesPct / 100);
  const condoTotal = input.shared.condoMonthly * 12;
  const net = gross - cleaningTotal - managementTotal - taxesTotal - condoTotal;

  const ret = investmentReturn({
    propertyValueBrl: input.propertyValue,
    observedGrossBrl: gross,
    observedNetBrl: net,
    monthsObserved: 12,
  });

  return {
    label,
    adr: input.adr,
    occupancyPct: kpis.occupancyPct,
    bookedNights: kpis.bookedNights,
    grossRevenueBrl: gross,
    netRevenueBrl: net,
    netMarginPct: gross > 0 ? (net / gross) * 100 : 0,
    managementPct: input.managementPct,
    capRatePct: ret.capRatePct,
    paybackYears: ret.paybackYears,
  };
}

/**
 * Constrói os dois cenários (DIY vs BWild) a partir da base de mercado do
 * bairro/faixa de área e do valor do imóvel, aplicando os multiplicadores
 * centralizados em `BWILD_VS_DIY_ASSUMPTIONS`.
 */
export function buildBwildVsDiyComparison(params: {
  baseAdr: number;            // ADR de mercado do bairro/faixa (ex.: avgBySize)
  baseOccupancyPct: number;   // ocupação média do bairro (ex.: avgOccupancy)
  propertyValue?: number;
  shared?: SharedCosts;
}): BwildVsDiyComparison {
  const baseAdr = params.baseAdr > 0 ? params.baseAdr : DEFAULT_ADR_BRL;
  const baseOcc = Math.min(100, Math.max(0, params.baseOccupancyPct));
  const propertyValue = Math.max(0, params.propertyValue ?? 0);
  const shared = params.shared ?? DEFAULT_SHARED_COSTS;
  const { diy, bwild, occupancyCapPct } = BWILD_VS_DIY_ASSUMPTIONS;

  const diyResult = computeScenario(diy.label, {
    adr: Math.round(baseAdr * diy.adrMultiplier),
    occupancyPct: Math.min(occupancyCapPct, baseOcc * diy.occupancyMultiplier),
    managementPct: diy.managementPct,
    propertyValue,
    shared,
  });

  const bwildResult = computeScenario(bwild.label, {
    adr: Math.round(baseAdr * bwild.adrMultiplier),
    occupancyPct: Math.min(occupancyCapPct, baseOcc * bwild.occupancyMultiplier),
    managementPct: bwild.managementPct,
    propertyValue,
    shared,
  });

  const netUplift = diyResult.netRevenueBrl > 0
    ? ((bwildResult.netRevenueBrl - diyResult.netRevenueBrl) / diyResult.netRevenueBrl) * 100
    : bwildResult.netRevenueBrl > 0 ? 100 : 0;

  const paybackShorter =
    diyResult.paybackYears !== null && bwildResult.paybackYears !== null
      ? diyResult.paybackYears - bwildResult.paybackYears
      : null;

  return {
    diy: diyResult,
    bwild: bwildResult,
    delta: {
      occupancyPctPoints: bwildResult.occupancyPct - diyResult.occupancyPct,
      adrBrl: bwildResult.adr - diyResult.adr,
      grossRevenueBrl: bwildResult.grossRevenueBrl - diyResult.grossRevenueBrl,
      netRevenueBrl: bwildResult.netRevenueBrl - diyResult.netRevenueBrl,
      netRevenueUpliftPct: netUplift,
      paybackYearsShorter: paybackShorter,
    },
  };
}
