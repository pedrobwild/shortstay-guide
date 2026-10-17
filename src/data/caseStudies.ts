// src/data/caseStudies.ts
//
// Prova social contextual: cases reais de studios operados pela Bewild,
// versionados em código (git-reviewable) em vez de inventados em runtime.
//
// ⚠️ REGRA DE INTEGRIDADE
// Só inclua aqui cases REAIS da Bewild. Nunca publique métricas de performance
// (ADR, ocupação, yield) sem base real confirmada.

import type { InvestorProfile } from "@/lib/investorQuiz";

// ── Tipos ────────────────────────────────────────────────────────

/** Região (zona) de São Paulo — agrupamento geográfico factual, não métrica. */
export type CaseRegion =
  | "Zona Oeste"
  | "Zona Sul"
  | "Centro"
  | "Zona Norte"
  | "Zona Leste"
  | "São Paulo";

export interface CaseInvestment {
  imovel: number;
  reforma: number;
  decoracao: number;
}

export interface CaseTimelineStep {
  month: string;
  label: string;
  desc: string;
}

export interface CasePhoto {
  src: string;
  alt: string;
  /** Ex.: "Antes" / "Depois" */
  label?: string;
}

export interface CaseStudy {
  id: string;
  /** Nome do cliente, quando o depoimento é público. */
  cliente?: string;
  bairro: string;
  region: CaseRegion;
  /** Metragem do studio (m²), só quando publicada. */
  metragem?: number;
  investimento?: CaseInvestment;
  investimentoTotal?: number;
  /** Diária (R$) publicada; ver `diariaContexto`. */
  diaria?: number;
  /** Ex.: "no calendário de setembro". */
  diariaContexto?: string;
  /** Ocupação (%) publicada; ver `ocupacaoContexto` (mês, não média anual). */
  ocupacao?: number;
  ocupacaoContexto?: string;
  receitaMensal?: number;
  receitaAnual?: number;
  /** Ex.: "29.1%". */
  yieldBruto?: string;
  paybackMeses?: number;
  /** Marcos qualitativos publicados (ex.: selo do Airbnb). */
  destaques?: string[];
  timeline: CaseTimelineStep[];
  /** Antes/depois — opcional. Só preencher com material real da Bewild. */
  fotos?: CasePhoto[];
  /** Link para o depoimento publicado. */
  depoimentoUrl?: string;
  /** Usado como fallback geral quando não há match de bairro/região. */
  featured?: boolean;
}

// ── Dados ────────────────────────────────────────────────────────

/**
 * Cases reais da Bewild. Só entram números publicados no bewild.com.br;
 * campo sem dado fica vazio e o cartão correspondente não aparece.
 */
export const CASE_STUDIES: CaseStudy[] = [
  // Origem: case publicado no bewild.com.br (depoimento da Vivian). Só estes dados
  // estão publicados; investimento, yield, payback e receita mensal não.
  {
    id: "vila-olimpia-vivian",
    cliente: "Vivian",
    bairro: "Vila Olímpia",
    region: "Zona Sul",
    diaria: 275,
    diariaContexto: "no calendário de setembro",
    ocupacao: 98,
    ocupacaoContexto: "em setembro (mês, não média anual)",
    destaques: ["Preferida dos Hóspedes no Airbnb em menos de 2 meses", "Studio reformado pela Bewild"],
    timeline: [],
    depoimentoUrl: "https://bewild.com.br/videos/depoimento-vivian",
    featured: true,
  },
  // Case Pinheiros (diária R$ 380, ocupação 82%, R$ 9.348/mês, yield 29,1%, payback 7 meses,
  // reforma R$ 32 mil + decoração R$ 28 mil): retirado da lista pública porque os números
  // não têm fonte registrada e contradizem a base do guia.
  // Aguarda fonte documentada para voltar.
];

// ── Mapa de regiões (geografia factual de São Paulo) ─────────────

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/** Bairro (normalizado) → zona. Apenas agrupamento geográfico, sem métricas. */
const BAIRRO_REGIONS: Record<string, CaseRegion> = {
  // Zona Oeste
  "pinheiros": "Zona Oeste",
  "alto de pinheiros": "Zona Oeste",
  "vila madalena": "Zona Oeste",
  "fradique coutinho": "Zona Oeste",
  "faria lima": "Zona Oeste",
  "oscar freire": "Zona Oeste",
  "perdizes": "Zona Oeste",
  "barra funda": "Zona Oeste",
  "palmeiras-barra funda": "Zona Oeste",
  // Centro
  "consolacao": "Centro",
  "bela vista": "Centro",
  "republica": "Centro",
  "se": "Centro",
  "santa cecilia": "Centro",
  "higienopolis": "Centro",
  "trianon-masp": "Centro",
  "brigadeiro": "Centro",
  // Zona Sul
  "itaim bibi": "Zona Sul",
  "jardim paulista": "Zona Sul",
  "moema": "Zona Sul",
  "vila mariana": "Zona Sul",
  "campo belo": "Zona Sul",
  "brooklin": "Zona Sul",
  "vila olimpia": "Zona Sul",
  "eucaliptos": "Zona Sul",
  "saude": "Zona Sul",
  "paraiso": "Zona Sul",
  "ibirapuera": "Zona Sul",
  // Zona Norte
  "santana": "Zona Norte",
  "mandaqui": "Zona Norte",
  // Zona Leste
  "itaquera": "Zona Leste",
  "tatuape": "Zona Leste",
  "mooca": "Zona Leste",
};

export function getRegion(bairro: string): CaseRegion {
  return BAIRRO_REGIONS[normalize(bairro)] ?? "São Paulo";
}

// ── Seleção contextual ───────────────────────────────────────────

export type MatchLevel = "bairro" | "regiao" | "geral";

export interface CaseSelection {
  cases: CaseStudy[];
  matchLevel: MatchLevel;
  /** Bairro do lead usado para o match (ou null). */
  leadBairro: string | null;
  /** Região resolvida do bairro do lead (ou null). */
  region: CaseRegion | null;
}

/**
 * Ordena cases empatados no mesmo nível de match conforme o perfil do investidor:
 * dá peso ao indicador mais relevante para a estratégia dominante do lead.
 */
function makeProfileSorter(profile?: InvestorProfile | null) {
  if (!profile) return () => 0;
  const w = profile.weights;
  const dominant = (Object.keys(w) as (keyof typeof w)[]).reduce(
    (best, key) => (w[key] > w[best] ? key : best),
    "retorno" as keyof typeof w,
  );
  const metric = (c: CaseStudy): number => {
    switch (dominant) {
      case "retorno":
        return parseFloat(c.yieldBruto ?? "") || 0;
      case "demanda":
        return c.ocupacao ?? 0;
      case "operacao":
        return c.paybackMeses != null ? -c.paybackMeses : 0; // payback menor = melhor
      case "futuro":
        return c.receitaAnual ?? 0;
      default:
        return 0;
    }
  };
  return (a: CaseStudy, b: CaseStudy) => metric(b) - metric(a);
}

/**
 * Seleciona e prioriza cases pelo bairro/perfil do lead, com fallback gracioso:
 *   1. `bairro` — cases no mesmo bairro do lead;
 *   2. `regiao` — cases na mesma zona, quando não há case no bairro exato;
 *   3. `geral`  — cases em destaque (featured), quando não há bairro/região.
 */
export function selectCaseStudies(opts: {
  bairro?: string | null;
  profile?: InvestorProfile | null;
  source?: CaseStudy[];
}): CaseSelection {
  const pool = opts.source ?? CASE_STUDIES;
  const leadBairro = opts.bairro?.trim() || null;
  const sortByProfile = makeProfileSorter(opts.profile);

  if (leadBairro && pool.length) {
    const key = normalize(leadBairro);
    const exact = pool.filter((c) => normalize(c.bairro) === key);
    if (exact.length) {
      return { cases: [...exact].sort(sortByProfile), matchLevel: "bairro", leadBairro, region: getRegion(leadBairro) };
    }
    const region = getRegion(leadBairro);
    if (region !== "São Paulo") {
      const near = pool.filter((c) => c.region === region);
      if (near.length) {
        return { cases: [...near].sort(sortByProfile), matchLevel: "regiao", leadBairro, region };
      }
    }
  }

  const featured = pool.filter((c) => c.featured);
  const general = (featured.length ? featured : pool);
  return {
    cases: [...general].sort(sortByProfile),
    matchLevel: "geral",
    leadBairro,
    region: leadBairro ? getRegion(leadBairro) : null,
  };
}
