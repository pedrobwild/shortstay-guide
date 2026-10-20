import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { atalhosDaResposta, bairrosCitados, sugestoesDaPagina } from "@/lib/chatAtalhos";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";

const nomes = BAIRROS_CURADOS.map((b) => b.name);

describe("atalhos do chat", () => {
  it("acha bairros citados na ordem do texto, sem depender de acento ou maiúscula", () => {
    expect(bairrosCitados("Entre vila mariana e PINHEIROS, a Republica tem diária menor.", nomes)).toEqual(["Vila Mariana", "Pinheiros", "República"]);
  });

  it("não confunde pedaço de palavra com bairro", () => {
    expect(bairrosCitados("Moemas e liberdades não são bairros.", nomes)).toEqual([]);
  });

  it("gera ver/simular para até 2 bairros e comparar quando há mais de um", () => {
    const a = atalhosDaResposta("Pinheiros tem diária maior que Bela Vista e Mooca.", nomes);
    expect(a.map((x) => x.rotulo)).toEqual(["Ver Pinheiros", "Simular Pinheiros", "Ver Bela Vista", "Simular Bela Vista", "Comparar Pinheiros, Bela Vista, Mooca"]);
    expect(a[0].para).toBe("/bairro/pinheiros");
    expect(a[1].para).toBe("/projecao?bairro=pinheiros");
    expect(a[4].para).toBe("/comparar?b=pinheiros,bela-vista,mooca");
  });

  it("todos os destinos existem nas rotas do app", () => {
    const rotas = readFileSync("src/App.tsx", "utf8");
    for (const a of atalhosDaResposta("Pinheiros e Moema", nomes)) {
      const base = a.para.startsWith("/bairro/") ? "/bairro/:bairro" : a.para.split(/[?#]/)[0] || "/";
      expect(rotas).toContain(`path="${base}"`);
    }
  });

  it("sem bairro citado, sem atalhos", () => {
    expect(atalhosDaResposta("Precificação dinâmica ajuda em feriados.", nomes)).toEqual([]);
  });

  it("sugestões mudam com a página", () => {
    expect(sugestoesDaPagina("/bairro/moema", "Moema", [])?.[0]).toBe("Vale a pena um studio em Moema?");
    expect(sugestoesDaPagina("/comparar", null, ["Pinheiros", "Mooca"])?.[0]).toBe("Qual a diferença entre Pinheiros e Mooca?");
    expect(sugestoesDaPagina("/", null, [])).toBeNull();
  });
});
