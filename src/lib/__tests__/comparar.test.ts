import { describe, expect, it } from "vitest";
import { MAX_COMPARAR, caminhoComparar, lerComparar } from "@/lib/comparar";

const conhecidos = ["pinheiros", "bela-vista", "vila-mariana", "mooca"];

describe("seleção do comparador", () => {
  it("mantém só bairros conhecidos, sem repetir, no máximo 3", () => {
    expect(lerComparar("pinheiros,xyz,Pinheiros,bela-vista,mooca,vila-mariana", conhecidos)).toEqual(["pinheiros", "bela-vista", "mooca"]);
  });

  it("vazio quando não há parâmetro", () => {
    expect(lerComparar(null, conhecidos)).toEqual([]);
    expect(lerComparar("", conhecidos)).toEqual([]);
  });

  it("monta o link e corta no limite", () => {
    expect(caminhoComparar(["pinheiros"])).toBe("/comparar?b=pinheiros");
    expect(caminhoComparar(conhecidos)).toBe("/comparar?b=pinheiros,bela-vista,vila-mariana");
    expect(caminhoComparar([])).toBe("/comparar");
    expect(MAX_COMPARAR).toBe(3);
  });
});
