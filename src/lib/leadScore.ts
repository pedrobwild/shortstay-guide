/**
 * Score de prontidão de fechamento do lead.
 *
 * Transforma os sinais brutos agregados pela RPC `admin_lead_scores`
 * (telemetria de guide_events + premissas de project_assumptions + conta
 * criada) em um score 0–100 e um tier comercial ("quente/morno/frio"),
 * para que o time da BWild ataque primeiro os leads mais quentes.
 *
 * O cálculo vive aqui (e não no SQL) de propósito: é a regra de negócio mais
 * volátil do funil, então fica próxima do produto, coberta por testes e fácil
 * de re-pesar sem migration.
 */

/** Sinais brutos por lead — espelha o retorno de `admin_lead_scores`. */
export interface LeadSignals {
  neighborhood: string | null;
  area_sqm: string | null;
  objective: string | null;
  has_account: boolean;
  project_count: number;
  property_value: number | null;
  max_scroll: number;
  sections_viewed: number;
  simulator_uses: number;
  exported_simulation: boolean;
  quiz_interactions: number;
  chatbot_interactions: number;
  cta_clicks: number;
}

export type LeadTier = "quente" | "morno" | "frio";

export interface ScoreFactor {
  /** chave estável para keys de lista */
  key: string;
  label: string;
  points: number;
  max: number;
}

export interface LeadScore {
  score: number; // 0–100, inteiro
  tier: LeadTier;
  factors: ScoreFactor[];
}

/**
 * Pesos das categorias. Somam exatamente 100 (max teórico). A intenção
 * comercial (conta criada, valor do imóvel informado, simulação feita) pesa
 * mais que o engajamento passivo (scroll, seções lidas).
 */
const WEIGHTS = {
  scrollDepth: 12, // profundidade de leitura
  sections: 8, // seções distintas vistas
  simulator: 15, // usou simulador/mercado
  exported: 5, // copiou/exportou a simulação
  quiz: 7, // alternou persona (quiz)
  chatbot: 6, // interagiu com o chatbot
  cta: 4, // clicou em CTA
  completeness: 8, // preencheu bairro/m²/objetivo (3+3+2)
  account: 10, // criou acesso exclusivo
  project: 5, // criou projeto
  propertyValue: 20, // informou o valor do imóvel
} as const;

const SECTIONS_CAP = 8;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function computeLeadScore(s: LeadSignals): LeadScore {
  const completenessPoints =
    (s.neighborhood ? 3 : 0) + (s.area_sqm ? 3 : 0) + (s.objective ? 2 : 0);

  const factors: ScoreFactor[] = [
    {
      key: "scrollDepth",
      label: "Profundidade de leitura",
      points: Math.round((clamp(s.max_scroll, 0, 100) / 100) * WEIGHTS.scrollDepth),
      max: WEIGHTS.scrollDepth,
    },
    {
      key: "sections",
      label: "Seções exploradas",
      points: Math.round(
        (clamp(s.sections_viewed, 0, SECTIONS_CAP) / SECTIONS_CAP) * WEIGHTS.sections,
      ),
      max: WEIGHTS.sections,
    },
    {
      key: "simulator",
      label: "Usou o simulador",
      points: s.simulator_uses > 0 ? WEIGHTS.simulator : 0,
      max: WEIGHTS.simulator,
    },
    {
      key: "exported",
      label: "Exportou a simulação",
      points: s.exported_simulation ? WEIGHTS.exported : 0,
      max: WEIGHTS.exported,
    },
    {
      key: "quiz",
      label: "Interagiu com o quiz",
      points: s.quiz_interactions > 0 ? WEIGHTS.quiz : 0,
      max: WEIGHTS.quiz,
    },
    {
      key: "chatbot",
      label: "Falou com o assistente",
      points: s.chatbot_interactions > 0 ? WEIGHTS.chatbot : 0,
      max: WEIGHTS.chatbot,
    },
    {
      key: "cta",
      label: "Clicou em CTA",
      points: s.cta_clicks > 0 ? WEIGHTS.cta : 0,
      max: WEIGHTS.cta,
    },
    {
      key: "completeness",
      label: "Dados do imóvel informados",
      points: completenessPoints,
      max: WEIGHTS.completeness,
    },
    {
      key: "account",
      label: "Criou acesso exclusivo",
      points: s.has_account ? WEIGHTS.account : 0,
      max: WEIGHTS.account,
    },
    {
      key: "project",
      label: "Criou projeto",
      points: s.project_count > 0 ? WEIGHTS.project : 0,
      max: WEIGHTS.project,
    },
    {
      key: "propertyValue",
      label: "Informou valor do imóvel",
      points: s.property_value && s.property_value > 0 ? WEIGHTS.propertyValue : 0,
      max: WEIGHTS.propertyValue,
    },
  ];

  const score = clamp(
    factors.reduce((sum, f) => sum + f.points, 0),
    0,
    100,
  );

  return { score, tier: scoreToTier(score), factors };
}

export function scoreToTier(score: number): LeadTier {
  if (score >= 70) return "quente";
  if (score >= 40) return "morno";
  return "frio";
}

export const TIER_META: Record<LeadTier, { label: string; className: string }> = {
  quente: {
    label: "Quente",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  morno: {
    label: "Morno",
    className: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  },
  frio: {
    label: "Frio",
    className: "bg-muted text-muted-foreground border-border",
  },
};
