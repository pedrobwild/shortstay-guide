import { describe, expect, it } from "vitest";
import { PREMISSAS_SIMULADOR_PADRAO, lerPremissasDaQuery, normalizarPremissasSimulador, premissasParaQuery, type PremissasSimulador } from "@/lib/simuladorReceita";
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

  it("conta igual ao padrão também reabre como link recebido (marcador reabrir=1)", () => {
    const p = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca" };
    const link = linkReabrirSimulacao(p);
    expect(link).toBe("/projecao?bairro=mooca&reabrir=1");
    const lido = lerPremissasDaQuery(link.slice("/projecao".length));
    expect(lido.veioAlgo).toBe(true);
    expect(lido.slugBairro).toBe("mooca");
    expect(normalizarPremissasSimulador({ ...PREMISSAS_SIMULADOR_PADRAO, ...lido.premissas })).toEqual(PREMISSAS_SIMULADOR_PADRAO);
    // sem bairro e tudo padrão: a query não fica vazia
    const semBairro = linkReabrirSimulacao(PREMISSAS_SIMULADOR_PADRAO);
    expect(semBairro).toBe("/projecao?reabrir=1");
    expect(lerPremissasDaQuery(semBairro.slice("/projecao".length)).veioAlgo).toBe(true);
  });
  it("link compartilhado comum, sem o marcador, mantém o comportamento", () => {
    expect(lerPremissasDaQuery("?bairro=mooca").veioAlgo).toBe(false);
    expect(lerPremissasDaQuery("").veioAlgo).toBe(false);
    expect(lerPremissasDaQuery("?diaria=250").veioAlgo).toBe(true);
    expect(lerPremissasDaQuery("?reabrir=0").veioAlgo).toBe(false);
  });
  it("o marcador não é premissa nem sai do link compartilhável", () => {
    expect(premissasParaQuery({ ...PREMISSAS_SIMULADOR_PADRAO, diaria: 250 }, "mooca")).not.toContain("reabrir");
    expect(lerPremissasDaQuery("?reabrir=1&diaria=250").premissas).toEqual({ diaria: 250 });
  });
  it("ida e volta completa: premissas -> link -> leitura reconstrói a mesma conta", () => {
    const p: PremissasSimulador = {
      ...PREMISSAS_SIMULADOR_PADRAO,
      modo: "tradicional", bairro: "Santa Cecília", area: "36–50 m²", decoracao: "premium",
      diaria: 280, ocupacao: 66, reforma: 95000, aluguel: 2800,
      imovel: { valorImovel: 450000, condominio: 700, iptu: 130 },
      shortStay: { airbnbPct: 14, gestaoPct: 20, impostosPct: 5, manutencaoPct: 6, contas: 400 },
      tradicional: { administracaoPct: 9, vacanciaMeses: 2, encargosPeloInquilino: false, manutencaoPct: 4, irPct: 15 },
    };
    // premissa de cada bloco realmente difere do padrão (o teste não é vazio)
    expect(p.shortStay).not.toEqual(PREMISSAS_SIMULADOR_PADRAO.shortStay);
    expect(p.tradicional).not.toEqual(PREMISSAS_SIMULADOR_PADRAO.tradicional);
    const link = linkReabrirSimulacao(p);
    const lido = lerPremissasDaQuery(link.slice("/projecao".length));
    expect(lido.veioAlgo).toBe(true);
    // o bairro volta pelo slug; a /projecao o resolve para o nome na base
    expect(lido.slugBairro).toBe("santa-cecilia");
    expect(normalizarPremissasSimulador({ ...PREMISSAS_SIMULADOR_PADRAO, ...lido.premissas, bairro: p.bairro })).toEqual(p);
  });
});
