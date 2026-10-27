import { describe, expect, it } from "vitest";
import { PREMISSAS_SIMULADOR_PADRAO, lerPremissasDaQuery } from "@/lib/simuladorReceita";
import { baseMudou, intentDaSimulacao, linkReabrirSimulacao, premissasDoProjeto } from "@/lib/projetoSimulacao";

describe("simulação guardada como projeto", () => {
  it("premissas íntegras sobrevivem ao ida-e-volta", () => {
    const p = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca", diaria: 310, reforma: 90000, imovel: { valorImovel: 400000, condominio: 650, iptu: 120 } };
    expect(premissasDoProjeto({ premissas_simulador: JSON.parse(JSON.stringify(p)) })).toEqual(p);
  });
  it("projeto antigo só com bairro e faixa reabre com o padrão", () => {
    expect(premissasDoProjeto({ neighborhood: "Pinheiros", area_sqm: "20–25 m²" })).toEqual({ ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Pinheiros", area: "20–25 m²" });
    expect(premissasDoProjeto(null)).toEqual(PREMISSAS_SIMULADOR_PADRAO);
  });
  it("o link reabre a mesma conta na /projecao", () => {
    const p = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Santa Cecília", diaria: 250 };
    const link = linkReabrirSimulacao(p);
    expect(link.startsWith("/projecao?")).toBe(true);
    expect(lerPremissasDaQuery(link.slice("/projecao".length)).premissas.diaria).toBe(250);
  });
  it("avisa quando a base mudou desde que a pessoa guardou", () => {
    expect(baseMudou("2026-10-13", "2026-10-18")).toBe(true);
    expect(baseMudou("2026-10-18", "2026-10-18")).toBe(false);
    expect(baseMudou(null, "2026-10-18")).toBe(true);
  });
  it("compara só a data, mesmo com horário no valor", () => {
    expect(baseMudou("2026-10-18T03:00:00+00:00", "2026-10-18")).toBe(false);
  });
  it("intent leva premissas, versão e base, sem dado pessoal", () => {
    const i = intentDaSimulacao({ ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca" }, "2026-10-18");
    expect(Object.keys(i).sort()).toEqual(["area_sqm", "base_coletada_em", "neighborhood", "premissas", "versao_calculo"]);
  });
});
