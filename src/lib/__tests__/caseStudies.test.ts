import { describe, it, expect } from "vitest";
import {
  selectCaseStudies,
  getRegion,
  type CaseStudy,
} from "@/data/caseStudies";
import type { InvestorProfile } from "@/lib/investorQuiz";

const make = (over: Partial<CaseStudy>): CaseStudy => ({
  id: over.id ?? "x",
  bairro: over.bairro ?? "Pinheiros",
  region: over.region ?? "Zona Oeste",
  metragem: 28,
  investimento: { imovel: 300000, reforma: 30000, decoracao: 25000 },
  investimentoTotal: 355000,
  diaria: 380,
  ocupacao: 80,
  receitaMensal: 9000,
  receitaAnual: 108000,
  yieldBruto: "28%",
  paybackMeses: 8,
  timeline: [],
  verified: true,
  ...over,
});

describe("getRegion", () => {
  it("maps known bairros to their zone, accent/case-insensitive", () => {
    expect(getRegion("Pinheiros")).toBe("Zona Oeste");
    expect(getRegion("CONSOLAÇÃO")).toBe("Centro");
    expect(getRegion("moema")).toBe("Zona Sul");
  });

  it("falls back to 'São Paulo' for unknown bairros", () => {
    expect(getRegion("Bairro Inexistente")).toBe("São Paulo");
  });
});

describe("selectCaseStudies", () => {
  const oeste = make({ id: "pinheiros", bairro: "Pinheiros", region: "Zona Oeste", featured: true });
  const sul = make({ id: "moema", bairro: "Moema", region: "Zona Sul" });
  const source = [oeste, sul];

  it("prioritizes cases in the lead's exact bairro", () => {
    const r = selectCaseStudies({ bairro: "Moema", source });
    expect(r.matchLevel).toBe("bairro");
    expect(r.cases.map((c) => c.id)).toEqual(["moema"]);
  });

  it("matches accent-insensitively", () => {
    const r = selectCaseStudies({ bairro: "pinheiros ", source });
    expect(r.matchLevel).toBe("bairro");
    expect(r.cases[0].id).toBe("pinheiros");
  });

  it("falls back to the same region when no exact bairro match", () => {
    const r = selectCaseStudies({ bairro: "Vila Madalena", source });
    expect(r.matchLevel).toBe("regiao");
    expect(r.region).toBe("Zona Oeste");
    expect(r.cases.map((c) => c.id)).toEqual(["pinheiros"]);
  });

  it("falls back to featured cases when there is no bairro/region match", () => {
    const r = selectCaseStudies({ bairro: "Itaquera", source }); // Zona Leste, sem case
    expect(r.matchLevel).toBe("geral");
    expect(r.cases.map((c) => c.id)).toEqual(["pinheiros"]); // featured
  });

  it("falls back to general when no bairro is provided", () => {
    const r = selectCaseStudies({ bairro: null, source });
    expect(r.matchLevel).toBe("geral");
    expect(r.leadBairro).toBeNull();
  });

  it("ignores unverified cases", () => {
    const r = selectCaseStudies({ bairro: "Moema", source: [make({ id: "moema", bairro: "Moema", region: "Zona Sul", verified: false })] });
    expect(r.matchLevel).toBe("geral");
    expect(r.cases).toHaveLength(0);
  });

  it("orders tied cases by the investor profile's dominant strategy", () => {
    const highYield = make({ id: "high", bairro: "A", region: "Zona Sul", yieldBruto: "35%", featured: true });
    const lowYield = make({ id: "low", bairro: "B", region: "Zona Sul", yieldBruto: "20%", featured: true });
    const retornoProfile = {
      weights: { retorno: 0.7, demanda: 0.1, operacao: 0.1, futuro: 0.1 },
    } as InvestorProfile;
    const r = selectCaseStudies({ bairro: null, profile: retornoProfile, source: [lowYield, highYield] });
    expect(r.cases.map((c) => c.id)).toEqual(["high", "low"]);
  });
});
