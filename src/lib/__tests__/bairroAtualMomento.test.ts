import { beforeEach, describe, expect, it } from "vitest";
import { caminhoComBairro, definirBairroAtual } from "@/lib/bairroAtual";
import { lerUltimoBairro } from "@/lib/retomada";
import { CAMINHOS_MOMENTO, MOMENTOS, definirMomento, lerMomento } from "@/lib/momento";
import { CRITERIOS_RANKING, ordenarRanking } from "@/lib/radarUi";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";

describe("bairro atual (hero → mapa, comparador, simulador)", () => {
  beforeEach(() => localStorage.clear());

  it("grava o bairro pelo nome e lê o slug", () => {
    definirBairroAtual("Vila Olímpia");
    expect(lerUltimoBairro()).toMatchObject({ slug: "vila-olimpia", nome: "Vila Olímpia" });
  });

  it("acrescenta ?bairro= só quando há bairro atual, preservando query e âncora", () => {
    expect(caminhoComBairro("/comparar", null)).toBe("/comparar");
    const b = { slug: "pinheiros", nome: "Pinheiros", quando: Date.now() };
    expect(caminhoComBairro("/comparar", b)).toBe("/comparar?bairro=pinheiros");
    expect(caminhoComBairro("/projecao?modo=x", b)).toBe("/projecao?modo=x&bairro=pinheiros");
    expect(caminhoComBairro("/?x=1#simulador", b)).toBe("/?x=1&bairro=pinheiros#simulador");
  });
});

describe("momento do investidor", () => {
  beforeEach(() => localStorage.clear());

  it("cada momento tem situação, ação e destino", () => {
    for (const m of MOMENTOS) expect(CAMINHOS_MOMENTO[m]).toMatchObject({ situacao: expect.any(String), acao: expect.any(String), destino: expect.any(String) });
    expect(CAMINHOS_MOMENTO.procurando.acao).toBe("Comparar bairros");
    expect(CAMINHOS_MOMENTO.tenho.acao).toBe("Simular meu resultado");
    expect(CAMINHOS_MOMENTO.reformar.acao).toBe("Planejar meu investimento");
  });

  it("grava e lê; expira em 30 dias; ignora valor inválido", () => {
    expect(lerMomento()).toBeNull();
    definirMomento("tenho");
    expect(lerMomento()).toBe("tenho");
    expect(lerMomento(Date.now() + 31 * 24 * 60 * 60 * 1000)).toBeNull();
    localStorage.setItem("radar_momento", JSON.stringify({ momento: "x", quando: Date.now() }));
    expect(lerMomento()).toBeNull();
  });
});

describe("ranking da home por critério", () => {
  it("receita é o critério padrão e ordena do maior para o menor", () => {
    const r = ordenarRanking(BAIRROS_CURADOS, "receita");
    // Morumbi (R$ 487 × 30 × 56%) na frente; Brooklin, Itaim Bibi e Vila Olímpia empatam (números do Itaim), desempate pelo nome.
    expect(r.slice(0, 4).map((x) => x.bairro.name)).toEqual(["Morumbi", "Brooklin", "Itaim Bibi", "Vila Olímpia"]);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].valor).toBeGreaterThanOrEqual(r[i].valor);
  });

  it("só dados observados deixa aproximações e estimativas de fora", () => {
    const nomes = ordenarRanking(BAIRROS_CURADOS, "receita", true).map((x) => x.bairro.name);
    expect(nomes).not.toContain("Brooklin");
    expect(nomes).not.toContain("Vila Olímpia");
    expect(nomes).toContain("Consolação"); // dado público desde 18/10/2026
    expect(nomes).toContain("Pinheiros");
  });

  it("diária, ocupação e anúncios ordenam pelo próprio valor", () => {
    expect(ordenarRanking(BAIRROS_CURADOS, "diaria", true)[0].bairro.name).toBe("Morumbi");
    expect(ordenarRanking(BAIRROS_CURADOS, "ocupacao", true)[0].bairro.name).toBe("Brás");
    expect(ordenarRanking(BAIRROS_CURADOS, "anuncios", true)[0].bairro.name).toBe("Itaim Bibi");
    expect(CRITERIOS_RANKING.map((c) => c.valor)).toEqual(["receita", "diaria", "ocupacao", "anuncios"]);
  });
});
