/**
 * Premissas do simulador da home na URL, para compartilhar a mesma conta.
 * Só números e escolhas da simulação — nenhum dado pessoal.
 * Valores fora das faixas do próprio simulador são ignorados (não corrigidos),
 * para que um link editado à mão não mostre uma conta diferente da enviada.
 */
import { slugifyBairro } from "@/lib/seo";

export const OBJETIVOS_SIMULADOR = ["maximizar", "estabilidade", "premium"] as const;
export type ObjetivoSimulador = (typeof OBJETIVOS_SIMULADOR)[number];
export const BOOSTS_SIMULADOR = [0, 10, 20, 30] as const;

/** Faixas aceitas — as mesmas dos controles do SimuladorSection. */
export const FAIXAS_SIMULADOR = {
  metragem: [15, 80],
  ocupacao: [50, 90],
  diaria: [1, 100000],
  reforma: [1, 100000000],
} as const;

export interface PremissasSimulacao {
  /** Slug do bairro (ex.: "vila-mariana"). */
  bairro?: string;
  metragem?: number;
  ocupacao?: number;
  /** Diária informada pela pessoa (opcional), em reais inteiros. */
  diaria?: number;
  objetivo?: ObjetivoSimulador;
  boost?: number;
  /** Orçamento de reforma informado (opcional), em reais inteiros. */
  reforma?: number;
}

const inteiroNaFaixa = (bruto: string | null, [min, max]: readonly [number, number]) => {
  if (bruto == null || !/^\d+$/.test(bruto)) return undefined;
  const n = Number(bruto);
  return n >= min && n <= max ? n : undefined;
};

/** Lê as premissas de uma query string; parâmetros inválidos ficam de fora. */
export function lerPremissas(search: string): PremissasSimulacao {
  const q = new URLSearchParams(search);
  const p: PremissasSimulacao = {};
  const bairro = q.get("bairro");
  if (bairro && slugifyBairro(bairro)) p.bairro = slugifyBairro(bairro);
  const metragem = inteiroNaFaixa(q.get("m"), FAIXAS_SIMULADOR.metragem);
  if (metragem !== undefined) p.metragem = metragem;
  const ocupacao = inteiroNaFaixa(q.get("occ"), FAIXAS_SIMULADOR.ocupacao);
  if (ocupacao !== undefined) p.ocupacao = ocupacao;
  const diaria = inteiroNaFaixa(q.get("diaria"), FAIXAS_SIMULADOR.diaria);
  if (diaria !== undefined) p.diaria = diaria;
  const objetivo = q.get("obj");
  if (objetivo && (OBJETIVOS_SIMULADOR as readonly string[]).includes(objetivo)) p.objetivo = objetivo as ObjetivoSimulador;
  const boost = q.get("boost");
  if (boost && /^\d+$/.test(boost) && (BOOSTS_SIMULADOR as readonly number[]).includes(Number(boost))) p.boost = Number(boost);
  const reforma = inteiroNaFaixa(q.get("reforma"), FAIXAS_SIMULADOR.reforma);
  if (reforma !== undefined) p.reforma = reforma;
  return p;
}

/** Há mais que o bairro na URL? (indica um link de simulação compartilhada) */
export function temPremissasAlemDoBairro(p: PremissasSimulacao) {
  return Object.keys(p).some((k) => k !== "bairro");
}

/** Monta o caminho do simulador com as premissas (sem domínio). */
export function caminhoSimulacao(p: PremissasSimulacao): string {
  const q = new URLSearchParams();
  if (p.bairro) q.set("bairro", slugifyBairro(p.bairro));
  if (p.metragem !== undefined) q.set("m", String(Math.round(p.metragem)));
  if (p.ocupacao !== undefined) q.set("occ", String(Math.round(p.ocupacao)));
  if (p.diaria) q.set("diaria", String(Math.round(p.diaria)));
  if (p.objetivo) q.set("obj", p.objetivo);
  if (p.boost) q.set("boost", String(p.boost));
  if (p.reforma) q.set("reforma", String(Math.round(p.reforma)));
  const qs = q.toString();
  return `/${qs ? `?${qs}` : ""}#simulador`;
}

/** Converte um campo de texto do simulador ("72000", "") em número inteiro ou nada. */
export function campoParaInteiro(v: string): number | undefined {
  if (!/^\d+$/.test(v.trim())) return undefined;
  const n = Number(v.trim());
  return n > 0 ? n : undefined;
}
