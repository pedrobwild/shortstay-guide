import { describe, it, expect } from "vitest";
import { buildProjectChatContext } from "../projectChatContext";
import type { ProjectionSummary } from "../projectAnalytics";

const projection: ProjectionSummary = {
  occupancyPct: 75,
  adr: 350,
  monthsObserved: 12,
  grossRevenueBrl: 95_000,
  netRevenueBrl: 70_000,
  netMarginPct: 73.7,
  annualGrossRevenueBrl: 95_000,
  annualNetRevenueBrl: 70_000,
  grossYieldPct: 9.5,
  capRatePct: 7.2,
  paybackYears: 13.9,
};

const base = {
  hasProject: true,
  projectName: "Studio Pinheiros",
  neighborhood: "Pinheiros",
  areaSqm: "26–35 m²",
  hasPropertyValue: true,
  projection,
  dealLabel: "Projeção pronta",
  nextStepLabel: "Informar valor do imóvel",
};

describe("buildProjectChatContext", () => {
  it("returns no context when there is no project", () => {
    const { hasContext, context } = buildProjectChatContext({
      ...base,
      hasProject: false,
      projectName: null,
      neighborhood: null,
      projection: null,
    });
    expect(hasContext).toBe(false);
    expect(context).toMatch(/NÃO tem um projeto ativo/i);
    expect(context).toMatch(/especialista BWild/i);
  });

  it("anchors the context on the client's real numbers", () => {
    const { hasContext, context } = buildProjectChatContext(base);
    expect(hasContext).toBe(true);
    expect(context).toContain("Studio Pinheiros");
    expect(context).toContain("Pinheiros");
    expect(context).toContain("26–35 m²");
    // Receita líquida anual e ROI presentes (formatados em BRL/%)
    expect(context).toMatch(/Receita líquida anual projetada: R\$\s?70\.000/);
    expect(context).toContain("7.20% ao ano");
    expect(context).toContain("13.9 anos");
  });

  it("does NOT expose ROI/payback when the property value is missing", () => {
    const { hasContext, context } = buildProjectChatContext({
      ...base,
      hasPropertyValue: false,
    });
    expect(hasContext).toBe(true);
    expect(context).not.toContain("cap rate):");
    expect(context).toMatch(/valor do imóvel ainda não foi informado/i);
    expect(context).toMatch(/NÃO estime/i);
  });

  it("flags an unconfigured projection without inventing numbers", () => {
    const { hasContext, context } = buildProjectChatContext({
      ...base,
      neighborhood: null,
      projection: null,
    });
    expect(hasContext).toBe(false);
    expect(context).toContain("Studio Pinheiros");
    expect(context).toMatch(/projeção ainda NÃO foi configurada/i);
    expect(context).not.toMatch(/R\$/);
  });
});
