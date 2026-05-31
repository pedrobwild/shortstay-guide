import { describe, it, expect } from "vitest";
import {
  buildBwildVsDiyComparison,
  BWILD_VS_DIY_ASSUMPTIONS,
} from "../bwildComparison";

describe("buildBwildVsDiyComparison", () => {
  const base = { baseAdr: 380, baseOccupancyPct: 80, propertyValue: 600_000 };

  it("BWild supera DIY em ocupação, ADR e receita líquida", () => {
    const { diy, bwild, delta } = buildBwildVsDiyComparison(base);

    expect(bwild.occupancyPct).toBeGreaterThan(diy.occupancyPct);
    expect(bwild.adr).toBeGreaterThan(diy.adr);
    expect(bwild.netRevenueBrl).toBeGreaterThan(diy.netRevenueBrl);

    // Delta é positivo e coerente com os cenários
    expect(delta.netRevenueBrl).toBeCloseTo(bwild.netRevenueBrl - diy.netRevenueBrl, 5);
    expect(delta.occupancyPctPoints).toBeGreaterThan(0);
    expect(delta.adrBrl).toBe(bwild.adr - diy.adr);
  });

  it("aplica os multiplicadores centralizados sobre a base de mercado", () => {
    const { diy, bwild } = buildBwildVsDiyComparison(base);
    expect(diy.adr).toBe(Math.round(base.baseAdr * BWILD_VS_DIY_ASSUMPTIONS.diy.adrMultiplier));
    expect(bwild.adr).toBe(Math.round(base.baseAdr * BWILD_VS_DIY_ASSUMPTIONS.bwild.adrMultiplier));
    expect(bwild.managementPct).toBe(BWILD_VS_DIY_ASSUMPTIONS.bwild.managementPct);
    expect(diy.managementPct).toBe(BWILD_VS_DIY_ASSUMPTIONS.diy.managementPct);
  });

  it("respeita o teto de ocupação para bairros de alta demanda", () => {
    const { bwild } = buildBwildVsDiyComparison({ ...base, baseOccupancyPct: 95 });
    // 95 * 1.06 = 100.7, deve ser limitado pelo teto
    expect(bwild.occupancyPct).toBeLessThanOrEqual(BWILD_VS_DIY_ASSUMPTIONS.occupancyCapPct + 0.5);
  });

  it("payback do BWild é mais curto quando há valor do imóvel", () => {
    const { diy, bwild, delta } = buildBwildVsDiyComparison(base);
    expect(bwild.paybackYears).not.toBeNull();
    expect(diy.paybackYears).not.toBeNull();
    expect(bwild.paybackYears!).toBeLessThan(diy.paybackYears!);
    expect(delta.paybackYearsShorter).toBeGreaterThan(0);
  });

  it("payback nulo quando não há valor do imóvel", () => {
    const { diy, bwild, delta } = buildBwildVsDiyComparison({ ...base, propertyValue: 0 });
    expect(bwild.paybackYears).toBeNull();
    expect(diy.paybackYears).toBeNull();
    expect(delta.paybackYearsShorter).toBeNull();
  });
});
