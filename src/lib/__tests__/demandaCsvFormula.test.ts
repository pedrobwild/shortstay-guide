import { describe, it, expect } from "vitest";
import { demandaParaCsv, normalizarDemandaBairro } from "@/lib/demandaBusca";

describe("demandaParaCsv", () => {
  it("neutraliza fórmula vinda do visitante", () => {
    const linha = normalizarDemandaBairro({ bairro: '=HYPERLINK("x")', bairro_chave: "x", pessoas: 1 } as never);
    const csv = demandaParaCsv([linha]);
    expect(csv).not.toMatch(/\n=HYPERLINK/);
    expect(csv).toContain("'=HYPERLINK");
  });
});
