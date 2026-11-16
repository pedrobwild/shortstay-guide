import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATALHOS_CONSULTA, destinoDoPasso, PASSOS_ESTUDO, passoDaRota, proximoPasso } from "@/data/passosEstudo";
import { LINKS_PUBLICOS } from "@/data/navegacao";

const rotas = readFileSync("src/App.tsx", "utf8");

describe("estudo em 3 passos", () => {
  it("são três passos, na ordem da barra do site: bairro, conta, reforma", () => {
    expect(PASSOS_ESTUDO.map((p) => p.numero)).toEqual([1, 2, 3]);
    expect(PASSOS_ESTUDO.map((p) => p.to)).toEqual(LINKS_PUBLICOS.slice(0, 3).map((l) => l.to));
  });

  it("todo passo e todo atalho de consulta apontam para uma rota existente", () => {
    for (const destino of [...PASSOS_ESTUDO.map((p) => p.to), ...ATALHOS_CONSULTA.map((a) => a.to)]) {
      const caminho = destino.split("#")[0] || "/";
      expect(rotas, destino).toContain(`path="${caminho}"`);
    }
  });

  it("reconhece o passo pela rota e não marca as telas de consulta", () => {
    expect(passoDaRota("/ranking")?.numero).toBe(1);
    expect(passoDaRota("/mapa")?.numero).toBe(1);
    expect(passoDaRota("/bairro/pinheiros")?.numero).toBe(1);
    expect(passoDaRota("/projecao")?.numero).toBe(2);
    expect(passoDaRota("/reformar")?.numero).toBe(3);
    for (const fora of ["/", "/eventos", "/metodologia", "/posts", "/guia/reforma", "/ferramentas", "/empreendimentos", "/rankings"]) {
      expect(passoDaRota(fora), fora).toBeNull();
    }
  });

  it("o passo seguinte existe até o último", () => {
    expect(proximoPasso(PASSOS_ESTUDO[0])?.numero).toBe(2);
    expect(proximoPasso(PASSOS_ESTUDO[1])?.numero).toBe(3);
    expect(proximoPasso(PASSOS_ESTUDO[2])).toBeNull();
  });

  it("a conta recebe o bairro atual; os outros passos não mudam", () => {
    expect(destinoDoPasso(PASSOS_ESTUDO[1], "pinheiros")).toBe("/projecao?bairro=pinheiros");
    expect(destinoDoPasso(PASSOS_ESTUDO[1], null)).toBe("/projecao");
    expect(destinoDoPasso(PASSOS_ESTUDO[0], "pinheiros")).toBe("/ranking");
    expect(destinoDoPasso(PASSOS_ESTUDO[2], "pinheiros")).toBe("/reformar");
  });

  it("os textos dos passos não prometem resultado nem usam jargão", () => {
    const texto = PASSOS_ESTUDO.map((p) => `${p.rotulo} ${p.resumo}`).join(" ").toLowerCase();
    for (const proibido of ["garant", "lucro", "roi", "payback", "yield"]) expect(texto).not.toContain(proibido);
  });
});
