import { describe, expect, it } from "vitest";
import { DEFAULT_SP_SEASONALITY, generateProjectionEvents, occupancyByMonth, projectionBreakdown, projectionSummary } from "@/lib/projectAnalytics";

// Pinheiros (62% · R$ 300) com as premissas padrão, a partir de 01/10/2026.
const params = {
  occupancyPct: 62, adr: 300, cleaningPerStay: 120, managementPct: 18, taxesPct: 6, condoMonthly: 500,
  propertyValue: 650000, avgStayNights: 3, months: 12, seasonality: DEFAULT_SP_SEASONALITY,
  startDate: new Date(Date.UTC(2026, 9, 1)),
};

const soma = (valores: number[]) => valores.reduce((a, b) => a + b, 0);

describe("detalhamento da projeção (tela /projecao)", () => {
  const r = projectionBreakdown(params);

  it("é a mesma cadeia de cálculo do resumo da projeção", () => {
    const s = projectionSummary(params);
    for (const [chave, valor] of Object.entries(s)) expect(r[chave as keyof typeof r], chave).toEqual(valor);
  });

  it("tem 12 meses, de out/2026 a set/2027", () => {
    expect(r.months).toHaveLength(12);
    expect(r.months[0]).toMatchObject({ monthKey: "2026-10", monthLabel: "out", year: 2026 });
    expect(r.months[11]).toMatchObject({ monthKey: "2027-09", monthLabel: "set", year: 2027 });
  });

  it("a soma dos meses fecha com os totais", () => {
    expect(soma(r.months.map((m) => m.nights))).toBe(r.bookedNights);
    expect(soma(r.months.map((m) => m.stays))).toBe(r.reservationsCount);
    expect(soma(r.months.map((m) => m.grossBrl))).toBeCloseTo(r.grossRevenueBrl, 6);
    expect(soma(r.months.map((m) => m.costsBrl))).toBeCloseTo(r.totalCostsBrl, 6);
    expect(soma(r.months.map((m) => m.netBrl))).toBeCloseTo(r.netRevenueBrl, 6);
  });

  it("custos = limpeza + gestão + impostos + condomínio; líquido = bruta − custos", () => {
    expect(r.cleaningTotalBrl).toBe(120 * r.reservationsCount);
    expect(r.managementTotalBrl).toBeCloseTo(r.grossRevenueBrl * 0.18, 6);
    expect(r.taxesTotalBrl).toBeCloseTo(r.grossRevenueBrl * 0.06, 6);
    expect(r.condoTotalBrl).toBe(500 * 12);
    expect(r.totalCostsBrl).toBeCloseTo(r.cleaningTotalBrl + r.managementTotalBrl + r.taxesTotalBrl + r.condoTotalBrl, 6);
    expect(r.netRevenueBrl).toBeCloseTo(r.grossRevenueBrl - r.totalCostsBrl, 6);
    for (const m of r.months) expect(m.netBrl).toBeCloseTo(m.grossBrl - m.costsBrl, 6);
  });

  it("receita bruta é noites × diária e a ocupação anual fica perto da premissa", () => {
    expect(r.grossRevenueBrl).toBe(r.bookedNights * 300);
    const diasNaJanela = 365;
    expect(Math.abs((r.bookedNights / diasNaJanela) * 100 - 62)).toBeLessThan(2);
  });

  it("indicadores de retorno usam o valor do imóvel informado", () => {
    expect(r.grossYieldPct).toBeCloseTo((r.annualGrossRevenueBrl / 650000) * 100, 6);
    expect(r.capRatePct).toBeCloseTo((r.annualNetRevenueBrl / 650000) * 100, 6);
    expect(r.paybackYears).toBeCloseTo(650000 / r.annualNetRevenueBrl, 6);
  });
});

describe("último mês lotado (sem 13º mês vazio)", () => {
  // Janela de out/2026 a set/2027: setembro tem índice 1,15, então 95% de ocupação lota o último mês
  // e a última estadia termina em 01/10/2027.
  const lotado = { ...params, occupancyPct: 95 };

  it("a janela continua com 12 meses", () => {
    const eventos = generateProjectionEvents({ occupancyPct: 95, avgStayNights: 3, months: 12, seasonality: DEFAULT_SP_SEASONALITY, startDate: params.startDate });
    const ultimo = eventos[eventos.length - 1];
    expect(ultimo.end.toISOString().slice(0, 10)).toBe("2027-10-01");
    expect(occupancyByMonth(eventos).map((m) => m.monthKey)).toHaveLength(12);
  });

  it("a receita anual é a soma dos 12 meses, sem desconto de 1/13", () => {
    const r = projectionBreakdown(lotado);
    expect(r.monthsObserved).toBe(12);
    expect(r.annualGrossRevenueBrl).toBeCloseTo(r.grossRevenueBrl, 6);
    expect(r.annualNetRevenueBrl).toBeCloseTo(r.netRevenueBrl, 6);
    expect(r.condoTotalBrl).toBe(500 * 12);
    expect(soma(r.months.map((m) => m.grossBrl))).toBeCloseTo(r.annualGrossRevenueBrl, 6);
  });
});
