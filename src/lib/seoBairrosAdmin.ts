import { SEO_ROUTES, SEO_BAIRROS, bairroPath, bairroTitle, bairroDescription, bairroH1, tituloComMarca, urlCanonica, ROBOTS_INDEXAVEL, OG_IMAGEM, OG_IMAGEM_ALT, SITE_NAME } from "@/lib/seo";
import { jsonLdDaPagina } from "@/lib/seoJsonLd";

/** Consulta das regras públicas; não grava ajustes nem consulta o índice do Google. */
export function metadadosBairro(nome: string, pagina?: { path: string; title: string; description: string; h1: string }) {
  const path = pagina?.path ?? bairroPath(nome);
  const title = pagina?.title ?? bairroTitle(nome);
  const description = pagina?.description ?? bairroDescription(nome);
  const h1 = pagina?.h1 ?? bairroH1(nome);
  const titulo = tituloComMarca(title);
  const canonical = urlCanonica(path);
  return {
    nome, path, titulo, description, h1, canonical,
    tags: [
      { nome: "robots", valor: ROBOTS_INDEXAVEL },
      { nome: "hreflang · pt-BR", valor: canonical },
      { nome: "hreflang · x-default", valor: canonical },
      { nome: "og:type", valor: "website" },
      { nome: "og:title", valor: titulo },
      { nome: "og:description", valor: description },
      { nome: "og:url", valor: canonical },
      { nome: "og:site_name", valor: SITE_NAME },
      { nome: "og:image", valor: OG_IMAGEM },
      { nome: "og:image:alt", valor: OG_IMAGEM_ALT },
      { nome: "twitter:title", valor: titulo },
      { nome: "twitter:description", valor: description },
      { nome: "twitter:image", valor: OG_IMAGEM },
      { nome: "twitter:image:alt", valor: OG_IMAGEM_ALT },
    ],
    jsonLd: jsonLdDaPagina({ path, title, description, h1, ...(pagina ? {} : { bairro: nome }) }),
  };
}

export const bairrosSeoAdmin = () => SEO_BAIRROS.map((nome) => metadadosBairro(nome)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

export function paginasSeoAdmin() {
  const ranking = SEO_ROUTES.find((pagina) => pagina.path === "/ranking");
  return [...(ranking ? [metadadosBairro("Comparador de preços · /ranking", ranking)] : []), ...bairrosSeoAdmin()];
}