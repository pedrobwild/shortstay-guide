import { describe, expect, it } from "vitest";
import { BAIRROS_CURADOS, getBairroCurado } from "@/data/bairrosCurados";
import { aplicarAjuste, buscarAjuste, mapaAjustes, resultadoLiquidoMensal, rotuloDecoracao } from "@/lib/bairroAjustes";

describe("ajustes de bairro", () => {
  it("sobrepõe diária e ocupação sem alterar a base aprovada", () => {
    const pinheiros = getBairroCurado("Pinheiros")!;
    const mapa = mapaAjustes([{ bairro: "Pinheiros", diaria: 350, ocupacao: 70, fonte: "teste" }]);
    const ajustado = aplicarAjuste(pinheiros, buscarAjuste(mapa, "pinheiros"));
    expect(ajustado.dailyAvg).toBe(350);
    expect(ajustado.avgOccupancy).toBe(70);
    expect(getBairroCurado("Pinheiros")!.dailyAvg).toBe(299);
    expect(getBairroCurado("Pinheiros")!.avgOccupancy).toBe(63);
  });
  it("sem ajuste devolve o bairro original", () => {
    expect(aplicarAjuste(BAIRROS_CURADOS[0], undefined)).toBe(BAIRROS_CURADOS[0]);
  });
  it("resultado líquido desconta as deduções totais do DRE do guia (55%)", () => {
    expect(resultadoLiquidoMensal(10000)).toBe(4500);
  });
  it("decoração segue o boost do simulador", () => {
    expect(rotuloDecoracao(0)).toBe("Sem melhoria");
    expect(rotuloDecoracao(20)).toBe("Premium (+20%)");
  });
});
