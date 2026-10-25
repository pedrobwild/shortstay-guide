import { describe, expect, it } from "vitest";
import { bairrosSeoAdmin, metadadosBairro, paginasSeoAdmin } from "@/lib/seoBairrosAdmin";
import { SEO_ROUTES, SEO_BAIRROS, ROBOTS_INDEXAVEL, tituloComMarca } from "@/lib/seo";

describe("consulta de SEO dos bairros", () => {
  it("inclui /ranking com a mesma fonte pública, sem tratá-lo como bairro", () => {
    const ranking = paginasSeoAdmin().find((pagina) => pagina.path === "/ranking");
    const publico = SEO_ROUTES.find((pagina) => pagina.path === "/ranking");
    expect(ranking?.canonical).toBe("https://radarbewild.com.br/ranking");
    expect(ranking?.titulo).toBe(tituloComMarca(publico?.title ?? ""));
    expect(ranking?.description).toBe(publico?.description);
    expect(ranking?.jsonLd).toContainEqual(expect.objectContaining({ "@type": "CollectionPage", url: "https://radarbewild.com.br/ranking", about: { "@id": "https://bewild.com.br/#org" } }));
  });
  it("cobre todos os bairros públicos sem repetir endereços", () => {
    const bairros = bairrosSeoAdmin();
    expect(bairros.map((b) => b.nome).sort()).toEqual([...SEO_BAIRROS].sort());
    expect(new Set(bairros.map((b) => b.canonical)).size).toBe(SEO_BAIRROS.length);
  });
  it("Vila Olímpia referencia sua própria página pública", () => {
    const bairro = metadadosBairro("Vila Olímpia");
    expect(bairro.canonical).toBe("https://radarbewild.com.br/bairro/vila-olimpia");
    expect(bairro.tags.find((t) => t.nome === "og:url")?.valor).toBe(bairro.canonical);
    expect(bairro.tags.find((t) => t.nome === "robots")?.valor).toBe(ROBOTS_INDEXAVEL);
    expect(bairro.jsonLd).toContainEqual(expect.objectContaining({ "@type": "WebPage", url: bairro.canonical, about: expect.objectContaining({ "@type": "Place", name: "Vila Olímpia" }) }));
  });
});