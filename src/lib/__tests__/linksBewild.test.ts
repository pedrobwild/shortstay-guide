import { describe, expect, it } from "vitest";
import {
  BAIRROS_REFORMA_SITE, INDICE_CUSTO, LINKS_REFORMA_SITE, REFORMA_GERAL_URL, paginaReformaBairro, reformaBairroUrl,
} from "@/data/artigosBewild";
import { linksDeRetornoAusentes } from "@/lib/linksRetorno";

// As 16 páginas /reforma/<bairro> do sitemap do bewild.com.br (conferido em 09/11/2026).
const SLUGS_DO_SITE = [
  "bela-vista", "brooklin", "butanta", "campo-belo", "consolacao", "higienopolis", "moema", "paulista", "perdizes",
  "pinheiros", "republica", "vila-clementino", "vila-madalena", "vila-mariana", "vila-nova-conceicao", "vila-olimpia",
];

describe("links de retorno do Radar para o bewild.com.br", () => {
  it("o índice de custo aponta para /indice-de-custo-de-reforma, sem número na âncora", () => {
    expect(INDICE_CUSTO.url).toBe("https://bewild.com.br/indice-de-custo-de-reforma");
    expect(INDICE_CUSTO.titulo).not.toMatch(/\d/);
  });

  it("a lista de bairros é a das páginas de reforma que existem no site", () => {
    expect(BAIRROS_REFORMA_SITE.map((b) => b.slug)).toEqual(SLUGS_DO_SITE);
    for (const b of BAIRROS_REFORMA_SITE) expect(b.rotulo, b.slug).toMatch(/^Reforma (em|no|na) \S/);
  });

  it("Butantã tem página própria no site e o Radar aponta para ela", () => {
    expect(reformaBairroUrl("Butantã")).toBe("https://bewild.com.br/reforma/butanta");
  });

  it("bairro sem página no site vai para a página geral de reforma de studio", () => {
    expect(reformaBairroUrl("Tatuapé")).toBe(REFORMA_GERAL_URL);
    expect(paginaReformaBairro("Tatuapé")).toBeNull();
  });

  it("paginaReformaBairro acha o bairro pelo nome com acento", () => {
    expect(paginaReformaBairro("Higienópolis")).toEqual({ slug: "higienopolis", rotulo: "Reforma em Higienópolis", url: "https://bewild.com.br/reforma/higienopolis" });
  });

  it("o bloco de retorno tem o índice e os 16 bairros, como link normal (sem UTM nem parâmetro)", () => {
    expect(LINKS_REFORMA_SITE).toHaveLength(17);
    expect(LINKS_REFORMA_SITE[0]).toEqual(INDICE_CUSTO);
    for (const l of LINKS_REFORMA_SITE) expect(l.url).toMatch(/^https:\/\/bewild\.com\.br\/[a-z0-9/-]+$/);
  });
});

describe("conferência dos links de retorno no HTML de uma página", () => {
  const completo = LINKS_REFORMA_SITE.map((l) => `<a href="${l.url}">${l.titulo}</a>`).join("");

  it("HTML com o índice e todos os bairros não tem pendência", () => {
    expect(linksDeRetornoAusentes(`<main>${completo}</main>`)).toEqual([]);
  });

  it("aponta cada endereço que faltar", () => {
    const semIndice = completo.replace(`href="${INDICE_CUSTO.url}"`, 'href="/x"');
    expect(linksDeRetornoAusentes(semIndice)).toEqual([INDICE_CUSTO.url]);
    expect(linksDeRetornoAusentes("<main></main>")).toHaveLength(17);
  });

  it("não aceita endereço mais longo no lugar do certo (ex.: /reforma/pinheiros-2)", () => {
    const trocado = completo.replace('href="https://bewild.com.br/reforma/pinheiros"', 'href="https://bewild.com.br/reforma/pinheiros-2"');
    expect(linksDeRetornoAusentes(trocado)).toEqual(["https://bewild.com.br/reforma/pinheiros"]);
  });
});
