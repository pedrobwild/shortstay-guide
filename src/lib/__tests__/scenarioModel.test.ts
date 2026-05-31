import { describe, it, expect } from "vitest";
import {
  presetAssumptions,
  scenarioSummary,
  pctDelta,
  scenarioKindLabel,
  SCENARIO_PRESETS,
  DEFAULT_OCCUPANCY_PCT,
} from "../scenarioModel";
import type { BairroItem } from "@/data/guide-data";

const bairro: BairroItem = {
  name: "Pinheiros",
  dailyMin: 300,
  dailyMax: 470,
  avgOccupancy: 80,
  perSqm: 11,
  avgBySize: { "20–25 m²": 300, "26–35 m²": 380, "36–50 m²": 470 },
};

describe("presetAssumptions", () => {
  it("ancora ocupação e ADR na banda de mercado do bairro/faixa", () => {
    const realista = presetAssumptions("realista", bairro, "26–35 m²");
    expect(realista.occupancyPct).toBe(80);
    expect(realista.adr).toBe(380);
  });

  it("ordena conservador < realista < otimista em ocupação e ADR", () => {
    const c = presetAssumptions("conservador", bairro, "26–35 m²");
    const r = presetAssumptions("realista", bairro, "26–35 m²");
    const o = presetAssumptions("otimista", bairro, "26–35 m²");
    expect(c.occupancyPct).toBeLessThan(r.occupancyPct);
    expect(r.occupancyPct).toBeLessThan(o.occupancyPct);
    expect(c.adr).toBeLessThan(r.adr);
    expect(r.adr).toBeLessThan(o.adr);
  });

  it("usa defaults quando o bairro é desconhecido", () => {
    const r = presetAssumptions("realista", undefined, "26–35 m²");
    expect(r.occupancyPct).toBe(DEFAULT_OCCUPANCY_PCT);
    expect(r.adr).toBeGreaterThan(0);
  });

  it("mantém a ocupação no intervalo 0–100", () => {
    const high: BairroItem = { ...bairro, avgOccupancy: 98 };
    const o = presetAssumptions("otimista", high, "26–35 m²");
    expect(o.occupancyPct).toBeLessThanOrEqual(100);
  });

  it("carrega o valor do imóvel entre cenários", () => {
    const r = presetAssumptions("realista", bairro, "26–35 m²", 850000);
    expect(r.propertyValue).toBe(850000);
  });
});

describe("scenarioSummary", () => {
  it("ranqueia a receita líquida anual: conservador < realista < otimista", () => {
    const c = scenarioSummary(presetAssumptions("conservador", bairro, "26–35 m²", 800000));
    const r = scenarioSummary(presetAssumptions("realista", bairro, "26–35 m²", 800000));
    const o = scenarioSummary(presetAssumptions("otimista", bairro, "26–35 m²", 800000));
    expect(c.annualNetRevenueBrl).toBeLessThan(r.annualNetRevenueBrl);
    expect(r.annualNetRevenueBrl).toBeLessThan(o.annualNetRevenueBrl);
  });

  it("não calcula cap rate sem valor do imóvel", () => {
    const s = scenarioSummary(presetAssumptions("realista", bairro, "26–35 m²", 0));
    expect(s.capRatePct).toBe(0);
    expect(s.paybackYears).toBeNull();
  });

  it("calcula cap rate e payback positivos com valor do imóvel", () => {
    const s = scenarioSummary(presetAssumptions("realista", bairro, "26–35 m²", 800000));
    expect(s.capRatePct).toBeGreaterThan(0);
    expect(s.paybackYears).not.toBeNull();
    expect(s.paybackYears!).toBeGreaterThan(0);
  });
});

describe("pctDelta", () => {
  it("calcula variação percentual relativa", () => {
    expect(pctDelta(110, 100)).toBeCloseTo(10);
    expect(pctDelta(90, 100)).toBeCloseTo(-10);
  });

  it("trata baseline zero", () => {
    expect(pctDelta(0, 0)).toBe(0);
    expect(pctDelta(50, 0)).toBe(100);
  });
});

describe("scenarioKindLabel", () => {
  it("rotula presets e custom", () => {
    expect(scenarioKindLabel("realista")).toBe("Realista");
    expect(scenarioKindLabel("custom")).toBe("Cenário");
  });

  it("expõe exatamente 3 presets", () => {
    expect(SCENARIO_PRESETS.map((p) => p.kind)).toEqual([
      "conservador",
      "realista",
      "otimista",
    ]);
  });
});
