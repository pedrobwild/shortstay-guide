import { describe, it, expect } from "vitest";
import { demandaParaCsv } from "@/lib/demandaBusca";

describe("demandaParaCsv", () => {
  it("neutraliza fórmula vinda do visitante", () => {
    const linha = { bairro: "=HYPERLINK(\"x\")", pessoas: 1, simulacoes: 1, valor_mediano: null, metragem_mediana: null, preco_m2_mediano: null, entrada_pct_mediana: null, compra_6m_pct: null, fgts_pct: null, mcmv_pct: null, faixa_renda_moda: null, empreendimentos: [] } as unknown as Parameters<typeof demandaParaCsv>[0][number];
    const csv = demandaParaCsv([linha]);
    expect(csv).not.toMatch(/\n=HYPERLINK/);
    expect(csv).toContain("'=HYPERLINK");
  });
});
