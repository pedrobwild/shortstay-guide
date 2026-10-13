import { describe, expect, it } from "vitest";
import { STUDIO_EXEMPLO_IMOVEL, STUDIO_EXEMPLO_ITBI, STUDIO_EXEMPLO_TOTAL, STUDIO_EXEMPLO_PCT_REFORMA } from "@/data/provasBewild";
describe("exemplo de reforma do estudo de 188 contratos", () => {
  it("calcula compra de 27 m² pela referência FipeZAP de R$ 12.143/m²", () => { expect(STUDIO_EXEMPLO_IMOVEL).toBe(327861); });
  it("aplica a hipótese de ITBI de 3%", () => { expect(STUDIO_EXEMPLO_ITBI).toBeCloseTo(9835.83, 2); });
  it("soma compra, ITBI e reforma turnkey mediana uma única vez", () => { expect(STUDIO_EXEMPLO_TOTAL).toBeCloseTo(409546.83, 2); });
  it("calcula a participação da reforma sem arredondar a entrada", () => { expect(STUDIO_EXEMPLO_PCT_REFORMA).toBeCloseTo(17.543781, 5); });
});