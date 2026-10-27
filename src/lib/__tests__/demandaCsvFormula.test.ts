import { describe, it, expect } from "vitest";
import { demandaParaCsv } from "@/lib/demandaBusca";

describe("demandaParaCsv", () => {
  it("neutraliza fórmula vinda do visitante", () => {
    const linha = { bairro: "=HYPERLINK(\"x\")", pessoas: 1, simulacoes: 1 } as unknown as Parameters<typeof demandaParaCsv>[0][number];
    const csv = demandaParaCsv([linha]);
    expect(csv).not.toMatch(/\n=HYPERLINK/);
    expect(csv).toContain("'=HYPERLINK");
  });
});
