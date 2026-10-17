/**
 * Premissas da projeção do studio (/projecao): estado do formulário, limites dos
 * campos e o rascunho guardado no navegador (só números e escolhas da simulação,
 * nenhum dado pessoal). Diária e ocupação nulas = usar o número do bairro.
 */
import { DEFAULT_PROJECTION_COSTS } from "@/lib/projectAnalytics";
import type { SizeKey } from "@/data/bairrosCurados";

export const FAIXAS_AREA: SizeKey[] = ["20–25 m²", "26–35 m²", "36–50 m²"];

export interface PremissasProjecao {
  /** Nome do bairro escolhido (null = padrão da tela). */
  bairro: string | null;
  area: SizeKey;
  /** Valor do imóvel em reais (0 = não informado). */
  valorImovel: number;
  /** Diária ajustada pela pessoa; null = diária média do bairro. */
  diaria: number | null;
  /** Ocupação ajustada (pontos percentuais); null = ocupação média do bairro. */
  ocupacao: number | null;
  /** Estadia média em noites. */
  estadia: number;
  limpeza: number;
  gestao: number;
  impostos: number;
  condominio: number;
}

/** Padrões do projeto (DEFAULT_PROJECTION_COSTS + estadia de 3 noites). Hipóteses editáveis. */
export const PREMISSAS_PADRAO: PremissasProjecao = {
  bairro: null,
  area: "26–35 m²",
  valorImovel: 0,
  diaria: null,
  ocupacao: null,
  estadia: 3,
  limpeza: DEFAULT_PROJECTION_COSTS.cleaningPerStay,
  gestao: DEFAULT_PROJECTION_COSTS.managementPct,
  impostos: DEFAULT_PROJECTION_COSTS.taxesPct,
  condominio: DEFAULT_PROJECTION_COSTS.condoMonthly,
};

/** Limites e passos dos campos (−/+). */
export const CAMPOS = {
  diaria: { min: 80, max: 1500, passo: 10 },
  ocupacao: { min: 10, max: 95, passo: 1 },
  limpeza: { min: 0, max: 500, passo: 10 },
  gestao: { min: 0, max: 40, passo: 1 },
  impostos: { min: 0, max: 20, passo: 0.5 },
  condominio: { min: 0, max: 3000, passo: 50 },
  estadia: { min: 1, max: 30, passo: 1 },
  valorImovel: { min: 0, max: 100_000_000, passo: 10_000 },
} as const;

export const CHAVE_PREMISSAS = "bwild:projecao:v2";
/** Cache da versão anterior da tela (custos e valor do imóvel). */
export const CHAVE_LEGADA = "bwild:project-costs:projection";

type Armazenamento = Pick<Storage, "getItem" | "setItem">;

const noLimite = (v: unknown, { min, max }: { min: number; max: number }) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : undefined;

/** Valida um objeto lido do navegador: campos fora do formato ou dos limites voltam ao padrão. */
export function normalizarPremissas(bruto: unknown): PremissasProjecao {
  const o = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>;
  const p = PREMISSAS_PADRAO;
  return {
    bairro: typeof o.bairro === "string" && o.bairro.trim() ? o.bairro : null,
    area: FAIXAS_AREA.includes(o.area as SizeKey) ? (o.area as SizeKey) : p.area,
    valorImovel: noLimite(o.valorImovel, CAMPOS.valorImovel) ?? p.valorImovel,
    diaria: noLimite(o.diaria, CAMPOS.diaria) ?? null,
    ocupacao: noLimite(o.ocupacao, CAMPOS.ocupacao) ?? null,
    estadia: noLimite(o.estadia, CAMPOS.estadia) ?? p.estadia,
    limpeza: noLimite(o.limpeza, CAMPOS.limpeza) ?? p.limpeza,
    gestao: noLimite(o.gestao, CAMPOS.gestao) ?? p.gestao,
    impostos: noLimite(o.impostos, CAMPOS.impostos) ?? p.impostos,
    condominio: noLimite(o.condominio, CAMPOS.condominio) ?? p.condominio,
  };
}

/**
 * Lê o rascunho salvo. Sem a versão atual, aproveita custos e valor do imóvel da
 * versão anterior (a diária antiga não é reaproveitada: ela vinha de outro bairro).
 */
export function lerPremissasSalvas(armazenamento: Armazenamento | null | undefined): PremissasProjecao {
  if (!armazenamento) return PREMISSAS_PADRAO;
  try {
    const atual = armazenamento.getItem(CHAVE_PREMISSAS);
    if (atual) return normalizarPremissas(JSON.parse(atual));
    const legado = armazenamento.getItem(CHAVE_LEGADA);
    if (legado) {
      const l = JSON.parse(legado) as Record<string, unknown>;
      return normalizarPremissas({
        valorImovel: l.propertyValue, limpeza: l.cleaningPerStay, gestao: l.managementPct, impostos: l.taxesPct, condominio: l.condoMonthly,
      });
    }
  } catch { /* rascunho ilegível: segue com os padrões */ }
  return PREMISSAS_PADRAO;
}

export function salvarPremissas(p: PremissasProjecao, armazenamento: Armazenamento | null | undefined) {
  try { armazenamento?.setItem(CHAVE_PREMISSAS, JSON.stringify(p)); } catch { /* navegador sem armazenamento */ }
}

/** Armazenamento do navegador, quando disponível (modo privado pode bloquear). */
export function armazenamentoLocal(): Armazenamento | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}
