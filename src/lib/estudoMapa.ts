/**
 * Contas de apresentação do Mapa (/mapa) e do Comparar (/comparar) no redesign
 * "Estudo aberto" (out/2026). Funções puras: nenhum número de mercado é criado
 * aqui. Coordenadas vêm de bairrosGeo.ts (só geografia); diária, ocupação,
 * amostra e quartis vêm da base exibida; classes por quartil saem de estudo.ts.
 */
import type { BairroCurado } from "@/data/bairrosCurados";
import { geoBairro, type LadoRotulo } from "@/data/bairrosGeo";
import { classeQuartil, limitesQuartis, receitaDe } from "@/lib/estudo";
import { formatDecimal } from "@/lib/numberFormat";
import { naturezaBairro } from "@/lib/radarUi";

/* ─── Projeção equirretangular (centrada em 23,6°S, 40 px/km) ─── */

export const LAT0 = -23.6;
export const LNG0 = -46.65;
export const PX_POR_KM = 40;
const KM_POR_GRAU_LAT = 110.57;
const KM_POR_GRAU_LNG = 111.32 * Math.cos((23.6 * Math.PI) / 180);
export const PX_POR_GRAU_LAT = KM_POR_GRAU_LAT * PX_POR_KM;
export const PX_POR_GRAU_LNG = KM_POR_GRAU_LNG * PX_POR_KM;

/** x = (lng − lng0) × 111,32 × cos(23,6°) × 40; y = (lat0 − lat) × 110,57 × 40 (y cresce para o sul). */
export function projetar(lat: number, lng: number): { x: number; y: number } {
  return { x: (lng - LNG0) * PX_POR_GRAU_LNG, y: (LAT0 - lat) * PX_POR_GRAU_LAT };
}

/** Inversas da projeção, para a grade de latitude e longitude. */
export const latDeY = (y: number) => LAT0 - y / PX_POR_GRAU_LAT;
export const lngDeX = (x: number) => LNG0 + x / PX_POR_GRAU_LNG;

/* ─── Indicador e classes por quartil ─── */

export type IndicadorMapa = "receita" | "diaria" | "ocupacao";

export const INDICADORES_MAPA: readonly { valor: IndicadorMapa; rotulo: string }[] = [
  { valor: "receita", rotulo: "Receita" },
  { valor: "diaria", rotulo: "Diária" },
  { valor: "ocupacao", rotulo: "Ocupação" },
];

type Base = Pick<BairroCurado, "name" | "dailyAvg" | "avgOccupancy" | "activeListings" | "ocupacaoFonte">;

export function valorIndicador(b: Pick<BairroCurado, "dailyAvg" | "avgOccupancy">, indicador: IndicadorMapa): number {
  if (indicador === "diaria") return b.dailyAvg;
  if (indicador === "ocupacao") return b.avgOccupancy;
  return receitaDe(b);
}

/**
 * Limites das 4 classes (P25, mediana, P75) do indicador. Só entram os bairros com
 * dado do próprio bairro: as aproximações repetem o Itaim Bibi e pesariam em dobro.
 */
export function limitesIndicador(bairros: Base[], indicador: IndicadorMapa): [number, number, number] {
  const proprios = bairros.filter((b) => naturezaBairro(b) === "observado");
  const conjunto = proprios.length >= 4 ? proprios : bairros;
  return limitesQuartis(conjunto.map((b) => valorIndicador(b, indicador)));
}

/** Contagem de bairros por classe (1–4), para o título-achado e a legenda. */
export function contagemClasses(bairros: Base[], indicador: IndicadorMapa, limites: [number, number, number]): [number, number, number, number] {
  const c: [number, number, number, number] = [0, 0, 0, 0];
  for (const b of bairros) c[classeQuartil(valorIndicador(b, indicador), limites) - 1]++;
  return c;
}

/* ─── Círculos: área proporcional à amostra ─── */

/** Raio fixo das aproximações (sem amostra própria), em unidades do mapa. */
export const RAIO_APROXIMACAO = 9;

/**
 * Raio com área proporcional à amostra: r = rMax × √(n / nMax), com piso para o
 * círculo continuar visível. Sem amostra (aproximação), devolve null.
 */
export function raioAmostra(n: number | null, nMax: number, rMax = 26, rMin = 4): number | null {
  if (n == null || nMax <= 0) return null;
  return Math.max(rMin, rMax * Math.sqrt(Math.max(0, n) / nMax));
}

export interface PontoMapa<T> {
  bairro: T;
  x: number;
  y: number;
  r: number;
  aproximacao: boolean;
  valor: number;
  classe: 1 | 2 | 3 | 4;
  lado: LadoRotulo;
}

export interface Caixa { x: number; y: number; w: number; h: number }

/**
 * Pontos do mapa (bairros com posição conhecida), na ordem de desenho: maiores
 * primeiro, para os menores ficarem por cima e continuarem clicáveis.
 */
export function pontosMapa<T extends Base>(
  bairros: T[],
  indicador: IndicadorMapa,
  opcoes: { rMax?: number; rMin?: number; raioAproximacao?: number } = {},
) {
  const limites = limitesIndicador(bairros, indicador);
  const nMax = Math.max(1, ...bairros.map((b) => (naturezaBairro(b) === "observado" ? b.activeListings ?? 0 : 0)));
  const pontos: PontoMapa<T>[] = [];
  const semPosicao: string[] = [];
  for (const b of bairros) {
    const g = geoBairro(b.name);
    if (!g) { semPosicao.push(b.name); continue; }
    const aproximacao = naturezaBairro(b) !== "observado";
    const { x, y } = projetar(g.lat, g.lng);
    const r = (aproximacao ? null : raioAmostra(b.activeListings, nMax, opcoes.rMax, opcoes.rMin)) ?? (opcoes.raioAproximacao ?? RAIO_APROXIMACAO);
    const valor = valorIndicador(b, indicador);
    pontos.push({ bairro: b, x, y, r, aproximacao, valor, classe: classeQuartil(valor, limites), lado: g.lado });
  }
  pontos.sort((a, b) => b.r - a.r || a.bairro.name.localeCompare(b.bairro.name, "pt-BR"));
  return { pontos, limites, nMax, semPosicao };
}

/** Caixa que contém todos os círculos, com margem (x para os lados, y em cima e embaixo). */
export function caixaMapa(pontos: { x: number; y: number; r: number }[], margemX: number, margemY: number): Caixa {
  if (!pontos.length) return { x: 0, y: 0, w: 1, h: 1 };
  const x0 = Math.min(...pontos.map((p) => p.x - p.r)) - margemX;
  const x1 = Math.max(...pontos.map((p) => p.x + p.r)) + margemX;
  const y0 = Math.min(...pontos.map((p) => p.y - p.r)) - margemY;
  const y1 = Math.max(...pontos.map((p) => p.y + p.r)) + margemY;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/* ─── Grade de latitude e longitude ─── */

/** Passo da grade: 0,02° quando as linhas ficam a 72 px ou mais umas das outras na tela; senão 0,05°. */
export function passoGrade(pxNaTelaPorGrauLng: number): 0.02 | 0.05 {
  return pxNaTelaPorGrauLng * 0.02 >= 72 ? 0.02 : 0.05;
}

/** Valores múltiplos do passo dentro do intervalo, sem erro de ponto flutuante (ex.: −23,54; −23,52…). */
export function linhasGrade(min: number, max: number, passo: number): number[] {
  const casas = passo < 0.05 ? 2 : passo < 0.1 ? 2 : 1;
  const ini = Math.ceil(min / passo - 1e-9);
  const fim = Math.floor(max / passo + 1e-9);
  const out: number[] = [];
  for (let i = ini; i <= fim; i++) out.push(Number((i * passo).toFixed(casas)));
  return out;
}

/** "23,52° S" / "46,70° O" (hemisférios sul e oeste). */
export function rotuloGrau(valor: number, eixo: "lat" | "lng"): string {
  const hemisferio = eixo === "lat" ? (valor < 0 ? "S" : "N") : valor < 0 ? "O" : "L";
  return `${formatDecimal(Math.abs(valor), 2)}° ${hemisferio}`;
}

/* ─── Rótulos sem sobreposição grosseira ─── */

export interface ItemRotulo { id: string; x: number; y: number; r: number; texto: string; lado: LadoRotulo; prioridade: number }
export interface Rotulo { id: string; x: number; y: number; ancora: "start" | "middle" | "end"; caixa: Caixa }

const LADOS: LadoRotulo[] = ["direita", "esquerda", "abaixo", "acima"];

/** Largura aproximada do texto (média de 0,6 em da serifada com peso 600, com folga). */
export const larguraTexto = (texto: string, fonte: number) => texto.length * fonte * 0.6;

function caixaRotulo(it: ItemRotulo, lado: LadoRotulo, fonte: number, folga: number): Omit<Rotulo, "id"> {
  const w = larguraTexto(it.texto, fonte);
  const h = fonte * 1.15;
  // Linha de base a ~0,35 em abaixo do centro vertical da caixa.
  if (lado === "direita") { const x = it.x + it.r + folga; return { x, y: it.y + fonte * 0.35, ancora: "start", caixa: { x, y: it.y - h / 2, w, h } }; }
  if (lado === "esquerda") { const x = it.x - it.r - folga; return { x, y: it.y + fonte * 0.35, ancora: "end", caixa: { x: x - w, y: it.y - h / 2, w, h } }; }
  if (lado === "acima") { const y0 = it.y - it.r - folga - h; return { x: it.x, y: y0 + h / 2 + fonte * 0.35, ancora: "middle", caixa: { x: it.x - w / 2, y: y0, w, h } }; }
  const y0 = it.y + it.r + folga;
  return { x: it.x, y: y0 + h / 2 + fonte * 0.35, ancora: "middle", caixa: { x: it.x - w / 2, y: y0, w, h } };
}

const sobrepoe = (a: Caixa, b: Caixa) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function tocaCirculo(c: Caixa, p: { x: number; y: number; r: number }) {
  const dx = p.x - Math.max(c.x, Math.min(p.x, c.x + c.w));
  const dy = p.y - Math.max(c.y, Math.min(p.y, c.y + c.h));
  return dx * dx + dy * dy < p.r * p.r;
}

const dentro = (c: Caixa, lim: Caixa) => c.x >= lim.x && c.y >= lim.y && c.x + c.w <= lim.x + lim.w && c.y + c.h <= lim.y + lim.h;

/**
 * Posiciona os rótulos em ordem de prioridade (o bairro selecionado primeiro):
 * tenta o lado preferido (bairrosGeo) e depois os outros; o rótulo que não cabe
 * sem cobrir outro rótulo ou outro círculo fica de fora (o bairro continua no
 * aria-label do círculo e na tabela equivalente). Prioridade ≥ 1000 força o rótulo.
 * `obstaculos`: áreas reservadas (rótulos da grade, norte, escala).
 */
export function posicionarRotulos(itens: ItemRotulo[], fonte: number, limites: Caixa, folga = 3, obstaculos: Caixa[] = []): Map<string, Rotulo> {
  const ordem = [...itens].sort((a, b) => b.prioridade - a.prioridade || a.texto.localeCompare(b.texto, "pt-BR"));
  const postos: Rotulo[] = [];
  const out = new Map<string, Rotulo>();
  for (const it of ordem) {
    const lados = [it.lado, ...LADOS.filter((l) => l !== it.lado)];
    let escolhido: Rotulo | null = null;
    for (const lado of lados) {
      const cand = { id: it.id, ...caixaRotulo(it, lado, fonte, folga) };
      if (!dentro(cand.caixa, limites)) continue;
      if (postos.some((p) => sobrepoe(p.caixa, cand.caixa))) continue;
      if (obstaculos.some((o) => sobrepoe(o, cand.caixa))) continue;
      if (itens.some((o) => o.id !== it.id && tocaCirculo(cand.caixa, o))) continue;
      escolhido = cand;
      break;
    }
    if (!escolhido && it.prioridade >= 1000) escolhido = { id: it.id, ...caixaRotulo(it, it.lado, fonte, folga) };
    if (escolhido) { postos.push(escolhido); out.set(it.id, escolhido); }
  }
  return out;
}

/* ─── Comparar: título-achado e eixo das faixas de diária ─── */

export type AchadoComparacao =
  | { tipo: "vazio" }
  | { tipo: "unico"; nome: string; valor: number }
  | { tipo: "empate"; nomes: string[]; valor: number }
  | { tipo: "maior"; maiores: string[]; valor: number; menor: string; diferenca: number };

/**
 * Quem tem a maior receita de referência entre os bairros comparados e quanto
 * fica acima do menor (valores inteiros, como aparecem na tela).
 */
export function achadoComparacao(itens: { nome: string; valor: number }[]): AchadoComparacao {
  if (!itens.length) return { tipo: "vazio" };
  const v = itens.map((i) => ({ nome: i.nome, valor: Math.round(i.valor) }));
  if (v.length === 1) return { tipo: "unico", nome: v[0].nome, valor: v[0].valor };
  const maior = Math.max(...v.map((i) => i.valor));
  const menorValor = Math.min(...v.map((i) => i.valor));
  const maiores = v.filter((i) => i.valor === maior).map((i) => i.nome);
  if (maior === menorValor) return { tipo: "empate", nomes: maiores, valor: maior };
  const menor = v.find((i) => i.valor === menorValor)!.nome;
  return { tipo: "maior", maiores, valor: maior, menor, diferenca: maior - menorValor };
}

/** Eixo comum das faixas de diária: R$ 0 a 600, marcas a cada R$ 100. */
export const EIXO_DIARIA = { min: 0, max: 600, passo: 100 } as const;

/** Posição (0–100%) de um valor no eixo, presa às pontas; `fora` indica valor além do eixo. */
export function posicaoEixo(valor: number, eixo: { min: number; max: number } = EIXO_DIARIA): { pct: number; fora: boolean } {
  const bruto = ((valor - eixo.min) / (eixo.max - eixo.min)) * 100;
  return { pct: Math.max(0, Math.min(100, bruto)), fora: bruto < 0 || bruto > 100 };
}

export function marcasEixo(eixo: { min: number; max: number; passo: number } = EIXO_DIARIA): number[] {
  const out: number[] = [];
  for (let v = eixo.min; v <= eixo.max; v += eixo.passo) out.push(v);
  return out;
}

/* ─── Achado geográfico e vizinhos ─── */

export type Direcao = "norte" | "nordeste" | "leste" | "sudeste" | "sul" | "sudoeste" | "oeste" | "noroeste";
const DIRECOES: Direcao[] = ["leste", "nordeste", "norte", "noroeste", "oeste", "sudoeste", "sul", "sudeste"];

/** Distância em km entre dois pontos da projeção (40 px/km). */
export const distanciaKm = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) / PX_POR_KM;

/**
 * Onde fica, em relação a uma referência (o centro, Sé), o centro geométrico dos
 * bairros de uma classe: direção em 8 setores, ou null quando fica a menos de
 * `raioCentroKm` (aí "perto do centro"). Só geometria das coordenadas exibidas.
 */
export function direcaoDaClasse(
  pontos: { x: number; y: number; classe: number }[],
  classe: number,
  referencia: { x: number; y: number },
  raioCentroKm = 2.5,
): { n: number; direcao: Direcao | null; distanciaKm: number } {
  const da = pontos.filter((p) => p.classe === classe);
  if (!da.length) return { n: 0, direcao: null, distanciaKm: 0 };
  const c = { x: da.reduce((s, p) => s + p.x, 0) / da.length, y: da.reduce((s, p) => s + p.y, 0) / da.length };
  const d = distanciaKm(c, referencia);
  if (d < raioCentroKm) return { n: da.length, direcao: null, distanciaKm: d };
  const ang = (Math.atan2(-(c.y - referencia.y), c.x - referencia.x) * 180) / Math.PI;
  const setor = Math.round(((ang + 360) % 360) / 45) % 8;
  return { n: da.length, direcao: DIRECOES[setor], distanciaKm: d };
}

/**
 * Os bairros mais próximos de um bairro (pelas coordenadas), para sugerir a comparação.
 * Aproximações ficam de fora quando o bairro de partida é observado (repetiriam o Itaim Bibi).
 */
export function vizinhosMaisProximos<T extends Base>(bairros: T[], nome: string, quantos = 2): T[] {
  const alvo = bairros.find((b) => b.name === nome);
  const g = alvo ? geoBairro(alvo.name) : undefined;
  if (!alvo || !g) return [];
  const origem = projetar(g.lat, g.lng);
  const alvoObservado = naturezaBairro(alvo) === "observado";
  return bairros
    .filter((b) => b.name !== nome && (!alvoObservado || naturezaBairro(b) === "observado"))
    .map((b) => { const gb = geoBairro(b.name); return gb ? { b, d: distanciaKm(origem, projetar(gb.lat, gb.lng)) } : null; })
    .filter((x): x is { b: T; d: number } => x != null)
    .sort((a, b) => a.d - b.d || a.b.name.localeCompare(b.b.name, "pt-BR"))
    .slice(0, quantos)
    .map((x) => x.b);
}

/** Centro de referência para "a sudoeste do centro": a posição da Sé em bairrosGeo.ts. */
export function centroSP(): { x: number; y: number } {
  const g = geoBairro("Sé");
  return g ? projetar(g.lat, g.lng) : projetar(LAT0, LNG0);
}

const PREPOSICAO_DIRECAO: Record<Direcao, string> = {
  norte: "ao norte", nordeste: "a nordeste", leste: "a leste", sudeste: "a sudeste",
  sul: "ao sul", sudoeste: "a sudoeste", oeste: "a oeste", noroeste: "a noroeste",
};

/** "a sudoeste do centro", "ao norte do centro" ou "perto do centro". */
export const textoDirecao = (d: Direcao | null) => (d ? `${PREPOSICAO_DIRECAO[d]} do centro` : "perto do centro");

/**
 * Bairro com a faixa central de diária (P25 a P75) mais larga entre os comparados,
 * para o título da Fig. 1 do /comparar. Empate fica com o primeiro da lista.
 */
export function faixaMaisLarga<T extends Pick<BairroCurado, "name" | "dailyQuartiles">>(bairros: T[]) {
  let melhor: { bairro: T; p25: number; p75: number; largura: number } | null = null;
  for (const b of bairros) {
    if (!b.dailyQuartiles) continue;
    const largura = b.dailyQuartiles[2] - b.dailyQuartiles[0];
    if (!melhor || largura > melhor.largura) melhor = { bairro: b, p25: b.dailyQuartiles[0], p75: b.dailyQuartiles[2], largura };
  }
  return melhor;
}

/**
 * Troca o bairro de uma vaga da comparação (?b=): se o escolhido já está em outra
 * vaga, as duas trocam de lugar; vaga além do fim entra no fim. Sem repetição, até 3.
 */
export function trocarNaComparacao(slugs: string[], vaga: number, slug: string, max = 3): string[] {
  const novo = [...slugs];
  const ja = novo.indexOf(slug);
  if (vaga >= novo.length) {
    if (ja < 0) novo.push(slug);
    return novo.slice(0, max);
  }
  if (ja >= 0 && ja !== vaga) novo[ja] = novo[vaga];
  novo[vaga] = slug;
  return novo.slice(0, max);
}
