import { describe, expect, it } from "vitest";
import { direcaoDaRolagem } from "@/hooks/useRolandoParaBaixo";

describe("botão do assistente: recolher ao rolar para baixo", () => {
  it("perto do topo nunca recolhe", () => {
    expect(direcaoDaRolagem(0, 60, false)).toBe(false);
    expect(direcaoDaRolagem(300, 40, true)).toBe(false);
  });
  it("recolhe ao descer e volta ao subir", () => {
    expect(direcaoDaRolagem(200, 260, false)).toBe(true);
    expect(direcaoDaRolagem(600, 540, true)).toBe(false);
  });
  it("deslocamento menor que a folga mantém o estado (não pisca)", () => {
    expect(direcaoDaRolagem(400, 404, true)).toBe(true);
    expect(direcaoDaRolagem(400, 396, false)).toBe(false);
  });
});
