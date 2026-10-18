import { describe, expect, it } from "vitest";
import { diferencasColeta, periodoColeta, type ColetaPendente } from "@/lib/coletasPendentes";

const base: ColetaPendente = {
  id: "1", bairro: "Pinheiros", periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", coletado_em: "2026-10-18", publicado_em: "2026-10-17",
  amostra_n: 2452, url_origem: "https://www.guestfavorites.com/airbnb-occupancy-rates-in-pinheiros-sao-paulo-brazil",
  indicadores: { adr_medio_brl: 299, ocupacao_media_pct: 63, adr_p25_brl: 171, adr_mediana_brl: 232, adr_p75_brl: 301 },
  atual: { adr_medio_brl: 300, ocupacao_media_pct: 62, adr_p25_brl: 171, adr_mediana_brl: 232, adr_p75_brl: 301, anuncios_ativos: 2424, periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", coletado_em: "2026-10-13" },
  status: "pendente", motivo: null, criado_em: "2026-10-18T12:00:00Z",
};

describe("diferencasColeta", () => {
  it("mostra antes → depois em pt-BR e marca só o que mudou", () => {
    const linhas = diferencasColeta(base);
    expect(linhas.map((l) => l.label)).toEqual(["Ocupação média", "Diária média", "Diária — 25% mais baratos", "Diária — mediana", "Diária — 25% mais caros", "Anúncios ativos"]);
    expect(linhas[0]).toMatchObject({ antes: "62%", depois: "63%", mudou: true });
    expect(linhas[1]).toMatchObject({ antes: "R$ 300", depois: "R$ 299", mudou: true });
    expect(linhas[2]).toMatchObject({ antes: "R$ 171", depois: "R$ 171", mudou: false });
    expect(linhas[5]).toMatchObject({ antes: "2.424", depois: "2.452", mudou: true });
  });

  it("bairro sem coleta ativa: coluna 'atual' vazia, sem inventar valor", () => {
    const linhas = diferencasColeta({ ...base, atual: null });
    expect(linhas.every((l) => l.antes === null && l.mudou)).toBe(true);
  });

  it("não lista quartis quando a página não os trouxe nem a base os tem", () => {
    const linhas = diferencasColeta({ ...base, indicadores: { adr_medio_brl: 265, ocupacao_media_pct: 60 }, atual: { adr_medio_brl: 266, ocupacao_media_pct: 60, anuncios_ativos: 34854 } });
    expect(linhas.map((l) => l.chave)).toEqual(["ocupacao_media_pct", "adr_medio_brl", "anuncios_ativos"]);
  });
});

describe("periodoColeta", () => {
  it("mesmo período: não marca mudança", () => {
    expect(periodoColeta(base)).toEqual({ depois: "01/01/2026 — 30/09/2026", antes: "01/01/2026 — 30/09/2026", mudou: false });
  });
  it("período estendido (jan–jul → jan–set): marca mudança", () => {
    const p = periodoColeta({ ...base, atual: { ...base.atual, periodo_fim: "2026-07-31" } });
    expect(p.mudou).toBe(true);
    expect(p.antes).toBe("01/01/2026 — 31/07/2026");
  });
});
