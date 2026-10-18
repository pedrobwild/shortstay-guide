/** RESERVA OFFLINE. A fonte de verdade agora é o banco (view radar_bairro_atual,
 * lida por src/lib/radarBase.ts). Este arquivo só é usado se a consulta falhar
 * e pelo case Pinheiros (protegido). Nova coleta = novas linhas no banco, não aqui.
 * Origem: coleta pública GuestFavorites aprovada por Pedro em 13/10/2026 e coleta de
 * 18/10/2026 dos 15 bairros novos (docs/coleta-2026-10-18-novos-bairros.md).
 * Quartis de diária não são faixas de metragem. Receita é sempre calculada.
 */
export type SizeKey = "20–25 m²" | "26–35 m²" | "36–50 m²";
export type BairroCurado = {
  name: string;
  dailyMin: number;
  dailyMax: number;
  dailyAvg: number;
  avgOccupancy: number;
  ocupacaoFonte: "guestfavorites" | "airdna" | "bewild" | "aproximacao"; // "aproximacao": valores do distrito Itaim Bibi (GuestFavorites) // "airdna": só via banco (radar_bairro_atual), para os bairros sem fonte pública
  dailyQuartiles: [number, number, number] | null;
  activeListings: number | null;
  period: string | null;
  sourceUrl: string | null;
  /** Data da coleta aprovada (AAAA-MM-DD); 13/10/2026 para a base original, 18/10/2026 para os bairros novos. */
  coletadoEm?: string;
  /** Referência extra (dados anteriores da Bewild, sem fonte pública); nunca usada em cálculos. */
  referenciaBewild?: { dailyAvg: number; dailyMin: number; dailyMax: number; avgOccupancy: number };
};
export const FONTE_BAIRROS_CURADOS = "Ocupação e diária: GuestFavorites (coletas de 13/10/2026 e 18/10/2026; jan–set/2026, exceto Liberdade e República, jan–jul/2026).";
export const FONTE_ESTIMATIVA_BEWILD = "estimativa Bewild (sem fonte pública atualizada)";
export const FONTE_APROXIMACAO_ITAIM = "aproximação pelo Itaim Bibi (GuestFavorites, jan–set/2026)";
export const URL_ITAIM_BIBI = "https://www.guestfavorites.com/airbnb-occupancy-rates-in-itaim-bibi-sao-paulo-brazil";
export const ROTULO_ESTIMATIVA_MERCADO = "Estimativa de mercado — base 2025";

// Origem de cada linha GF: respectiva página pública abaixo, coleta de 13/10/2026.
const gf = (name: string, avgOccupancy: number, dailyAvg: number, dailyQuartiles: [number, number, number], activeListings: number, period: string, slug: string, coletadoEm = "2026-10-13"): BairroCurado => ({
  name, avgOccupancy, dailyAvg, dailyQuartiles, activeListings, period, coletadoEm,
  dailyMin: dailyQuartiles[0], dailyMax: dailyQuartiles[2], ocupacaoFonte: "guestfavorites",
  sourceUrl: `https://www.guestfavorites.com/airbnb-occupancy-rates-in-${slug}-sao-paulo-brazil`,
});
// Sem estimativa Bewild como número principal desde 18/10/2026 (a Consolação passou a dado público); a referência extra de Brooklin e Vila Olímpia fica em `referenciaBewild`.
// Origem: página GuestFavorites do Itaim Bibi (coleta 13/10/2026, jan–set/2026), distrito que inclui
// a Vila Olímpia e parte do Brooklin; sem anúncios ativos por bairro (3.884 é do distrito).
const aproximacaoItaim = (name: string, referenciaBewild: BairroCurado["referenciaBewild"]): BairroCurado => ({ referenciaBewild,
  name, avgOccupancy: 59, dailyAvg: 359, dailyQuartiles: [180, 279, 404], dailyMin: 180, dailyMax: 404,
  activeListings: null, period: "jan–set/2026", ocupacaoFonte: "aproximacao", sourceUrl: URL_ITAIM_BIBI,
});
export const BAIRROS_CURADOS: BairroCurado[] = [
  gf("Bela Vista", 64, 237, [140, 198, 256], 1983, "jan–set/2026", "bela-vista"),
  aproximacaoItaim("Brooklin", { dailyAvg: 360, dailyMin: 290, dailyMax: 430, avgOccupancy: 75 }),
  // Consolação: dado público GuestFavorites desde a coleta de 18/10/2026 (antes estimativa Bewild R$ 325 / 63%).
  gf("Consolação", 63, 270, [160, 220, 282], 1567, "jan–set/2026", "consolacao", "2026-10-18"),
  gf("Itaim Bibi", 59, 359, [180, 279, 404], 3884, "jan–set/2026", "itaim-bibi"),
  gf("Jardim Paulista", 62, 319, [183, 251, 327], 3147, "jan–set/2026", "jardim-paulista"),
  gf("Liberdade", 61, 230, [132, 195, 251], 553, "jan–jul/2026", "liberdade"),
  gf("Moema", 61, 263, [167, 225, 288], 2621, "jan–set/2026", "moema"),
  gf("Pinheiros", 62, 300, [171, 232, 301], 2424, "jan–set/2026", "pinheiros"),
  gf("República", 63, 203, [117, 166, 210], 3079, "jan–jul/2026", "republica"),
  gf("Vila Mariana", 60, 226, [143, 194, 235], 2238, "jan–set/2026", "vila-mariana"),
  aproximacaoItaim("Vila Olímpia", { dailyAvg: 415, dailyMin: 330, dailyMax: 500, avgOccupancy: 79 }),
  gf("Mooca", 59, 241, [27, 195, 268], 85, "jan–set/2026", "mooca"),
  gf("Perdizes", 53, 254, [174, 217, 276], 1752, "jan–set/2026", "perdizes"),
  // Coleta de 18/10/2026 (docs/coleta-2026-10-18-novos-bairros.md): 15 bairros novos, base de 28.
  gf("Santa Cecília", 59, 215, [53, 163, 222], 607, "jan–set/2026", "santa-cecilia", "2026-10-18"),
  gf("Campo Belo", 60, 233, [142, 194, 252], 1077, "jan–set/2026", "campo-belo", "2026-10-18"),
  gf("Santana", 62, 229, [164, 207, 257], 510, "jan–set/2026", "santana", "2026-10-18"),
  gf("Tatuapé", 58, 249, [157, 220, 268], 422, "jan–set/2026", "tatuape", "2026-10-18"),
  gf("Barra Funda", 57, 255, [193, 233, 279], 559, "jan–set/2026", "barra-funda", "2026-10-18"),
  gf("Butantã", 61, 276, [87, 207, 268], 402, "jan–set/2026", "butanta", "2026-10-18"),
  gf("Saúde", 63, 247, [120, 191, 243], 525, "jan–set/2026", "saude", "2026-10-18"),
  gf("Ipiranga", 56, 226, [89, 171, 228], 238, "jan–set/2026", "ipiranga", "2026-10-18"),
  gf("Morumbi", 57, 485, [204, 323, 574], 330, "jan–set/2026", "morumbi", "2026-10-18"),
  gf("Santo Amaro", 56, 256, [152, 201, 256], 1488, "jan–set/2026", "santo-amaro", "2026-10-18"),
  gf("Jabaquara", 55, 228, [110, 183, 248], 421, "jan–set/2026", "jabaquara", "2026-10-18"),
  gf("Sé", 64, 184, [133, 160, 190], 502, "jan–set/2026", "se", "2026-10-18"),
  gf("Brás", 65, 217, [122, 167, 255], 841, "jan–set/2026", "bras", "2026-10-18"),
  gf("Bom Retiro", 60, 189, [120, 170, 204], 187, "jan–set/2026", "bom-retiro", "2026-10-18"),
  gf("Lapa", 57, 239, [125, 190, 247], 160, "jan–set/2026", "lapa", "2026-10-18"),
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
export function receitaMensalReferencia(b: Pick<BairroCurado, "dailyAvg" | "avgOccupancy">): number { return Math.round(b.dailyAvg * 30 * b.avgOccupancy / 100); }
export function fonteBairro(b: BairroCurado): string {
  if (b.ocupacaoFonte === "guestfavorites") return `GuestFavorites, ${b.period}`;
  if (b.ocupacaoFonte === "airdna") return b.period ? `AirDNA, ${b.period}` : "AirDNA";
  if (b.ocupacaoFonte === "aproximacao") return FONTE_APROXIMACAO_ITAIM;
  return FONTE_ESTIMATIVA_BEWILD;
}
/** Amostra pequena: menos de 200 anúncios (Mooca, Bom Retiro, Lapa). */
export function avisoAmostra(b: BairroCurado): string | null {
  return b.activeListings != null && b.activeListings < 200 ? `amostra pequena (${new Intl.NumberFormat("pt-BR").format(b.activeListings)} anúncios)` : null;
}
export function rotuloOcupacao(b: BairroCurado): string {
  return `${new Intl.NumberFormat("pt-BR").format(b.avgOccupancy)}%${b.ocupacaoFonte === "guestfavorites" ? " (GF)" : b.ocupacaoFonte === "airdna" ? " (AirDNA)" : b.ocupacaoFonte === "aproximacao" ? " (aprox. Itaim Bibi)" : ""}`;
}
