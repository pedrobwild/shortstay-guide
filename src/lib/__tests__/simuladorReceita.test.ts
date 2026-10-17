import { describe, expect, it } from "vitest";
import { getBairroCurado } from "@/data/bairrosCurados";
import { DEDUCOES_PADRAO_PCT } from "@/lib/bairroAjustes";
import {
  CHAVE_CENARIOS, CHAVE_CENARIOS_ANTIGA, CHAVE_RASCUNHO, CHAVE_RASCUNHO_PROJECAO, IMOVEL_PADRAO, PREMISSAS_SIMULADOR_PADRAO, RENTABILIDADE_LOCACAO_SP_AA,
  SHORT_STAY_PADRAO, TRADICIONAL_PADRAO, aluguelReferencia, indicadores, lerCenarios, lerPremissasDaQuery, lerRascunho, mesAMes, normalizarPremissasSimulador,
  premissasParaQuery, recalcularCenario, resultadoShortStay, resultadoTradicional, salvarRascunho, type PremissasSimulador,
} from "@/lib/simuladorReceita";

const pinheiros = getBairroCurado("Pinheiros")!;
const semFixas = { valorImovel: 0, condominio: 0, iptu: 0 };

describe("short stay: da receita bruta ao líquido", () => {
  it("receita bruta de Pinheiros = diária × 30 × ocupação (R$ 5.580)", () => {
    const r = resultadoShortStay({ diaria: pinheiros.dailyAvg, ocupacaoPct: pinheiros.avgOccupancy }, semFixas, { ...SHORT_STAY_PADRAO, contas: 0 });
    expect(r.receitaBruta).toBe(5580);
    // Só percentuais do DRE padrão: Airbnb 3% + gestão 20% + impostos 6% + manutenção 5% = 34% da bruta.
    expect(r.totalDeducoes).toBe(Math.round(5580 * 0.03) + Math.round(5580 * 0.2) + Math.round(5580 * 0.06) + Math.round(5580 * 0.05));
    expect(r.liquido).toBe(r.receitaBruta - r.totalDeducoes);
    expect(r.liquidoAnual).toBe(r.liquido * 12);
  });

  it("as premissas padrão vêm do DRE do guia (45% com fixos e utilities)", () => {
    const { airbnbPct, gestaoPct, impostosPct, manutencaoPct } = SHORT_STAY_PADRAO;
    // Fixos (8%) e utilities (3%) entram em reais na tela; os percentuais somam o resto do DRE.
    expect(airbnbPct + gestaoPct + impostosPct + manutencaoPct).toBe(DEDUCOES_PADRAO_PCT - 8 - 3);
  });

  it("despesas fixas entram em reais e só aparecem quando informadas", () => {
    const r = resultadoShortStay({ diaria: 300, ocupacaoPct: 60 }, { valorImovel: 0, condominio: 500, iptu: 120 }, { ...SHORT_STAY_PADRAO, contas: 0 });
    const chaves = r.deducoes.map((d) => d.chave);
    expect(chaves).toContain("condominio");
    expect(chaves).toContain("iptu");
    expect(chaves).not.toContain("contas");
    expect(r.deducoes.find((d) => d.chave === "iptu")!.valor).toBe(120);
  });

  it("o multiplicador de decoração entra pela diária, nunca pela ocupação", () => {
    const base = resultadoShortStay({ diaria: 300, ocupacaoPct: 60 }, semFixas, SHORT_STAY_PADRAO);
    const premium = resultadoShortStay({ diaria: 300 * 1.2, ocupacaoPct: 60 }, semFixas, SHORT_STAY_PADRAO);
    expect(premium.receitaBruta).toBe(Math.round(base.receitaBruta * 1.2));
  });

  it("líquido pode ficar negativo com custos fixos acima da receita", () => {
    const r = resultadoShortStay({ diaria: 100, ocupacaoPct: 10 }, { valorImovel: 0, condominio: 2000, iptu: 0 }, SHORT_STAY_PADRAO);
    expect(r.liquido).toBeLessThan(0);
    expect(r.margem).toBeLessThan(0);
  });
});

describe("locação tradicional", () => {
  it("aluguel de partida = valor do imóvel × rentabilidade FipeZAP ÷ 12, em passos de R$ 50", () => {
    expect(RENTABILIDADE_LOCACAO_SP_AA).toBe(6.3);
    expect(aluguelReferencia(500_000)).toBe(Math.round((500_000 * 0.063 / 12) / 50) * 50); // R$ 2.650
    expect(aluguelReferencia(0)).toBe(0);
  });

  it("vacância reduz a receita média e deixa condomínio e IPTU com o proprietário nesses meses", () => {
    const r = resultadoTradicional({ valorImovel: 0, condominio: 600, iptu: 120 }, { ...TRADICIONAL_PADRAO, aluguel: 2400, vacanciaMeses: 1 });
    expect(r.receitaBruta).toBe(2200); // 2.400 × 11 ÷ 12
    const encargos = r.deducoes.find((d) => d.chave === "encargos")!;
    expect(encargos.valor).toBe(60); // (600 + 120) × 1 ÷ 12
    expect(encargos.base).toBe("só no mês sem inquilino");
    expect(r.liquido).toBe(2140);
    const dois = resultadoTradicional({ valorImovel: 0, condominio: 600, iptu: 120 }, { ...TRADICIONAL_PADRAO, aluguel: 2400, vacanciaMeses: 2 });
    expect(dois.deducoes.find((d) => d.chave === "encargos")!.base).toBe("só nos 2 meses sem inquilino");
  });

  it("sem vacância e com encargos no inquilino, não há dedução de condomínio e IPTU", () => {
    const r = resultadoTradicional({ valorImovel: 0, condominio: 600, iptu: 120 }, { ...TRADICIONAL_PADRAO, aluguel: 2400, vacanciaMeses: 0 });
    expect(r.deducoes.map((d) => d.chave)).not.toContain("encargos");
    expect(r.liquido).toBe(2400);
  });

  it("com o proprietário pagando os encargos, eles entram inteiros; administração e IR saem do aluguel recebido", () => {
    const r = resultadoTradicional({ valorImovel: 0, condominio: 600, iptu: 120 }, { aluguel: 2400, administracaoPct: 10, vacanciaMeses: 0, encargosPeloInquilino: false, manutencaoPct: 0, irPct: 7.5 });
    expect(r.deducoes.find((d) => d.chave === "encargos")!.valor).toBe(720);
    expect(r.deducoes.find((d) => d.chave === "administracao")!.valor).toBe(240);
    expect(r.deducoes.find((d) => d.chave === "ir")!.valor).toBe(180);
    expect(r.deducoes.find((d) => d.chave === "ir")!.base).toBe("7,5% do aluguel recebido"); // vírgula decimal (numberFormat)
    expect(r.liquido).toBe(2400 - 720 - 240 - 180);
  });
});

describe("indicadores sobre o valor do imóvel", () => {
  it("sem valor do imóvel não há rentabilidade nem prazo de retorno", () => {
    const r = resultadoShortStay({ diaria: 300, ocupacaoPct: 60 }, IMOVEL_PADRAO, SHORT_STAY_PADRAO);
    expect(indicadores(r, 0)).toBeNull();
  });

  it("rentabilidade líquida anual e prazo de retorno", () => {
    const r = resultadoTradicional({ valorImovel: 500_000, condominio: 0, iptu: 0 }, { ...TRADICIONAL_PADRAO, aluguel: 2500, vacanciaMeses: 0 });
    const i = indicadores(r, 500_000)!;
    expect(i.rentabilidadeAA).toBeCloseTo(6, 5);
    expect(i.paybackAnos).toBeCloseTo(500_000 / 30_000, 5);
  });
});

describe("premissas completas: link, rascunho e cenários", () => {
  const base = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Vila Mariana" };

  it("ida e volta: só o que difere do padrão vai na URL e volta igual", () => {
    const p: PremissasSimulador = {
      ...base, modo: "tradicional", area: "20–25 m²", decoracao: "premium", diaria: 260, ocupacao: 62,
      imovel: { valorImovel: 500_000, condominio: 650, iptu: 120 }, reforma: 71_850,
      shortStay: { ...SHORT_STAY_PADRAO, gestaoPct: 15 }, aluguel: 2_700,
      tradicional: { ...TRADICIONAL_PADRAO, vacanciaMeses: 2, encargosPeloInquilino: false, irPct: 7.5 },
    };
    const query = premissasParaQuery(p, "vila-mariana");
    expect(query).toBe("bairro=vila-mariana&modo=tradicional&area=20%E2%80%9325+m%C2%B2&dec=premium&diaria=260&occ=62&valor=500000&cond=650&iptu=120&reforma=71850&gestao=15&aluguel=2700&vac=2&enc=0&ir=7.5");
    const lido = lerPremissasDaQuery(`?${query}`);
    expect(lido.slugBairro).toBe("vila-mariana");
    expect(lido.veioAlgo).toBe(true);
    expect(normalizarPremissasSimulador({ ...base, ...lido.premissas })).toEqual(p);
  });

  it("padrões não vão na URL; só o bairro não conta como link compartilhado", () => {
    expect(premissasParaQuery(base, "pinheiros")).toBe("bairro=pinheiros");
    expect(lerPremissasDaQuery("?bairro=pinheiros")).toEqual({ slugBairro: "pinheiros", premissas: {}, veioAlgo: false });
  });

  it("lê o formato anterior do simulador da home (m, occ, diaria, boost, reforma)", () => {
    const { premissas, veioAlgo } = lerPremissasDaQuery("?bairro=pinheiros&m=27&occ=62&diaria=260&obj=premium&boost=20&reforma=71850");
    expect(veioAlgo).toBe(true);
    expect(premissas).toMatchObject({ area: "26–35 m²", ocupacao: 62, diaria: 260, decoracao: "premium", reforma: 71850 });
  });

  it("ignora valores fora das faixas ou malformados", () => {
    const { premissas } = lerPremissasDaQuery("?bairro=pinheiros&occ=20&diaria=-3&dec=hack&valor=abc&modo=x");
    expect(premissas.ocupacao).toBeNull();
    expect(premissas.diaria).toBeNull();
    expect(premissas.decoracao).toBe("basico");
    expect(premissas.modo).toBe("short_stay");
    expect(premissas).not.toHaveProperty("imovel");
  });

  it("rascunho: lê o atual, migra o da /projecao anterior e cai no padrão se ilegível", () => {
    const mem = new Map<string, string>();
    const arm = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
    expect(lerRascunho(arm)).toEqual(PREMISSAS_SIMULADOR_PADRAO);
    mem.set(CHAVE_RASCUNHO_PROJECAO, JSON.stringify({ bairro: "Moema", area: "36–50 m²", valorImovel: 400_000, condominio: 700, diaria: 280, ocupacao: 70, gestao: 15, impostos: 6, limpeza: 120, estadia: 3 }));
    expect(lerRascunho(arm)).toMatchObject({ bairro: "Moema", area: "36–50 m²", diaria: 280, ocupacao: 70, imovel: { valorImovel: 400_000, condominio: 700, iptu: 0 }, shortStay: { gestaoPct: 15 } });
    salvarRascunho({ ...base, reforma: 50_000 }, arm);
    expect(lerRascunho(arm).reforma).toBe(50_000);
    mem.set(CHAVE_RASCUNHO, "{não é json");
    expect(lerRascunho(arm)).toEqual(PREMISSAS_SIMULADOR_PADRAO);
  });

  it("cenários: migra os do simulador anterior uma vez", () => {
    const mem = new Map<string, string>();
    const arm = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
    mem.set(CHAVE_CENARIOS_ANTIGA, JSON.stringify([{ id: "a", name: "Cenário 1 — Pinheiros 30m²", bairro: "Pinheiros", metragem: 30, ocupacao: 70, diariaAtual: "320", rateBoost: 30, reformaBudget: "72000", receitaMensal: 6720 }]));
    const lista = lerCenarios(arm);
    expect(lista).toHaveLength(1);
    expect(lista[0].premissas).toMatchObject({ bairro: "Pinheiros", area: "26–35 m²", ocupacao: 70, diaria: 320, decoracao: "alto", reforma: 72000 });
    expect(mem.has(CHAVE_CENARIOS)).toBe(true);
  });
});

describe("mês a mês", () => {
  it("reparte a receita anual pela sazonalidade e a soma bate com o ano", () => {
    const r = resultadoShortStay({ diaria: 300, ocupacaoPct: 60 }, { valorImovel: 0, condominio: 500, iptu: 100 }, SHORT_STAY_PADRAO);
    const meses = mesAMes(r, [0.85, 0.95, 1.1, 1.1, 1, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 0.85], new Date(Date.UTC(2026, 10, 1)));
    expect(meses).toHaveLength(12);
    expect(meses[0]).toMatchObject({ chave: "2026-11", rotulo: "nov", ano: 2026 });
    expect(meses[11]).toMatchObject({ chave: "2027-10", rotulo: "out", ano: 2027 });
    const somaBruta = meses.reduce((s, m) => s + m.bruta, 0);
    expect(Math.abs(somaBruta - r.receitaBruta * 12)).toBeLessThanOrEqual(12); // arredondamento por mês
    // Fixos (condomínio + IPTU + contas = R$ 1.100) iguais todo mês; o resto acompanha a receita.
    const fixos = 500 + 100 + SHORT_STAY_PADRAO.contas;
    for (const m of meses) expect(m.custos - Math.round(m.bruta * 0.34)).toBe(fixos);
  });
});

describe("cenário migrado recalculado com a base", () => {
  it("usa diária × decoração e ocupação do cenário; cenário sem bairro na base fica como está", () => {
    const base = [{ name: "Pinheiros", dailyAvg: 300, avgOccupancy: 62 }];
    const c = { id: "x", nome: "Cenário", premissas: normalizarPremissasSimulador({ bairro: "Pinheiros", decoracao: "premium", ocupacao: 70 }), receitaBruta: 0, liquido: 0, criadoEm: 0 };
    const r = recalcularCenario(c, base);
    expect(r.receitaBruta).toBe(Math.round(360 * 30 * 0.7)); // R$ 7.560
    expect(r.liquido).toBe(resultadoShortStay({ diaria: 360, ocupacaoPct: 70 }, c.premissas.imovel, c.premissas.shortStay).liquido);
    expect(recalcularCenario({ ...c, premissas: { ...c.premissas, bairro: "Fora" } }, base).liquido).toBe(0);
  });
});
