import { describe, it, expect } from "vitest";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { montarBairros, rotuloFonteRadar, type LinhaRadar } from "@/lib/radarBase";

const periodos: Record<string, [string, string]> = { "jan–set/2026": ["2026-01-01", "2026-09-30"], "jan–jul/2026": ["2026-01-01", "2026-07-31"] };
// Simula a view com a carga inicial (mesmos valores de bairrosCurados).
function linhas(): LinhaRadar[] {
  return BAIRROS_CURADOS.flatMap((b) => {
    const est = b.ocupacaoFonte === "bewild";
    const [ini, fim] = b.period ? periodos[b.period] : [null, null];
    const n = b.activeListings;
    const conf = est ? "baixa" : n! >= 1000 ? "alta" : n! >= 200 ? "media" : "baixa";
    const base = { bairro: b.name, amostra_n: n, periodo_inicio: ini, periodo_fim: fim, fonte_id: est ? "estimativa_bewild" : "guestfavorites", fonte_nome: est ? "Estimativa Bewild" : "GuestFavorites", fonte_tipo: est ? "estimativa" : "publica", url_origem: b.sourceUrl, coletado_em: "2026-10-13", confianca: conf } as const;
    const ind: [string, number | null][] = est
      ? [["ocupacao_media_pct", b.avgOccupancy], ["adr_medio_brl", b.dailyAvg], ["adr_p25_brl", b.dailyMin], ["adr_p75_brl", b.dailyMax]]
      : [["ocupacao_media_pct", b.avgOccupancy], ["adr_medio_brl", b.dailyAvg], ["adr_p25_brl", b.dailyQuartiles![0]], ["adr_mediana_brl", b.dailyQuartiles![1]], ["adr_p75_brl", b.dailyQuartiles![2]], ["anuncios_ativos", n]];
    return ind.map(([indicador, valor]) => ({ ...base, indicador, valor: valor! }));
  });
}

describe("base única radar_bairro_atual", () => {
  const bairros = montarBairros(linhas());
  it("reproduz exatamente os números aprovados de cada bairro", () => {
    expect(bairros).toHaveLength(13);
    for (const b of BAIRROS_CURADOS) {
      const r = bairros.find((x) => x.name === b.name)!;
      expect(r).toMatchObject({ dailyAvg: b.dailyAvg, avgOccupancy: b.avgOccupancy, dailyMin: b.dailyMin, dailyMax: b.dailyMax, dailyQuartiles: b.dailyQuartiles, activeListings: b.activeListings, period: b.period, sourceUrl: b.sourceUrl, ocupacaoFonte: b.ocupacaoFonte });
    }
  });
  it.each([["Pinheiros", "alta", false], ["Liberdade", "media", false], ["Mooca", "baixa", true], ["Brooklin", "baixa", true]])("%s: confiança %s, estimativa=%s", (nome, conf, est) => {
    const r = bairros.find((x) => x.name === nome)!;
    expect(r.confianca).toBe(conf);
    expect(r.estimativa).toBe(est);
  });
  it("monta o texto de fonte com período, coleta, n= e selo", () => {
    expect(rotuloFonteRadar(bairros.find((x) => x.name === "Pinheiros")!)).toBe("GuestFavorites, jan–set/2026 · coleta 13/10/2026 · n=2.424 · confiança alta");
  });
});
