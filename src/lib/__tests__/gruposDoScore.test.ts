import { describe, expect, it } from "vitest";
import { gruposDoScore } from "@/lib/investmentScore";

describe("score de investimento em três grupos", () => {
  it("divide em três grupos de tamanho parecido, com a sobra no primeiro", () => {
    const notas = Array.from({ length: 16 }, (_, i) => ({ bairro: `B${String(i).padStart(2, "0")}`, score: 100 - i }));
    const grupos = gruposDoScore(notas);
    const conta = (g: string) => [...grupos.values()].filter((v) => v === g).length;
    expect([conta("frente"), conta("meio"), conta("fim")]).toEqual([6, 5, 5]);
    expect(grupos.get("B00")).toBe("frente");
    expect(grupos.get("B15")).toBe("fim");
  });

  it("empate na fronteira fica no mesmo grupo", () => {
    const grupos = gruposDoScore([{ bairro: "A", score: 9 }, { bairro: "B", score: 7 }, { bairro: "C", score: 7 }, { bairro: "D", score: 5 }, { bairro: "E", score: 3 }, { bairro: "F", score: 1 }]);
    expect(grupos.get("B")).toBe(grupos.get("C"));
  });

  it("lista vazia e lista de um bairro não quebram", () => {
    expect(gruposDoScore([]).size).toBe(0);
    expect(gruposDoScore([{ bairro: "A", score: 5 }]).get("A")).toBe("frente");
  });
});

describe("pilares em faixas", () => {
  it("usa a mesma divisão em três grupos e rótulos de faixa", async () => {
    const { faixasDoPilar, ROTULO_FAIXA_PILAR } = await import("@/lib/investmentScore");
    const faixas = faixasDoPilar(Array.from({ length: 6 }, (_, i) => ({ bairro: `B${i}`, valor: 90 - i * 10 })));
    expect([0, 1, 2, 3, 4, 5].map((i) => ROTULO_FAIXA_PILAR[faixas.get(`B${i}`)!])).toEqual(["Alta", "Alta", "Média", "Média", "Baixa", "Baixa"]);
  });

  it("a legenda da estimativa concorda com \"confiança\"", async () => {
    const { rotuloEstimativa } = await import("@/hooks/useIntelligenceData");
    const base = { periodo_inicio: null, periodo_fim: null } as never;
    expect(rotuloEstimativa({ ...(base as object), nivel_confianca_dados: "medio" } as never)).toMatch(/confiança média$/);
    expect(rotuloEstimativa({ ...(base as object), nivel_confianca_dados: "alto" } as never)).toMatch(/confiança alta$/);
  });
});
