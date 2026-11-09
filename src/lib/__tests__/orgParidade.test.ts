import { describe, expect, it } from "vitest";
import orgBewild from "@/data/orgBewild.json";
import { ORG_ID, ORG_JSONLD, jsonLdDaPagina } from "@/lib/seoJsonLd";
import { camposDiferentes, extrairOrganization, impressaoDigital } from "../../../scripts/lib/orgParidade.mjs";

/**
 * Impressão digital do Organization oficial da Bewild. O MESMO valor está travado no
 * bewild.com.br (repositório remix-of-site-lorena, src/lib/__tests__/orgParidadeRadar.test.ts).
 * Mudou a Organization (perfil novo no sameAs, nome, CNPJ…)? Atualize o arquivo
 * orgBewild.json e este valor NOS DOIS repositórios, na mesma leva.
 */
const IMPRESSAO_OFICIAL = "cf1213cd207f7449c9a06797a23c4f0a525d296aa4837e9b8609e45d233c1568";

describe("Organization do Radar idêntica à do bewild.com.br", () => {
  it("o nó publicado em toda página é o orgBewild.json, campo a campo", () => {
    const { "@context": contexto, ...no } = ORG_JSONLD as Record<string, unknown>;
    expect(contexto).toBe("https://schema.org");
    expect(no).toEqual(orgBewild);
    const [org] = jsonLdDaPagina({ path: "/guia/checklist", title: "t", description: "d", h1: "h" }) as Record<string, unknown>[];
    expect(org).toBe(ORG_JSONLD);
  });

  it("é a entidade completa: razão social, CNPJ, fundadores e os 4 perfis oficiais, na ordem do site", () => {
    expect(orgBewild["@id"]).toBe(ORG_ID);
    expect(orgBewild.legalName).toBe("Bwild Reformas LTDA");
    expect(orgBewild.taxID).toBe("47.350.338/0001-37");
    expect(orgBewild.founder).toHaveLength(2);
    expect(orgBewild.sameAs).toEqual([
      "https://instagram.com/bewild.oficial",
      "https://www.linkedin.com/company/bwil-d/",
      "https://maps.google.com/maps?cid=16329162499474686119",
      "https://www.youtube.com/@bewild.oficial",
    ]);
  });

  it("o arquivo é o mesmo travado no site (impressão digital)", () => {
    expect(impressaoDigital(orgBewild)).toBe(IMPRESSAO_OFICIAL);
  });
});

describe("conferência da Organization publicada (scripts/conferir-org.mjs)", () => {
  const ld = (o: object) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  const outro = { "@context": "https://schema.org", "@type": "WebSite", "@id": "https://radarbewild.com.br/#website" };

  it("acha o nó #org dentro de um @graph (formato do site)", () => {
    const html = `<html><head>${ld({ "@context": "https://schema.org", "@graph": [orgBewild, outro] })}</head></html>`;
    expect(extrairOrganization(html)).toEqual(orgBewild);
  });

  it("acha o nó #org num <script> próprio (formato do Radar), ignorando o @context", () => {
    const html = `${ld(outro)}${ld({ "@context": "https://schema.org", ...orgBewild })}`;
    expect(extrairOrganization(html)).toEqual(orgBewild);
  });

  it("página sem Organization devolve null; JSON-LD quebrado não derruba a leitura", () => {
    expect(extrairOrganization(`<script type="application/ld+json">{quebrado</script>${ld(outro)}`)).toBeNull();
  });

  it("nós iguais não têm diferença, mesmo com as chaves em outra ordem", () => {
    const embaralhado = Object.fromEntries(Object.entries(orgBewild).reverse());
    expect(camposDiferentes(orgBewild, embaralhado)).toEqual([]);
    expect(impressaoDigital(embaralhado)).toBe(impressaoDigital(orgBewild));
  });

  it("aponta o campo que divergiu (perfil a mais no sameAs, campo que sumiu)", () => {
    const comPerfilNovo = { ...orgBewild, sameAs: [...orgBewild.sameAs, "https://www.tiktok.com/@bewild"] };
    expect(camposDiferentes(orgBewild, comPerfilNovo)).toEqual(["sameAs"]);
    const { legalName: _fora, ...semRazaoSocial } = orgBewild;
    expect(camposDiferentes(orgBewild, semRazaoSocial)).toEqual(["legalName"]);
  });

  it("a ordem dos perfis no sameAs conta como diferença (idêntico é idêntico)", () => {
    expect(camposDiferentes(orgBewild, { ...orgBewild, sameAs: [...orgBewild.sameAs].reverse() })).toEqual(["sameAs"]);
  });
});
