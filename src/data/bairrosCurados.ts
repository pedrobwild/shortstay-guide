/** Fonte única: coleta pública GuestFavorites aprovada por Pedro em 13/10/2026.
 * Quartis de diária não são faixas de metragem. Receita é sempre calculada.
 */
export type SizeKey = "20–25 m²" | "26–35 m²" | "36–50 m²";
export type BairroCurado = {
  name: string;
  dailyMin: number;
  dailyMax: number;
  dailyAvg: number;
  avgOccupancy: number;
  ocupacaoFonte: "guestfavorites" | "bewild";
  dailyQuartiles: [number, number, number] | null;
  activeListings: number | null;
  period: string | null;
  sourceUrl: string | null;
};
export const FONTE_BAIRROS_CURADOS = "Ocupação e diária: GuestFavorites (coleta de 13/10/2026; jan–set/2026, exceto Liberdade e República, jan–jul/2026).";
export const FONTE_ESTIMATIVA_BEWILD = "estimativa Bewild (sem fonte pública atualizada)";
export const ROTULO_ESTIMATIVA_MERCADO = "Estimativa de mercado — base 2025";

// Origem de cada linha GF: respectiva página pública abaixo, coleta de 13/10/2026.
const gf = (name: string, avgOccupancy: number, dailyAvg: number, dailyQuartiles: [number, number, number], activeListings: number, period: string, slug: string): BairroCurado => ({
  name, avgOccupancy, dailyAvg, dailyQuartiles, activeListings, period,
  dailyMin: dailyQuartiles[0], dailyMax: dailyQuartiles[2], ocupacaoFonte: "guestfavorites",
  sourceUrl: `https://www.guestfavorites.com/airbnb-occupancy-rates-in-${slug}-sao-paulo-brazil`,
});
// Origem: valores Bewild anteriores, mantidos por Pedro; sem fonte pública atualizada.
const estimativa = (name: string, dailyMin: number, dailyMax: number, avgOccupancy: number): BairroCurado => ({
  name, dailyMin, dailyMax, dailyAvg: (dailyMin + dailyMax) / 2, avgOccupancy,
  ocupacaoFonte: "bewild", dailyQuartiles: null, activeListings: null, period: null, sourceUrl: null,
});
export const BAIRROS_CURADOS: BairroCurado[] = [
  gf("Bela Vista", 64, 237, [140, 198, 256], 1983, "jan–set/2026", "bela-vista"),
  estimativa("Brooklin", 290, 430, 75),
  estimativa("Consolação", 260, 390, 63),
  gf("Itaim Bibi", 59, 359, [180, 279, 404], 3884, "jan–set/2026", "itaim-bibi"),
  gf("Jardim Paulista", 62, 319, [183, 251, 327], 3147, "jan–set/2026", "jardim-paulista"),
  gf("Liberdade", 61, 230, [132, 195, 251], 553, "jan–jul/2026", "liberdade"),
  gf("Moema", 61, 263, [167, 225, 288], 2621, "jan–set/2026", "moema"),
  gf("Pinheiros", 62, 300, [171, 232, 301], 2424, "jan–set/2026", "pinheiros"),
  gf("República", 63, 203, [117, 166, 210], 3079, "jan–jul/2026", "republica"),
  gf("Vila Mariana", 60, 226, [143, 194, 235], 2238, "jan–set/2026", "vila-mariana"),
  estimativa("Vila Olímpia", 330, 500, 79),
  gf("Mooca", 59, 241, [27, 195, 268], 85, "jan–set/2026", "mooca"),
  gf("Perdizes", 53, 254, [174, 217, 276], 1752, "jan–set/2026", "perdizes"),
];
// Origem: mesma coleta GuestFavorites de São Paulo, jan–set/2026, aprovada por Pedro.
export const SAO_PAULO_REFERENCIA = { avgOccupancy: 60, dailyAvg: 266, activeListings: 34854, period: "jan–set/2026" };
const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const POR_NOME = new Map(BAIRROS_CURADOS.map((b) => [norm(b.name), b]));
export function getBairroCurado(nome: string | null | undefined): BairroCurado | undefined {
  return nome ? POR_NOME.get(norm(nome)) : undefined;
}
/** Compatibilidade com seletores existentes: não há diária por metragem com fonte. */
export function diariaPorMetragem(b: BairroCurado, _size: SizeKey): number { return b.dailyAvg; }
export function receitaMensalReferencia(b: BairroCurado): number { return Math.round(b.dailyAvg * 30 * b.avgOccupancy / 100); }
export function fonteBairro(b: BairroCurado): string {
  return b.ocupacaoFonte === "guestfavorites" ? `GuestFavorites, ${b.period}` : FONTE_ESTIMATIVA_BEWILD;
}
export function avisoAmostra(b: BairroCurado): string | null {
  return b.name === "Mooca" ? "amostra pequena (85 anúncios)" : null;
}
export function rotuloOcupacao(b: BairroCurado): string {
  return `${new Intl.NumberFormat("pt-BR").format(b.avgOccupancy)}%${b.ocupacaoFonte === "guestfavorites" ? " (GF)" : ""}`;
}
