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
