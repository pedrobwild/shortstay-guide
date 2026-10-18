import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { BAIRROS_CURADOS, getBairroCurado, receitaMensalReferencia, diariaPorMetragem, SAO_PAULO_REFERENCIA, avisoAmostra } from "@/data/bairrosCurados";
import { aplicarCurados } from "@/hooks/useIntelligenceData";
import type { BairroAirbnb } from "@/types/intelligence";

// Coleta assistida de 18/10/2026 aprovada pelo Pedro em /admin/coletas (releitura das páginas da coleta de 13/10;
// Moema não mudou e segue com a coleta de 13/10/2026).
const aprovados: [string, number, number, number[], number, string, string][] = [
  ["Pinheiros", 63, 299, [171, 232, 301], 2452, "jan–set/2026", "2026-10-18"],
  ["Bela Vista", 64, 237, [140, 198, 256], 1991, "jan–set/2026", "2026-10-18"],
  ["Itaim Bibi", 60, 359, [180, 279, 404], 3880, "jan–set/2026", "2026-10-18"],
  ["Jardim Paulista", 62, 319, [183, 251, 327], 3168, "jan–set/2026", "2026-10-18"],
  ["Liberdade", 61, 229, [138, 196, 252], 556, "jan–set/2026", "2026-10-18"],
  ["Moema", 61, 263, [167, 225, 288], 2621, "jan–set/2026", "2026-10-13"],
  ["República", 63, 203, [121, 166, 210], 3120, "jan–set/2026", "2026-10-18"],
  ["Vila Mariana", 60, 226, [143, 194, 235], 2272, "jan–set/2026", "2026-10-18"],
  ["Mooca", 58, 243, [27, 195, 268], 90, "jan–set/2026", "2026-10-18"],
  ["Perdizes", 54, 254, [174, 217, 276], 1803, "jan–set/2026", "2026-10-18"],
];
// Coleta de 18/10/2026 (docs/coleta-2026-10-18-novos-bairros.md), aprovada e carregada pelo Pedro; seis bairros conferidos ao vivo.
const coleta18: [string, number, number, number[], number, string][] = [
  ["Santa Cecília", 59, 215, [53, 163, 222], 607, "jan–set/2026"],
  ["Campo Belo", 60, 233, [142, 194, 252], 1077, "jan–set/2026"],
  ["Santana", 62, 229, [164, 207, 257], 510, "jan–set/2026"],
  ["Tatuapé", 58, 249, [157, 220, 268], 422, "jan–set/2026"],
  ["Barra Funda", 57, 255, [193, 233, 279], 559, "jan–set/2026"],
  ["Butantã", 61, 276, [87, 207, 268], 402, "jan–set/2026"],
  ["Saúde", 63, 247, [120, 191, 243], 525, "jan–set/2026"],
  ["Ipiranga", 56, 226, [89, 171, 228], 238, "jan–set/2026"],
  ["Morumbi", 57, 485, [204, 323, 574], 330, "jan–set/2026"],
  ["Santo Amaro", 56, 256, [152, 201, 256], 1488, "jan–set/2026"],
  ["Jabaquara", 55, 228, [110, 183, 248], 421, "jan–set/2026"],
  ["Sé", 64, 184, [133, 160, 190], 502, "jan–set/2026"],
  ["Brás", 65, 217, [122, 167, 255], 841, "jan–set/2026"],
  ["Bom Retiro", 60, 189, [120, 170, 204], 187, "jan–set/2026"],
  ["Lapa", 57, 239, [125, 190, 247], 160, "jan–set/2026"],
];
describe("coleta GuestFavorites de 18/10/2026 (15 bairros novos)", () => {
  it.each(coleta18)("preserva valores e fonte de %s", (nome, occ, adr, quartis, anuncios, periodo) => {
    const b = getBairroCurado(nome);
    expect(b).toMatchObject({ avgOccupancy: occ, dailyAvg: adr, dailyQuartiles: quartis, activeListings: anuncios, period: periodo, ocupacaoFonte: "guestfavorites", coletadoEm: "2026-10-18" });
    const slug = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, "-");
    expect(b?.sourceUrl).toBe(`https://www.guestfavorites.com/airbnb-occupancy-rates-in-${slug}-sao-paulo-brazil`);
  });
  it("Bom Retiro e Lapa levam o aviso de amostra pequena; os demais não", () => {
    expect(avisoAmostra(getBairroCurado("Bom Retiro")!)).toBe("amostra pequena (187 anúncios)");
    expect(avisoAmostra(getBairroCurado("Lapa")!)).toBe("amostra pequena (160 anúncios)");
    expect(avisoAmostra(getBairroCurado("Santa Cecília")!)).toBeNull();
  });
});

describe("base original (coleta de 13/10/2026, relida e aprovada em 18/10/2026)", () => {
  it.each(aprovados)("preserva valores e fonte de %s", (nome, occ, adr, quartis, anuncios, periodo, coletadoEm) => {
    const b = getBairroCurado(nome);
    expect(b).toMatchObject({ avgOccupancy: occ, dailyAvg: adr, dailyQuartiles: quartis, activeListings: anuncios, period: periodo, ocupacaoFonte: "guestfavorites", coletadoEm });
    const slug = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, "-");
    expect(b?.sourceUrl).toBe(`https://www.guestfavorites.com/airbnb-occupancy-rates-in-${slug}-sao-paulo-brazil`);
  });
  it("Consolação passou a dado público GuestFavorites em 18/10/2026 (antes estimativa Bewild R$ 325 / 63%)", () => {
    expect(getBairroCurado("Consolação")).toMatchObject({ dailyAvg: 270, avgOccupancy: 63, dailyQuartiles: [160, 220, 282], activeListings: 1567, period: "jan–set/2026", ocupacaoFonte: "guestfavorites", coletadoEm: "2026-10-18" });
    expect(BAIRROS_CURADOS.some((b) => b.ocupacaoFonte === "bewild")).toBe(false);
  });
  it.each(["Brooklin", "Vila Olímpia"])("%s usa a aproximação pelo Itaim Bibi", (nome) => {
    expect(getBairroCurado(nome)).toMatchObject({ dailyAvg: 359, avgOccupancy: 60, dailyQuartiles: [180, 279, 404], activeListings: null, ocupacaoFonte: "aproximacao", period: "jan–set/2026", sourceUrl: "https://www.guestfavorites.com/airbnb-occupancy-rates-in-itaim-bibi-sao-paulo-brazil" });
  });
  it.each([["Brooklin", 360, 75, 290, 430], ["Vila Olímpia", 415, 79, 330, 500]])("%s guarda a estimativa Bewild como referência extra", (nome, adr, occ, min, max) => {
    expect(getBairroCurado(String(nome))?.referenciaBewild).toEqual({ dailyAvg: adr, avgOccupancy: occ, dailyMin: min, dailyMax: max });
    expect(getBairroCurado("Consolação")?.referenciaBewild).toBeUndefined();
  });
  it("a base tem 28 bairros (26 com coleta de 18/10, Moema de 13/10 e as 2 aproximações) e a referência da cidade", () => {
    expect(BAIRROS_CURADOS).toHaveLength(28);
    expect(BAIRROS_CURADOS.filter((b) => b.coletadoEm === "2026-10-13")).toEqual([expect.objectContaining({ name: "Moema" })]);
    expect(BAIRROS_CURADOS.filter((b) => b.ocupacaoFonte === "guestfavorites" && b.coletadoEm === "2026-10-18")).toHaveLength(25);
    expect(SAO_PAULO_REFERENCIA).toEqual({ avgOccupancy: 60, dailyAvg: 265, activeListings: 35077, period: "jan–set/2026" });
  });
  it("identifica a amostra pequena da Mooca", () => {
    const mooca = getBairroCurado("Mooca");
    if (!mooca) throw new Error("Mooca ausente");
    expect(avisoAmostra(mooca)).toBe("amostra pequena (90 anúncios)");
  });
  it.each([["Pinheiros", 5651], ["Liberdade", 4191], ["Mooca", 4228]])("calcula receita de %s sem armazenar", (nome, receita) => {
    const b = getBairroCurado(String(nome));
    if (!b) throw new Error("Bairro ausente");
    expect(receitaMensalReferencia(b)).toBe(receita);
    expect(b).not.toHaveProperty("receitaMensal");
  });
  it("não deriva ADR por metragem", () => {
    const b = getBairroCurado("Pinheiros");
    if (!b) throw new Error("Bairro ausente");
    expect(diariaPorMetragem(b, "20–25 m²")).toBe(299);
    expect(diariaPorMetragem(b, "36–50 m²")).toBe(299);
  });
  it.each(aprovados)("sobrepõe diária e ocupação do banco para %s", (bairro, occ, adr) => {
    const row = { bairro, adr_medio_studio: 180, ocupacao_media_studio: 0.72, preco_m2_residencial_medio: 0, area_media_estudio: 30 } as unknown as BairroAirbnb;
    expect(aplicarCurados(row)).toMatchObject({ adr_medio_studio: adr, ocupacao_media_studio: occ / 100 });
    expect(row.adr_medio_studio).toBe(180);
  });
  it("o chat lê a base única do banco, sem cópia fixa dos números", () => {
    const source = readFileSync("supabase/functions/chat/index.ts", "utf8");
    expect(source).toContain('from("radar_bairro_atual")');
    expect(source).not.toMatch(/gf\(237, 64/);
  });
});
