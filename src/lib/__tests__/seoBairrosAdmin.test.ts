import { describe, expect, it } from "vitest";
import { bairrosSeoAdmin, metadadosBairro } from "@/lib/seoBairrosAdmin";
import { SEO_BAIRROS, ROBOTS_INDEXAVEL } from "@/lib/seo";

describe("consulta de SEO dos bairros", () => {
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