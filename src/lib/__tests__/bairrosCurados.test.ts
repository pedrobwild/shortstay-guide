import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { BAIRROS_CURADOS, getBairroCurado, receitaMensalReferencia, diariaPorMetragem, SAO_PAULO_REFERENCIA, avisoAmostra } from "@/data/bairrosCurados";
import { aplicarCurados } from "@/hooks/useIntelligenceData";
import type { BairroAirbnb } from "@/types/intelligence";

const aprovados: [string, number, number, number[], number, string][] = [
  ["Pinheiros", 62, 300, [171, 232, 301], 2424, "jan–set/2026"],
  ["Bela Vista", 64, 237, [140, 198, 256], 1983, "jan–set/2026"],
  ["Itaim Bibi", 59, 359, [180, 279, 404], 3884, "jan–set/2026"],
  ["Jardim Paulista", 62, 319, [183, 251, 327], 3147, "jan–set/2026"],
  ["Liberdade", 61, 230, [132, 195, 251], 553, "jan–jul/2026"],
  ["Moema", 61, 263, [167, 225, 288], 2621, "jan–set/2026"],
  ["República", 63, 203, [117, 166, 210], 3079, "jan–jul/2026"],
  ["Vila Mariana", 60, 226, [143, 194, 235], 2238, "jan–set/2026"],
  ["Mooca", 59, 241, [27, 195, 268], 85, "jan–set/2026"],
  ["Perdizes", 53, 254, [174, 217, 276], 1752, "jan–set/2026"],
];
describe("coleta GuestFavorites aprovada em 13/10/2026", () => {
  it.each(aprovados)("preserva valores e fonte de %s", (nome, occ, adr, quartis, anuncios, periodo) => {
    const b = getBairroCurado(nome);
    expect(b).toMatchObject({ avgOccupancy: occ, dailyAvg: adr, dailyQuartiles: quartis, activeListings: anuncios, period: periodo, ocupacaoFonte: "guestfavorites" });
    const slug = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, "-");
    expect(b?.sourceUrl).toBe(`https://www.guestfavorites.com/airbnb-occupancy-rates-in-${slug}-sao-paulo-brazil`);
  });
  it("mantém estimativa Consolação", () => {
    expect(getBairroCurado("Consolação")).toMatchObject({ dailyAvg: 325, avgOccupancy: 63, ocupacaoFonte: "bewild", dailyQuartiles: null, sourceUrl: null });
  });
  it.each(["Brooklin", "Vila Olímpia"])("%s usa a aproximação pelo Itaim Bibi", (nome) => {
    expect(getBairroCurado(nome)).toMatchObject({ dailyAvg: 359, avgOccupancy: 59, dailyQuartiles: [180, 279, 404], activeListings: null, ocupacaoFonte: "aproximacao", period: "jan–set/2026", sourceUrl: "https://www.guestfavorites.com/airbnb-occupancy-rates-in-itaim-bibi-sao-paulo-brazil" });
  });
  it.each([["Brooklin", 360, 75, 290, 430], ["Vila Olímpia", 415, 79, 330, 500]])("%s guarda a estimativa Bewild como referência extra", (nome, adr, occ, min, max) => {
    expect(getBairroCurado(String(nome))?.referenciaBewild).toEqual({ dailyAvg: adr, avgOccupancy: occ, dailyMin: min, dailyMax: max });
    expect(getBairroCurado("Consolação")?.referenciaBewild).toBeUndefined();
  });
  it("inclui Mooca e Perdizes e a referência da cidade", () => {
    expect(BAIRROS_CURADOS).toHaveLength(13);
    expect(SAO_PAULO_REFERENCIA).toEqual({ avgOccupancy: 60, dailyAvg: 266, activeListings: 34854, period: "jan–set/2026" });
  });
  it("identifica a amostra pequena da Mooca", () => {
    const mooca = getBairroCurado("Mooca");
    if (!mooca) throw new Error("Mooca ausente");
    expect(avisoAmostra(mooca)).toBe("amostra pequena (85 anúncios)");
  });
  it.each([["Pinheiros", 5580], ["Liberdade", 4209], ["Mooca", 4266]])("calcula receita de %s sem armazenar", (nome, receita) => {
    const b = getBairroCurado(String(nome));
    if (!b) throw new Error("Bairro ausente");
    expect(receitaMensalReferencia(b)).toBe(receita);
    expect(b).not.toHaveProperty("receitaMensal");
  });
  it("não deriva ADR por metragem", () => {
    const b = getBairroCurado("Pinheiros");
    if (!b) throw new Error("Bairro ausente");
    expect(diariaPorMetragem(b, "20–25 m²")).toBe(300);
    expect(diariaPorMetragem(b, "36–50 m²")).toBe(300);
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
