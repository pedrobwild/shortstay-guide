import { describe, expect, it } from "vitest";
import { exemploRentabilidadePinheiros } from "@/lib/rentabilidadeExample";

describe("exemplo de rentabilidade com Pinheiros curado", () => {
  it("usa ADR 300 e ocupação 62% sem alterar o bairro", () => {
    expect(exemploRentabilidadePinheiros().bairro).toMatchObject({ dailyAvg: 300, avgOccupancy: 62 });
    expect(exemploRentabilidadePinheiros().receitaBruta).toBe(5580);
  });
  it("mantém taxas e custos fixos existentes e não desconta limpeza", () => {
    const e = exemploRentabilidadePinheiros();
    expect(e.plataforma).toBe(837);
    expect(e.gestao).toBeCloseTo(1004.4);
    expect(e.impostos).toBeCloseTo(334.8);
    expect(e.condominio + e.utilidades).toBe(1000);
    expect(e.receitaLiquida).toBeCloseTo(2403.8);
  });
  it("recalcula sensibilidades a partir da diária e ocupação atuais", () => {
    expect(exemploRentabilidadePinheiros().impactoOcupacao).toBe(450);
    expect(exemploRentabilidadePinheiros().impactoDiaria).toBe(930);
  });
});