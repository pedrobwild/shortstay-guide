import { describe, expect, it } from "vitest";
import { ORG_ID, WEBSITE_ID, articleJsonLd, isoSaoPaulo, itemListBairrosJsonLd, jsonLdDaPagina, trilhaDaPagina, webPageJsonLd } from "@/lib/seoJsonLd";
import { datasetJsonLd } from "@/lib/dadosAbertos";

const bairro = { path: "/bairro/pinheiros", title: "Studio para Airbnb em Pinheiros: diária, ocupação e receita", description: "d", h1: "Studio para Airbnb em Pinheiros", bairro: "Pinheiros" };
const tema = { path: "/guia/decoracao", title: "Decoração estratégica para studio de short stay", description: "d", h1: "Decoração estratégica" };
const ranking = { path: "/ranking", title: "Comparador de bairros para Airbnb em SP", description: "d", h1: "Comparador de bairros para short stay" };

// Regras do docs/SEO.md do bewild.com.br, que valem aqui também.
const semReview = (no: object) => expect(JSON.stringify(no)).not.toMatch(/"@type":"(Review|AggregateRating)"/);

describe("JSON-LD por página (padrão do bewild.com.br)", () => {
  it("todo nó tem @context, um @type e URLs absolutas no domínio oficial", () => {
    for (const p of [bairro, tema, ranking]) {
      for (const no of jsonLdDaPagina(p) as Record<string, unknown>[]) {
        expect(no["@context"]).toBe("https://schema.org");
        expect(typeof no["@type"]).toBe("string");
        for (const url of JSON.stringify(no).match(/"(url|item|@id)":"([^"]+)"/g) ?? []) expect(url).toMatch(/https:\/\/(radarbewild\.com\.br|bewild\.com\.br|schema\.org)/);
        semReview(no);
      }
    }
  });

  it("Organization é o nó #org do bewild.com.br e o WebSite é do Radar", () => {
    const [org, site] = jsonLdDaPagina(bairro) as Record<string, unknown>[];
    expect(org["@id"]).toBe(ORG_ID);
    expect(org.name).toBe("Bewild");
    expect(site["@id"]).toBe(WEBSITE_ID);
    expect(site.publisher).toEqual({ "@id": ORG_ID });
  });

  it("a home não ganha nó de página; as demais ganham WebPage/CollectionPage com a trilha aninhada", () => {
    expect(jsonLdDaPagina({ path: "/", title: "t", description: "d", h1: "h" })).toHaveLength(2);
    const pagina = webPageJsonLd(ranking, { dateModified: "2026-10-18T10:00:00-03:00" });
    expect(pagina["@type"]).toBe("CollectionPage");
    expect(pagina["@id"]).toBe("https://radarbewild.com.br/ranking#webpage");
    expect(pagina.isPartOf).toEqual({ "@id": WEBSITE_ID });
    expect(pagina.dateModified).toBe("2026-10-18T10:00:00-03:00");
    expect(pagina.breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(pagina.breadcrumb.itemListElement.map((i) => i.name)).toEqual(["Início", "Mercado", "Comparador de bairros para short stay"]);
    // BreadcrumbList só aninhada, nunca como nó solto.
    expect(jsonLdDaPagina(ranking).some((n) => (n as { "@type": string })["@type"] === "BreadcrumbList")).toBe(false);
  });

  it("página de bairro: trilha Início → Ranking → bairro e `about` é o lugar em São Paulo", () => {
    expect(trilhaDaPagina(bairro).map((t) => t.path)).toEqual(["/", "/ranking", "/bairro/pinheiros"]);
    const pagina = webPageJsonLd(bairro);
    expect(pagina["@type"]).toBe("WebPage");
    expect(pagina.about).toMatchObject({ "@type": "Place", name: "Pinheiros", containedInPlace: { "@type": "City", name: "São Paulo" } });
    expect(pagina.name).toBe("Studio para Airbnb em Pinheiros: diária, ocupação e receita");
  });

  it("tema do guia ganha Article assinado pela Bewild, com datas no fuso -03:00", () => {
    const nos = jsonLdDaPagina(tema, { datePublished: "2026-10-18T09:00:00-03:00", dateModified: "2026-10-18T10:00:00-03:00" });
    const artigo = nos.find((n) => (n as { "@type": string })["@type"] === "Article") as ReturnType<typeof articleJsonLd>;
    expect(artigo).toBeTruthy();
    expect(artigo.headline).toBe("Decoração estratégica");
    expect(artigo.author).toEqual({ "@id": ORG_ID });
    expect(artigo.mainEntityOfPage).toEqual({ "@id": "https://radarbewild.com.br/guia/decoracao#webpage" });
    expect(artigo.datePublished).toMatch(/-03:00$/);
    expect(trilhaDaPagina(tema).map((t) => t.name)).toEqual(["Início", "Guia do investidor", "Decoração estratégica"]);
  });

  it("ItemList dos bairros aponta para as páginas de bairro na ordem recebida", () => {
    const lista = itemListBairrosJsonLd(["Pinheiros", "Sé"], "/ranking");
    expect(lista.numberOfItems).toBe(2);
    expect(lista.itemListElement[1]).toEqual({ "@type": "ListItem", position: 2, name: "Sé", url: "https://radarbewild.com.br/bairro/se" });
  });

  it("extras (FAQPage, Dataset) entram depois dos nós fixos", () => {
    const nos = jsonLdDaPagina(ranking, {}, [datasetJsonLd("https://radarbewild.com.br")]);
    expect((nos.at(-1) as { "@type": string })["@type"]).toBe("Dataset");
  });

  it("isoSaoPaulo converte qualquer instante para o fuso de São Paulo com -03:00", () => {
    expect(isoSaoPaulo("2026-10-18T03:30:00Z")).toBe("2026-10-18T00:30:00-03:00");
    expect(isoSaoPaulo("2026-10-18T12:00:00-03:00")).toBe("2026-10-18T12:00:00-03:00");
    expect(() => isoSaoPaulo("ontem")).toThrow();
  });
});
