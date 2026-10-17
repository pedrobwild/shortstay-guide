import { describe, expect, it } from "vitest";
import { getBairroCurado } from "@/data/bairrosCurados";
import { DEDUCOES_PADRAO_PCT } from "@/lib/bairroAjustes";
import {
  IMOVEL_PADRAO, RENTABILIDADE_LOCACAO_SP_AA, SHORT_STAY_PADRAO, TRADICIONAL_PADRAO, aluguelReferencia, indicadores, resultadoShortStay, resultadoTradicional,
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
    expect(r.deducoes.find((d) => d.chave === "encargos")!.valor).toBe(60); // (600 + 120) × 1 ÷ 12
    expect(r.liquido).toBe(2140);
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
