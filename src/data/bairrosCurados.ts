/**
 * Fonte ÚNICA de diária e ocupação por bairro (Radar Bewild).
 *
 * Regra: um bairro, um número. Nada aqui é derivado por multiplicador.
 * - Diária em R$/noite (faixa mín–máx informada pela Bewild).
 * - Diária média = valor informado (quando há) ou ponto médio da faixa.
 * - Ocupação em %. `ocupacaoFonte: "guestfavorites"` = ocupação mediana do
 *   levantamento GuestFavorites jan–ago/2026; "bewild" = número Bewild.
 * - Diária por metragem (20–25 / 26–35 / 36–50 m²) informada pela Bewild;
 *   `null` quando não há recorte.
 * - Receita mensal de referência é SEMPRE calculada (receitaMensalReferencia),
 *   nunca armazenada.
 * Origem: Bewild (Pedro Alves, out/2026) + GuestFavorites jan–ago/2026.
 */

export type SizeKey = "20–25 m²" | "26–35 m²" | "36–50 m²";
export type DiariaPorMetragem = Record<SizeKey, number>;

export type BairroCurado = {
  name: string;
  dailyMin: number;
  dailyMax: number;
  /** Diária média: informada ou ponto médio da faixa. */
  dailyAvg: number;
  /** Ocupação em % (0–100). */
  avgOccupancy: number;
  ocupacaoFonte: "guestfavorites" | "bewild";
  avgBySize: DiariaPorMetragem | null;
};

export const FONTE_BAIRROS_CURADOS =
  "Bewild, com ocupação do levantamento GuestFavorites (jan–ago/2026) onde indicado";

export const ROTULO_ESTIMATIVA_MERCADO = "Estimativa de mercado — base 2025";

type Entrada = Omit<BairroCurado, "dailyAvg"> & { dailyAvg?: number };

const s = (a: number, b: number, c: number): DiariaPorMetragem => ({
  "20–25 m²": a,
  "26–35 m²": b,
  "36–50 m²": c,
});

const ENTRADAS: Entrada[] = [
  { name: "Bela Vista", dailyMin: 240, dailyMax: 370, avgOccupancy: 64, ocupacaoFonte: "guestfavorites", avgBySize: s(220, 290, 360) },
  { name: "Brooklin", dailyMin: 290, dailyMax: 430, avgOccupancy: 75, ocupacaoFonte: "bewild", avgBySize: s(270, 350, 420) },
  { name: "Consolação", dailyMin: 260, dailyMax: 390, avgOccupancy: 63, ocupacaoFonte: "guestfavorites", avgBySize: s(240, 310, 380) },
  { name: "Itaim Bibi", dailyMin: 350, dailyMax: 520, avgOccupancy: 59, ocupacaoFonte: "guestfavorites", avgBySize: s(330, 420, 510) },
  { name: "Jardim Paulista", dailyMin: 360, dailyMax: 520, dailyAvg: 440, avgOccupancy: 62, ocupacaoFonte: "guestfavorites", avgBySize: null },
  { name: "Liberdade", dailyMin: 220, dailyMax: 340, avgOccupancy: 73, ocupacaoFonte: "bewild", avgBySize: s(200, 270, 330) },
  { name: "Moema", dailyMin: 300, dailyMax: 450, avgOccupancy: 61, ocupacaoFonte: "guestfavorites", avgBySize: s(280, 360, 440) },
  { name: "Pinheiros", dailyMin: 320, dailyMax: 480, avgOccupancy: 62, ocupacaoFonte: "guestfavorites", avgBySize: s(300, 380, 470) },
  { name: "República", dailyMin: 200, dailyMax: 310, avgOccupancy: 72, ocupacaoFonte: "bewild", avgBySize: s(185, 245, 300) },
  { name: "Vila Mariana", dailyMin: 280, dailyMax: 420, avgOccupancy: 60, ocupacaoFonte: "guestfavorites", avgBySize: s(260, 330, 410) },
  { name: "Vila Olímpia", dailyMin: 330, dailyMax: 500, avgOccupancy: 79, ocupacaoFonte: "bewild", avgBySize: s(310, 400, 490) },
];

export const BAIRROS_CURADOS: BairroCurado[] = ENTRADAS.map((e) => ({
  ...e,
  dailyAvg: e.dailyAvg ?? (e.dailyMin + e.dailyMax) / 2,
}));

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const POR_NOME = new Map(BAIRROS_CURADOS.map((b) => [norm(b.name), b]));

export function getBairroCurado(nome: string | null | undefined): BairroCurado | undefined {
  if (!nome) return undefined;
  return POR_NOME.get(norm(nome));
}

/** Diária para a faixa de metragem; sem recorte, usa a diária média do bairro. */
export function diariaPorMetragem(b: BairroCurado, size: SizeKey): number {
  return b.avgBySize?.[size] ?? b.dailyAvg;
}

/** Receita mensal de referência = diária média × 30 × ocupação. */
export function receitaMensalReferencia(b: BairroCurado): number {
  return Math.round(b.dailyAvg * 30 * (b.avgOccupancy / 100));
}

export function rotuloOcupacao(b: BairroCurado): string {
  return b.ocupacaoFonte === "guestfavorites" ? `${b.avgOccupancy}% (GF)` : `${b.avgOccupancy}%`;
}
