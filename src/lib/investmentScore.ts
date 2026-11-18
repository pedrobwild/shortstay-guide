import { formatDecimal } from "@/lib/numberFormat";
/**
 * ═══════════════════════════════════════════════════════════════
 * INVESTMENT SCORE — Motor central do produto
 * Fase 4: Score unificado de decisão de investimento
 * ═══════════════════════════════════════════════════════════════
 *
 * Fórmula:
 *   Investment Score =
 *     0.35 × Retorno (Yield Airbnb normalizado) +
 *     0.25 × Demanda (Liquidez normalizado) +
 *     0.20 × Operação (Ocupação normalizado) +
 *     0.20 × Futuro (Crescimento normalizado)
 *
 * Todos os pilares normalizados de 0 a 100 usando min-max
 * dentro da amostra disponível.
 * ═══════════════════════════════════════════════════════════════
 */

import type { BairroAirbnb } from "@/types/intelligence";

// ── True Yield ───────────────────────────────────────────────────
// ADR × Occupancy × 365 / Property Price
// A more direct estimate of annual return based on actual operating metrics.

export interface TrueYieldResult {
  trueYield: number;
  annualRevenue: number;
  propertyPrice: number;
  comparison: string;
  delta: number; // trueYield - yieldBrutoAirbnb
}

export function calculateTrueYield(b: BairroAirbnb): TrueYieldResult {
  const adr = Number(b.adr_medio_studio);
  const occ = Number(b.ocupacao_media_studio);
  const precoM2 = Number(b.preco_m2_residencial_medio);
  const area = Number(b.area_media_estudio);
  const propertyPrice = precoM2 * area;
  const annualRevenue = adr * occ * 365;
  const trueYield = propertyPrice > 0 ? annualRevenue / propertyPrice : 0;
  const yieldBruto = Number(b.yield_bruto_airbnb);
  const delta = trueYield - yieldBruto;

  let comparison: string;
  if (Math.abs(delta) < 0.005) {
    comparison = "O True Yield está alinhado com o Yield Airbnb da plataforma, sugerindo consistência nos dados.";
  } else if (delta > 0) {
    comparison = `O True Yield é ${formatDecimal((delta * 100), 1)}pp acima do Yield Airbnb reportado. Isso pode indicar que o imóvel tem potencial de retorno maior do que o estimado pela plataforma.`;
  } else {
    comparison = `O True Yield é ${formatDecimal((Math.abs(delta) * 100), 1)}pp abaixo do Yield Airbnb reportado. Diferenças em sazonalidade, vacância real ou taxas podem explicar essa diferença.`;
  }

  return { trueYield, annualRevenue, propertyPrice, comparison, delta };
}

// ── Pillar definitions ───────────────────────────────────────────

export interface ScorePillar {
  key: string;
  label: string;
  friendlyName: string;
  weight: number;
  description: string;
  icon: string;
  color: string; // tailwind text color
}

export const PILLARS: ScorePillar[] = [
  {
    key: "retorno",
    label: "Retorno",
    friendlyName: "Yield Airbnb",
    weight: 0.35,
    description: "Quanto o imóvel pode render por ano no Airbnb em relação ao capital investido.",
    icon: "TrendingUp",
    color: "text-emerald-600",
  },
  {
    key: "demanda",
    label: "Demanda",
    friendlyName: "Liquidez",
    weight: 0.25,
    description: "Facilidade de manter reservas constantes e gerar fluxo de caixa previsível.",
    icon: "Zap",
    color: "text-blue-600",
  },
  {
    key: "operacao",
    label: "Operação",
    friendlyName: "Ocupação",
    weight: 0.20,
    description: "Percentual de dias em que o imóvel fica efetivamente alugado.",
    icon: "CalendarCheck",
    color: "text-violet-600",
  },
  {
    key: "futuro",
    label: "Futuro",
    friendlyName: "Crescimento",
    weight: 0.20,
    description: "Sinais de valorização e expansão futura da demanda no bairro.",
    icon: "Sprout",
    color: "text-amber-600",
  },
];

// ── Normalization helper (min-max to 0-100) ──────────────────────

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

// ── Core calculation ─────────────────────────────────────────────

export interface InvestmentScoreResult {
  score: number;
  rawScore: number;
  confidenceFactor: number;
  liquidityRiskFactor: number;
  pillars: {
    key: string;
    raw: number;
    normalized: number;
    weighted: number;
  }[];
  grade: string;
  gradeLabel: string;
  gradeColor: string;
  narrative: string;
}

// ── Risk adjustment helpers ──────────────────────────────────────

function getConfidenceFactor(nivel: string): number {
  const lower = nivel.toLowerCase();
  // Support both accented ("médio") and unaccented ("medio") variants
  if (lower === "alto") return 1.0;
  if (lower === "médio" || lower === "medio") return 0.93;
  if (lower === "baixo") return 0.85;
  return 0.93;
}

function getLiquidityRiskFactor(rawScoreLiquidez: number): number {
  // Use absolute raw score_liquidez (0-100 scale)
  if (rawScoreLiquidez < 50) return 0.90;
  if (rawScoreLiquidez < 60) return 0.95;
  return 1.0;
}

export function calculateInvestmentScore(
  bairro: BairroAirbnb,
  allBairros: BairroAirbnb[]
): InvestmentScoreResult {
  const yields = allBairros.map(b => Number(b.yield_bruto_airbnb));
  const liquidities = allBairros.map(b => Number(b.score_liquidez));
  const occupancies = allBairros.map(b => Number(b.ocupacao_media_studio));
  const growths = allBairros.map(b => Number(b.score_crescimento_potencial));

  const minMax = (arr: number[]) => ({ min: Math.min(...arr), max: Math.max(...arr) });

  const yieldBounds = minMax(yields);
  const liqBounds = minMax(liquidities);
  const occBounds = minMax(occupancies);
  const growBounds = minMax(growths);

  const rawValues = {
    retorno: Number(bairro.yield_bruto_airbnb),
    demanda: Number(bairro.score_liquidez),
    operacao: Number(bairro.ocupacao_media_studio),
    futuro: Number(bairro.score_crescimento_potencial),
  };

  const normalized = {
    retorno: normalize(rawValues.retorno, yieldBounds.min, yieldBounds.max),
    demanda: normalize(rawValues.demanda, liqBounds.min, liqBounds.max),
    operacao: normalize(rawValues.operacao, occBounds.min, occBounds.max),
    futuro: normalize(rawValues.futuro, growBounds.min, growBounds.max),
  };

  const weighted = {
    retorno: normalized.retorno * 0.35,
    demanda: normalized.demanda * 0.25,
    operacao: normalized.operacao * 0.20,
    futuro: normalized.futuro * 0.20,
  };

  const rawScore = weighted.retorno + weighted.demanda + weighted.operacao + weighted.futuro;

  // Risk adjustments — use RAW score_liquidez, not normalized
  const confidenceFactor = getConfidenceFactor(bairro.nivel_confianca_dados);
  const liquidityRiskFactor = getLiquidityRiskFactor(rawValues.demanda);
  const score = Math.max(0, Math.min(100, rawScore * confidenceFactor * liquidityRiskFactor));

  const { grade, gradeColor, gradeLabel } = getGrade(score);

  const pillars = PILLARS.map(p => ({
    key: p.key,
    raw: rawValues[p.key as keyof typeof rawValues],
    normalized: normalized[p.key as keyof typeof normalized],
    weighted: weighted[p.key as keyof typeof weighted],
  }));

  const narrative = buildScoreNarrative(bairro.bairro, score, rawScore, normalized, grade, confidenceFactor, liquidityRiskFactor);

  return { score, rawScore, confidenceFactor, liquidityRiskFactor, pillars, grade, gradeLabel, gradeColor, narrative };
}

// ── Grade system ─────────────────────────────────────────────────

function getGrade(score: number): { grade: string; gradeColor: string; gradeLabel: string } {
  if (score >= 90) return { grade: "A+", gradeColor: "text-emerald-600", gradeLabel: "Excelente investimento" };
  if (score >= 80) return { grade: "A", gradeColor: "text-emerald-600", gradeLabel: "Muito bom" };
  if (score >= 70) return { grade: "B", gradeColor: "text-blue-600", gradeLabel: "Bom" };
  if (score >= 60) return { grade: "C", gradeColor: "text-amber-600", gradeLabel: "Moderado" };
  return { grade: "D", gradeColor: "text-red-600", gradeLabel: "Arriscado" };
}

export function getGradeExplanation(grade: string): string {
  const map: Record<string, string> = {
    "A+": "Excelente investimento. Equilíbrio excepcional entre retorno, demanda, operação e futuro, com dados confiáveis.",
    A: "Muito bom. Forte em quase todos os pilares, com risco controlado e dados robustos.",
    B: "Bom posicionamento geral, com pontos fortes que se destacam. Opção consistente.",
    C: "Moderado. Pode ser atrativo dependendo do perfil do investidor, mas exige atenção a riscos.",
    D: "Arriscado. Fragilidades em múltiplos pilares ou dados de baixa confiança. Cautela recomendada.",
  };
  return map[grade] || "";
}

// ── Narrative builder ────────────────────────────────────────────

function buildScoreNarrative(
  bairro: string,
  score: number,
  rawScore: number,
  normalized: Record<string, number>,
  grade: string,
  confidenceFactor: number,
  liquidityRiskFactor: number,
): string {
  const strongest = Object.entries(normalized).reduce((a, b) => a[1] > b[1] ? a : b);
  const weakest = Object.entries(normalized).reduce((a, b) => a[1] < b[1] ? a : b);

  const pillarNames: Record<string, string> = {
    retorno: "retorno",
    demanda: "demanda",
    operacao: "operação",
    futuro: "potencial futuro",
  };

  let riskNote = "";
  if (confidenceFactor < 1) riskNote += ` O score foi ajustado em ${formatDecimal(((1 - confidenceFactor) * 100), 0)}% pela qualidade dos dados.`;
  if (liquidityRiskFactor < 1) riskNote += ` Penalidade de ${formatDecimal(((1 - liquidityRiskFactor) * 100), 0)}% por liquidez abaixo do ideal.`;

  if (grade === "A+" || grade === "A") {
    return `${bairro} alcança nota ${grade} (${formatDecimal(score, 1)}), destacando-se em ${pillarNames[strongest[0]]}. É um dos bairros mais completos para investimento em short stay.${riskNote}`;
  }
  if (grade === "B") {
    return `${bairro} tem nota ${grade} (${formatDecimal(score, 1)}), com destaque em ${pillarNames[strongest[0]]}. Consistente, embora ${pillarNames[weakest[0]]} mereça atenção.${riskNote}`;
  }
  return `${bairro} recebe nota ${grade} (${formatDecimal(score, 1)}). Ponto forte: ${pillarNames[strongest[0]]}. Ponto fraco: ${pillarNames[weakest[0]]}.${riskNote}`;
}

// ── Grupos do score ──────────────────────────────────────────────

/**
 * A nota do score é relativa aos bairros da tabela (min–max) e a ordem muda com
 * pequenas mudanças de peso (auditoria de 16/11/2026: com ±10 pontos nos pesos, o
 * primeiro lugar alterna entre quatro bairros). Por isso as telas públicas mostram
 * o score em três grupos, nunca posição nem nota com casa decimal (decisão do Pedro).
 */
export type GrupoScore = "frente" | "meio" | "fim";

export const ROTULO_GRUPO_SCORE: Record<GrupoScore, string> = {
  frente: "Grupo da frente",
  meio: "Grupo do meio",
  fim: "Grupo do fim",
};

export const ORDEM_GRUPO_SCORE: GrupoScore[] = ["frente", "meio", "fim"];

/**
 * Divide os bairros em três grupos de tamanho parecido pela nota (o primeiro grupo
 * fica com a sobra). Empates na fronteira ficam no mesmo grupo, o de cima.
 */
export function gruposDoScore(notas: { bairro: string; score: number }[]): Map<string, GrupoScore> {
  const ordenados = [...notas].sort((a, b) => b.score - a.score || a.bairro.localeCompare(b.bairro, "pt-BR"));
  const n = ordenados.length;
  const fimFrente = Math.ceil(n / 3);
  const fimMeio = fimFrente + Math.ceil((n - fimFrente) / 2);
  const saida = new Map<string, GrupoScore>();
  ordenados.forEach((item, i) => {
    let grupo: GrupoScore = i < fimFrente ? "frente" : i < fimMeio ? "meio" : "fim";
    const anterior = ordenados[i - 1];
    if (anterior && anterior.score === item.score) grupo = saida.get(anterior.bairro) ?? grupo;
    saida.set(item.bairro, grupo);
  });
  return saida;
}

/**
 * Pilares em faixas (decisão do Pedro, 18/11/2026): a nota de cada pilar também é relativa
 * aos bairros da estimativa, então aparece como alta, média ou baixa, pela mesma divisão em
 * três grupos do score. Em todos os pilares, nota maior é melhor.
 */
export const ROTULO_FAIXA_PILAR: Record<GrupoScore, string> = { frente: "Alta", meio: "Média", fim: "Baixa" };

export function faixasDoPilar(valores: { bairro: string; valor: number }[]): Map<string, GrupoScore> {
  return gruposDoScore(valores.map((v) => ({ bairro: v.bairro, score: Number(v.valor) || 0 })));
}

// ── Batch calculation for rankings ───────────────────────────────

export interface BairroWithScore {
  bairro: BairroAirbnb;
  investmentScore: InvestmentScoreResult;
}

export function calculateAllScores(bairros: BairroAirbnb[]): BairroWithScore[] {
  return bairros
    .map(b => ({
      bairro: b,
      investmentScore: calculateInvestmentScore(b, bairros),
    }))
    .sort((a, b) => b.investmentScore.score - a.investmentScore.score);
}
