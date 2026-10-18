import { describe, it, expect } from "vitest";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { alertasFonteRadar, anexarReferencias, rotuloReferenciaBewild, montarBairros, rotuloFonteRadar, type LinhaRadar } from "@/lib/radarBase";

const periodos: Record<string, [string, string]> = { "jan–set/2026": ["2026-01-01", "2026-09-30"], "jan–jul/2026": ["2026-01-01", "2026-07-31"] };
// Simula a view com a carga inicial (mesmos valores de bairrosCurados).
function linhas(): LinhaRadar[] {
  return BAIRROS_CURADOS.flatMap((b) => {
    const est = b.ocupacaoFonte === "bewild"; const ap = b.ocupacaoFonte === "aproximacao";
    const [ini, fim] = b.period ? periodos[b.period] : [null, null];
    const n = b.activeListings;
    const conf = est || ap ? "baixa" : n! >= 1000 ? "alta" : n! >= 200 ? "media" : "baixa";
    const base = { bairro: b.name, amostra_n: n, periodo_inicio: ini, periodo_fim: fim, fonte_id: ap ? "aproximacao_itaim_bibi" : est ? "estimativa_bewild" : "guestfavorites", fonte_nome: ap ? "GuestFavorites (aproximação pelo Itaim Bibi)" : est ? "Estimativa Bewild" : "GuestFavorites", fonte_tipo: est || ap ? "estimativa" : "publica", url_origem: b.sourceUrl, coletado_em: b.coletadoEm ?? "2026-10-13", confianca: conf } as const;
    const ind: [string, number | null][] = est
      ? [["ocupacao_media_pct", b.avgOccupancy], ["adr_medio_brl", b.dailyAvg], ["adr_p25_brl", b.dailyMin], ["adr_p75_brl", b.dailyMax]]
      : ap ? [["ocupacao_media_pct", b.avgOccupancy], ["adr_medio_brl", b.dailyAvg], ["adr_p25_brl", b.dailyQuartiles![0]], ["adr_mediana_brl", b.dailyQuartiles![1]], ["adr_p75_brl", b.dailyQuartiles![2]]]
      : [["ocupacao_media_pct", b.avgOccupancy], ["adr_medio_brl", b.dailyAvg], ["adr_p25_brl", b.dailyQuartiles![0]], ["adr_mediana_brl", b.dailyQuartiles![1]], ["adr_p75_brl", b.dailyQuartiles![2]], ["anuncios_ativos", n]];
    return ind.map(([indicador, valor]) => ({ ...base, indicador, valor: valor! }));
  });
}

describe("base única radar_bairro_atual", () => {
  const bairros = montarBairros(linhas());
  it("reproduz exatamente os números aprovados de cada bairro", () => {
    expect(bairros).toHaveLength(28);
    for (const b of BAIRROS_CURADOS) {
      const r = bairros.find((x) => x.name === b.name)!;
      expect(r).toMatchObject({ dailyAvg: b.dailyAvg, avgOccupancy: b.avgOccupancy, dailyMin: b.dailyMin, dailyMax: b.dailyMax, dailyQuartiles: b.dailyQuartiles, activeListings: b.activeListings, period: b.period, sourceUrl: b.sourceUrl, ocupacaoFonte: b.ocupacaoFonte });
    }
  });
  it.each([["Pinheiros", "alta", false], ["Liberdade", "media", false], ["Mooca", "baixa", false], ["Brooklin", "baixa", true]])("%s: confiança %s, estimativa=%s", (nome, conf, est) => {
    const r = bairros.find((x) => x.name === nome)!;
    expect(r.confianca).toBe(conf);
    expect(r.estimativa).toBe(est);
  });
  const mooca = bairros.find((b) => b.name === "Mooca");
  it("Mooca é pública com 85 anúncios e alerta de amostra pequena, não estimativa", () => {
    expect(mooca).toBeDefined();
    if (!mooca) throw new Error("Mooca ausente");
    expect(mooca.amostraN).toBe(85);
    expect(alertasFonteRadar(mooca)).toEqual({ estimativa: false, amostraPequena: true, desatualizado: false });
  });
  it("Brooklin tem alerta apenas de estimativa", () => {
    const brooklin = bairros.find((b) => b.name === "Brooklin");
    if (!brooklin) throw new Error("Brooklin ausente");
    expect(alertasFonteRadar(brooklin)).toEqual({ estimativa: true, amostraPequena: false, desatualizado: false });
  });
  it.each([[199, true], [200, false], [null, false]])("amostra pública n=%s: pequena=%s", (amostraN, pequena) => {
    if (!mooca) throw new Error("Mooca ausente");
    expect(alertasFonteRadar({ ...mooca, amostraN }).amostraPequena).toBe(pequena);
  });
  it.each([[240, false], [241, true]])("coleta pública há %s dias: desatualizada=%s sem virar estimativa", (idadeDias, desatualizado) => {
    if (!mooca) throw new Error("Mooca ausente");
    expect(alertasFonteRadar({ ...mooca, idadeDias, amostraN: 553 })).toEqual({ estimativa: false, amostraPequena: false, desatualizado });
  });
  it("fonte estimativa não recebe alertas de fonte pública mesmo com amostra pequena e antiga", () => {
    if (!mooca) throw new Error("Mooca ausente");
    expect(alertasFonteRadar({ ...mooca, fonteTipo: "estimativa", idadeDias: 241 })).toEqual({ estimativa: true, amostraPequena: false, desatualizado: false });
  });
  it("Brooklin mostra fonte_nome de aproximação", () => {
    expect(rotuloFonteRadar(bairros.find((x) => x.name === "Brooklin")!)).toBe("GuestFavorites (aproximação pelo Itaim Bibi), jan–set/2026 · coleta 13/10/2026 · confiança baixa");
  });
  it("anexa estimativa Bewild só como referência, sem mudar o número principal", () => {
    const ref = [["adr_medio_brl", 415], ["ocupacao_media_pct", 79], ["adr_p25_brl", 330], ["adr_p75_brl", 500]].map(([indicador, valor]) => ({ bairro: "Vila Olímpia", indicador: String(indicador), valor: Number(valor) }));
    const vo = anexarReferencias(bairros, ref).find((b) => b.name === "Vila Olímpia")!;
    expect(vo).toMatchObject({ dailyAvg: 359, avgOccupancy: 59, referenciaBewild: { dailyAvg: 415, avgOccupancy: 79, dailyMin: 330, dailyMax: 500 } });
    expect(anexarReferencias(bairros, [{ ...ref[0], bairro: "Consolação" }]).find((b) => b.name === "Consolação")!.referenciaBewild).toBeUndefined();
    expect(rotuloReferenciaBewild(vo.referenciaBewild!)).toBe("Estimativa Bewild: diária R$ 415 · ocupação 79% (dados anteriores da Bewild, sem fonte pública)");
  });
  it("monta o texto de fonte com período, coleta, n= e selo", () => {
    expect(rotuloFonteRadar(bairros.find((x) => x.name === "Pinheiros")!)).toBe("GuestFavorites, jan–set/2026 · coleta 13/10/2026 · n=2.424 · confiança alta");
  });
});
