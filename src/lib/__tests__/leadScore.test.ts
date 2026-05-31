import { describe, it, expect } from "vitest";
import { computeLeadScore, scoreToTier, type LeadSignals } from "../leadScore";

const cold: LeadSignals = {
  neighborhood: null,
  area_sqm: null,
  objective: null,
  has_account: false,
  project_count: 0,
  property_value: null,
  max_scroll: 0,
  sections_viewed: 0,
  simulator_uses: 0,
  exported_simulation: false,
  quiz_interactions: 0,
  chatbot_interactions: 0,
  cta_clicks: 0,
};

describe("computeLeadScore", () => {
  it("gives a freshly captured lead with no activity a score of 0 (frio)", () => {
    const r = computeLeadScore(cold);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("frio");
  });

  it("maxes out at exactly 100 for a fully engaged, converted lead", () => {
    const hot: LeadSignals = {
      neighborhood: "Pinheiros",
      area_sqm: "26-35",
      objective: "comprar",
      has_account: true,
      project_count: 2,
      property_value: 450000,
      max_scroll: 100,
      sections_viewed: 12, // acima do cap, deve saturar
      simulator_uses: 4,
      exported_simulation: true,
      quiz_interactions: 3,
      chatbot_interactions: 5,
      cta_clicks: 2,
    };
    const r = computeLeadScore(hot);
    expect(r.score).toBe(100);
    expect(r.tier).toBe("quente");
  });

  it("never exceeds 100 even with extreme signal values", () => {
    const r = computeLeadScore({
      ...cold,
      max_scroll: 999,
      sections_viewed: 999,
      simulator_uses: 999,
      property_value: 9_999_999,
      has_account: true,
      project_count: 99,
      exported_simulation: true,
      quiz_interactions: 99,
      chatbot_interactions: 99,
      cta_clicks: 99,
      neighborhood: "x",
      area_sqm: "y",
      objective: "z",
    });
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("weights commercial intent (property value + account) heavily", () => {
    const intent = computeLeadScore({
      ...cold,
      has_account: true,
      project_count: 1,
      property_value: 500000,
    });
    // 10 (conta) + 5 (projeto) + 20 (valor) = 35
    expect(intent.score).toBe(35);
    expect(intent.tier).toBe("frio");
  });

  it("scales scroll depth proportionally", () => {
    const half = computeLeadScore({ ...cold, max_scroll: 50 });
    // 50% de 12 = 6
    expect(half.factors.find((f) => f.key === "scrollDepth")?.points).toBe(6);
  });

  it("counts partial lead completeness", () => {
    const r = computeLeadScore({ ...cold, neighborhood: "Itaim", area_sqm: "20-25" });
    // bairro (3) + m² (3) = 6, objetivo ausente
    expect(r.factors.find((f) => f.key === "completeness")?.points).toBe(6);
  });

  it("treats property_value of 0 as not informed", () => {
    const r = computeLeadScore({ ...cold, property_value: 0 });
    expect(r.factors.find((f) => f.key === "propertyValue")?.points).toBe(0);
  });

  it("crosses into morno and quente at the tier thresholds", () => {
    expect(scoreToTier(39)).toBe("frio");
    expect(scoreToTier(40)).toBe("morno");
    expect(scoreToTier(69)).toBe("morno");
    expect(scoreToTier(70)).toBe("quente");
  });

  it("keeps every factor within its own max bound", () => {
    const r = computeLeadScore({
      ...cold,
      max_scroll: 100,
      sections_viewed: 100,
      simulator_uses: 10,
    });
    for (const f of r.factors) {
      expect(f.points).toBeGreaterThanOrEqual(0);
      expect(f.points).toBeLessThanOrEqual(f.max);
    }
  });
});
