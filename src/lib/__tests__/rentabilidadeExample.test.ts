import { describe, expect, it } from "vitest";
import { exemploRentabilidadePinheiros, liquidoCenario } from "@/lib/rentabilidadeExample";
import { DESPESAS_EXEMPLO } from "@/data/dreGuia";
import { getBairroCurado } from "@/data/bairrosCurados";
import { IMOVEL_PADRAO, SHORT_STAY_PADRAO, resultadoShortStay } from "@/lib/simuladorReceita";

describe("exemplo de rentabilidade com Pinheiros curado", () => {
  it("usa ADR 299 e ocupação 63% (coleta de 18/10/2026) sem alterar o bairro", () => {
    expect(exemploRentabilidadePinheiros().bairro).toMatchObject({ dailyAvg: 299, avgOccupancy: 63 });
    expect(exemploRentabilidadePinheiros().receitaBruta).toBe(5651);
  });
  it("aplica o DRE padrão do guia (Airbnb 15%, gestão 18%, impostos 6%, manutenção 5%) e as despesas do exemplo; não desconta limpeza", () => {
    const e = exemploRentabilidadePinheiros();
    expect(e.plataforma).toBe(848);
    expect(e.gestao).toBe(1017);
    expect(e.impostos).toBe(339);
    expect(e.manutencao).toBe(283);
    expect(e.condominio + e.utilidades).toBe(DESPESAS_EXEMPLO.condominio + DESPESAS_EXEMPLO.contas);
    expect(e.receitaLiquida).toBe(2164);
  });
  it("é a mesma conta do simulador com as premissas padrão (um só líquido público para Pinheiros)", () => {
    const pinheiros = getBairroCurado("Pinheiros")!;
    const r = resultadoShortStay({ diaria: pinheiros.dailyAvg, ocupacaoPct: pinheiros.avgOccupancy }, IMOVEL_PADRAO, SHORT_STAY_PADRAO);
    expect(exemploRentabilidadePinheiros().receitaLiquida).toBe(r.liquido);
  });
  it("cenários didáticos usam a mesma conta", () => {
    expect(liquidoCenario(5651)).toBe(2164);
  });
  it("recalcula sensibilidades a partir da diária e ocupação atuais", () => {
    expect(exemploRentabilidadePinheiros().impactoOcupacao).toBe(448.5); // 299 × 30 × 5 p.p.
    expect(exemploRentabilidadePinheiros().impactoDiaria).toBe(945); // R$ 50 × 30 × 63%
  });
  it("recalcula rentabilidade e prazo de retorno sobre imóvel + ITBI + reforma mediana de R$ 71.850", () => {
    const e = exemploRentabilidadePinheiros();
    expect(e.investimento).toBeCloseTo(409546.83, 2);
    expect(e.yieldLiquido).toBeCloseTo(2164 * 12 / 409546.83 * 100, 3);
    expect(e.paybackAnos).toBeCloseTo(409546.83 / (2164 * 12), 3);
  });
});
