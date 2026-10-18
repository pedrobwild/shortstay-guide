import { describe, expect, it } from "vitest";
import { exemploRentabilidadePinheiros, liquidoCenario } from "@/lib/rentabilidadeExample";
import { DESPESAS_EXEMPLO } from "@/data/dreGuia";
import { getBairroCurado } from "@/data/bairrosCurados";
import { IMOVEL_PADRAO, SHORT_STAY_PADRAO, resultadoShortStay } from "@/lib/simuladorReceita";

describe("exemplo de rentabilidade com Pinheiros curado", () => {
  it("usa ADR 300 e ocupação 62% sem alterar o bairro", () => {
    expect(exemploRentabilidadePinheiros().bairro).toMatchObject({ dailyAvg: 300, avgOccupancy: 62 });
    expect(exemploRentabilidadePinheiros().receitaBruta).toBe(5580);
  });
  it("aplica o DRE padrão do guia (Airbnb 3%, gestão 18%, impostos 6%, manutenção 5%) e as despesas do exemplo; não desconta limpeza", () => {
    const e = exemploRentabilidadePinheiros();
    expect(e.plataforma).toBe(167);
    expect(e.gestao).toBe(1004);
    expect(e.impostos).toBe(335);
    expect(e.manutencao).toBe(279);
    expect(e.condominio + e.utilidades).toBe(DESPESAS_EXEMPLO.condominio + DESPESAS_EXEMPLO.contas);
    expect(e.receitaLiquida).toBe(2795);
  });
  it("é a mesma conta do simulador com as premissas padrão (um só líquido público para Pinheiros)", () => {
    const pinheiros = getBairroCurado("Pinheiros")!;
    const r = resultadoShortStay({ diaria: pinheiros.dailyAvg, ocupacaoPct: pinheiros.avgOccupancy }, IMOVEL_PADRAO, SHORT_STAY_PADRAO);
    expect(exemploRentabilidadePinheiros().receitaLiquida).toBe(r.liquido);
  });
  it("cenários didáticos usam a mesma conta", () => {
    expect(liquidoCenario(5580)).toBe(2795);
  });
  it("recalcula sensibilidades a partir da diária e ocupação atuais", () => {
    expect(exemploRentabilidadePinheiros().impactoOcupacao).toBe(450);
    expect(exemploRentabilidadePinheiros().impactoDiaria).toBe(930);
  });
  it("recalcula rentabilidade e prazo de retorno sobre imóvel + ITBI + reforma mediana de R$ 71.850", () => {
    const e = exemploRentabilidadePinheiros();
    expect(e.investimento).toBeCloseTo(409546.83, 2);
    expect(e.yieldLiquido).toBeCloseTo(2795 * 12 / 409546.83 * 100, 3);
    expect(e.paybackAnos).toBeCloseTo(409546.83 / (2795 * 12), 3);
  });
});
