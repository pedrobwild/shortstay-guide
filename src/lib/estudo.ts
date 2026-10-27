/**
 * Contas de apresentação do redesign "Estudo aberto" (out/2026). Funções puras:
 * nenhum número novo é criado aqui — tudo sai da base de bairros (radarBase /
 * bairrosCurados), de SAO_PAULO_REFERENCIA, do DRE do guia (dreGuia.ts) ou do
 * estudo de reforma da Bewild (provasBewild.ts). Quartis, classes e posições são
 * calculados sobre os números exibidos, para bater com o que se lê na tela.
 */
import { receitaMensalReferencia, type BairroCurado } from "@/data/bairrosCurados";
import {
  CUSTO_M2_MEDIANO, CUSTO_M2_P25, CUSTO_M2_P75, ORCAMENTO_MINIMO_BASE, PRAZO_DIAS_UTEIS,
} from "@/data/provasBewild";
import { naturezaBairro, ordenarRanking, type CriterioRanking } from "@/lib/radarUi";

/** De que universo vem o número de receita: aparece antes do aviso de custos, junto de todo número. */
export const AVISO_UNIVERSO = "Médias de todos os tipos de anúncio do bairro na fonte, não a receita de um studio específico.";

/** Aviso que acompanha toda tela com número de receita (direcionamento, seção 6). */
export const AVISO_RECEITA = "Receita de referência e simulações não incluem todos os custos e não são garantia de resultado.";

/** Receita de referência: R = d × 30 × o (o em fração). */
export const TEXTO_FORMULA_RECEITA = "Receita de referência = diária média × 30 × ocupação média, antes de custos.";

/** Limite de amostra pequena: fonte pública com menos de 200 anúncios. */
export const LIMITE_AMOSTRA_PEQUENA = 200;

type Base = Pick<BairroCurado, "name" | "dailyAvg" | "avgOccupancy" | "activeListings" | "ocupacaoFonte">;

/** Amostra pequena só vale para dado observado do próprio bairro (Mooca, Bom Retiro, Lapa hoje). */
export function temAmostraPequena(b: Base): boolean {
  return naturezaBairro(b) === "observado" && b.activeListings != null && b.activeListings < LIMITE_AMOSTRA_PEQUENA;
}

/**
 * Nome com a natureza do dado entre parênteses, para títulos e frases calculadas:
 * "Bom Retiro (amostra pequena)", "Brooklin (aproximação)", "Pinheiros".
 */
export function nomeComNatureza(b: Base): string {
  const n = naturezaBairro(b);
  if (n === "aproximacao") return `${b.name} (aproximação)`;
  if (n === "estimativa") return `${b.name} (estimativa)`;
  return temAmostraPequena(b) ? `${b.name} (amostra pequena)` : b.name;
}

/** Os nomes de uma lista com a natureza de cada um, procurados na base exibida. */
export function nomesComNatureza(nomes: string[], bairros: Base[]): string[] {
  return nomes.map((n) => { const b = bairros.find((x) => x.name === n); return b ? nomeComNatureza(b) : n; });
}

export const receitaDe = (b: Pick<BairroCurado, "dailyAvg" | "avgOccupancy">) => receitaMensalReferencia(b);

/* ─── Metadados da base (fonte, período, coleta, n) ─── */

const dataBR = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

/**
 * Data de coleta mais comum entre os bairros e as exceções com os nomes
 * ("18/10/2026", exceções: 13/10/2026 → Moema). Datas vêm da base exibida.
 */
export function resumoColetas(bairros: { name: string; coletadoEm?: string | null }[]) {
  const porData = new Map<string, string[]>();
  for (const b of bairros) {
    if (!b.coletadoEm) continue;
    const d = b.coletadoEm.slice(0, 10);
    porData.set(d, [...(porData.get(d) ?? []), b.name]);
  }
  const ord = [...porData.entries()].sort((a, b) => b[1].length - a[1].length || b[0].localeCompare(a[0]));
  if (!ord.length) return null;
  return {
    principal: dataBR(ord[0][0]),
    excecoes: ord.slice(1).map(([d, nomes]) => ({ data: dataBR(d), nomes: nomes.sort((a, b) => a.localeCompare(b, "pt-BR")) })),
  };
}

/** Período mais comum entre os bairros (ex.: "jan–set/2026"). */
export function periodoPrincipal(bairros: { period?: string | null }[]): string | null {
  const cont = new Map<string, number>();
  for (const b of bairros) if (b.period) cont.set(b.period, (cont.get(b.period) ?? 0) + 1);
  return [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/* ─── Histograma de pontos (Mercado, Fig. 1) ─── */

export interface ClasseHistograma<T> { inicio: number; fim: number; itens: { bairro: T; receita: number }[] }

/**
 * Classes de largura fixa (R$ 500 por padrão) da receita de referência, do menor ao maior
 * valor. Dentro da classe, os bairros sobem em ordem de receita (o maior fica no topo).
 */
export function classesHistograma<T extends Base>(bairros: T[], largura = 500): ClasseHistograma<T>[] {
  if (!bairros.length) return [];
  const comReceita = bairros.map((bairro) => ({ bairro, receita: receitaDe(bairro) }));
  const min = Math.floor(Math.min(...comReceita.map((x) => x.receita)) / largura) * largura;
  const max = Math.floor(Math.max(...comReceita.map((x) => x.receita)) / largura) * largura;
  const classes: ClasseHistograma<T>[] = [];
  for (let inicio = min; inicio <= max; inicio += largura) {
    const itens = comReceita
      .filter((x) => x.receita >= inicio && x.receita < inicio + largura)
      .sort((a, b) => a.receita - b.receita || a.bairro.name.localeCompare(b.bairro.name, "pt-BR"));
    classes.push({ inicio, fim: inicio + largura, itens });
  }
  return classes;
}

/** Quantos bairros ficam abaixo, iguais ou acima de um valor de referência (ex.: receita de SP). */
export function contagemContra<T>(itens: T[], valor: (x: T) => number, referencia: number) {
  let abaixo = 0, acima = 0, iguais = 0;
  for (const x of itens) {
    const v = valor(x);
    if (v < referencia) abaixo++;
    else if (v > referencia) acima++;
    else iguais++;
  }
  return { abaixo, acima, iguais, total: itens.length };
}

/** Menor e maior valor de um campo, com os nomes (para "ocupação entre 65% e 54%"). */
export function extremos<T extends Base>(bairros: T[], valor: (b: T) => number) {
  if (!bairros.length) return null;
  const ord = [...bairros].sort((a, b) => valor(a) - valor(b) || a.name.localeCompare(b.name, "pt-BR"));
  const menor = ord[0], maior = ord[ord.length - 1];
  return {
    min: valor(menor), max: valor(maior),
    nomesMin: ord.filter((b) => valor(b) === valor(menor)).map((b) => b.name),
    nomesMax: ord.filter((b) => valor(b) === valor(maior)).map((b) => b.name),
  };
}

/** Classe de R$ 500 que concentra mais bairros (para o título-achado do histograma). */
export function classeModal<T>(classes: ClasseHistograma<T>[]) {
  return classes.reduce<ClasseHistograma<T> | null>((m, c) => (!m || c.itens.length > m.itens.length ? c : m), null);
}

/* ─── Posição e quartis ─── */

/** Posição do bairro entre todos pelo critério (1 = maior). Empates ficam na ordem alfabética. */
export function posicaoEntre<T extends BairroCurado>(bairros: T[], nome: string, criterio: CriterioRanking) {
  const ord = ordenarRanking(bairros, criterio);
  const i = ord.findIndex((x) => x.bairro.name === nome);
  return i < 0 ? null : { posicao: i + 1, total: ord.length };
}

/** Quartil por interpolação linear (método 7, o mesmo das planilhas). */
export function quantil(valores: number[], p: number): number {
  const v = [...valores].sort((a, b) => a - b);
  if (!v.length) return NaN;
  const h = (v.length - 1) * p;
  const lo = Math.floor(h), hi = Math.ceil(h);
  return v[lo] + (v[hi] - v[lo]) * (h - lo);
}

/** Limites das 4 classes por quartil (P25, mediana, P75) de um conjunto de valores. */
export function limitesQuartis(valores: number[]): [number, number, number] {
  return [quantil(valores, 0.25), quantil(valores, 0.5), quantil(valores, 0.75)];
}

/** Classe 1–4 de um valor: até o P25, até a mediana, até o P75, acima do P75. */
export function classeQuartil(valor: number, limites: [number, number, number]): 1 | 2 | 3 | 4 {
  if (valor <= limites[0]) return 1;
  if (valor <= limites[1]) return 2;
  if (valor <= limites[2]) return 3;
  return 4;
}

/** Diferença percentual contra uma referência, arredondada ao inteiro (ex.: +18 = 18% acima de SP). */
export const difPercentual = (valor: number, referencia: number) => Math.round((valor / referencia - 1) * 100);

/* ─── Perfil 03 · Já opero: o studio em operação contra o bairro ─── */

export type FaixaQuartil = "abaixo-p25" | "p25-mediana" | "mediana-p75" | "acima-p75";

export const TEXTO_FAIXA_QUARTIL: Record<FaixaQuartil, string> = {
  "abaixo-p25": "abaixo do P25 (entre os 25% mais baratos)",
  "p25-mediana": "entre o P25 e a mediana",
  "mediana-p75": "entre a mediana e o P75",
  "acima-p75": "acima do P75 (entre os 25% mais caros)",
};

/** Onde uma diária cai nos quartis publicados do bairro (null sem quartis). */
export function faixaNosQuartis(diaria: number, quartis: [number, number, number] | null): FaixaQuartil | null {
  if (!quartis) return null;
  if (diaria < quartis[0]) return "abaixo-p25";
  if (diaria < quartis[1]) return "p25-mediana";
  if (diaria <= quartis[2]) return "mediana-p75";
  return "acima-p75";
}

/**
 * Compara o studio em operação (diária e ocupação informadas pela pessoa) com o bairro:
 * receita de referência dos dois pela mesma fórmula, diferença em reais, ocupação em
 * pontos percentuais e a faixa da diária nos quartis. Nada é estimado além disso.
 */
export function compararOperacao(meu: { diaria: number; ocupacaoPct: number }, bairro: Pick<BairroCurado, "dailyAvg" | "avgOccupancy" | "dailyQuartiles">) {
  const receitaMinha = receitaDe({ dailyAvg: meu.diaria, avgOccupancy: meu.ocupacaoPct });
  const receitaBairro = receitaDe(bairro);
  return {
    receitaMinha,
    receitaBairro,
    difReceita: receitaMinha - receitaBairro,
    difOcupacaoPP: Math.round((meu.ocupacaoPct - bairro.avgOccupancy) * 10) / 10,
    difDiaria: Math.round(meu.diaria - bairro.dailyAvg),
    faixaDiaria: faixaNosQuartis(meu.diaria, bairro.dailyQuartiles),
  };
}

/* ─── Perfil 02 · Vou reformar: estimativa por área (estudo Bewild, 188 contratos) ─── */

/** Prazo em contrato pela metragem e sacada (até 30 m² ou de 31 a 40 m²; acima de 40 m², o maior prazo). */
export function prazoContrato(areaM2: number, comSacada: boolean): number {
  if (areaM2 <= 30) return comSacada ? PRAZO_DIAS_UTEIS.ate30ComSacada : PRAZO_DIAS_UTEIS.ate30SemSacada;
  return comSacada ? PRAZO_DIAS_UTEIS.de31a40ComSacada : PRAZO_DIAS_UTEIS.de31a40SemSacada;
}

/**
 * Faixa de reforma por área: área × R$/m² do estudo (P25, mediana, P75). Nenhum contrato
 * do estudo ficou abaixo de R$ 55 mil, então valores menores sobem para o piso (`noPiso`).
 * Arredondado a R$ 500, como a sugestão do simulador.
 */
export function estimativaReforma(areaM2: number) {
  const valor = (m2: number) => {
    const bruto = Math.round((areaM2 * m2) / 500) * 500;
    return { valor: Math.max(bruto, ORCAMENTO_MINIMO_BASE), noPiso: bruto < ORCAMENTO_MINIMO_BASE };
  };
  return { p25: valor(CUSTO_M2_P25), mediana: valor(CUSTO_M2_MEDIANO), p75: valor(CUSTO_M2_P75), piso: ORCAMENTO_MINIMO_BASE };
}
