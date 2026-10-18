import { OG_IMAGEM, SITE_NAME, SITE_URL, bairroPath, tituloComMarca, urlCanonica } from "@/lib/seo";
import { TEMAS_GUIA } from "@/data/temasGuia";

/**
 * Dados estruturados (JSON-LD) das páginas pré-renderizadas, no mesmo padrão do
 * bewild.com.br (docs/SEO.md de lá): só no HTML do servidor, um <script> por nó,
 * URLs absolutas, @id no domínio oficial, datas com fuso -03:00, BreadcrumbList sempre
 * aninhada no nó WebPage (nunca solta), nada de Review/AggregateRating e FAQ com o
 * texto idêntico ao visível. A Organization é o nó #org do bewild.com.br (uma única
 * Bewild para o Google); o Radar só é dono do nó WebSite.
 */
export const ORG_ID = "https://bewild.com.br/#org";
export const WEBSITE_ID = `${SITE_URL}/#website`;
const CONTEXT = "https://schema.org";

export const ORG_JSONLD = {
  "@context": CONTEXT,
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Bewild",
  url: "https://bewild.com.br/",
  logo: "https://bewild.com.br/brand/bewild-logo-512.png",
  sameAs: [
    "https://instagram.com/bewild.oficial",
    "https://www.linkedin.com/company/bwil-d/",
    "https://maps.google.com/maps?cid=16329162499474686119",
    "https://www.youtube.com/@bewild.oficial",
  ],
} as const;

export const WEBSITE_JSONLD = {
  "@context": CONTEXT,
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  alternateName: ["Radar Bewild — guia do investidor em studios para short stay"],
  description: "Dados de diária e ocupação por bairro, comparador, mapa e simulador de receita para studios no Airbnb em São Paulo.",
  url: `${SITE_URL}/`,
  inLanguage: "pt-BR",
  publisher: { "@id": ORG_ID },
} as const;

export type PaginaSeo = {
  path: string;
  title: string;
  description: string;
  h1: string;
  bairro?: string;
};

export type DatasPagina = {
  /** ISO 8601 com fuso (-03:00) da última alteração do conteúdo. */
  dateModified?: string;
  /** ISO 8601 com fuso (-03:00) da primeira publicação (Article). */
  datePublished?: string;
};

type Trilha = { name: string; path: string }[];

/** Nomes curtos dos níveis intermediários (TRAIL_NAMES do bewild.com.br). */
const NOMES_TRILHA = {
  inicio: "Início",
  mercado: "Mercado",
  ranking: "Ranking de bairros",
  guia: "Guia do investidor",
} as const;

const PAGINAS_DE_DADOS = new Set(["/mercado", "/ranking", "/mapa", "/anuncios", "/comparar"]);

/** Trilha da página: Início → nível intermediário (quando houver) → página. */
export function trilhaDaPagina(p: PaginaSeo): Trilha {
  const inicio = { name: NOMES_TRILHA.inicio, path: "/" };
  const atual = { name: p.bairro ?? p.h1, path: p.path };
  if (p.path === "/") return [inicio];
  if (p.path.startsWith("/bairro/")) return [inicio, { name: NOMES_TRILHA.ranking, path: "/ranking" }, atual];
  if (p.path.startsWith("/guia/")) return [inicio, { name: NOMES_TRILHA.guia, path: "/" }, atual];
  if (PAGINAS_DE_DADOS.has(p.path) && p.path !== "/mercado") return [inicio, { name: NOMES_TRILHA.mercado, path: "/mercado" }, atual];
  return [inicio, atual];
}

export function breadcrumbJsonLd(trilha: Trilha) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trilha.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: urlCanonica(t.path),
    })),
  };
}

/** Tipo do nó de página: CollectionPage nas páginas que listam bairros, WebPage nas demais. */
export function tipoDaPagina(p: PaginaSeo): "WebPage" | "CollectionPage" {
  return PAGINAS_DE_DADOS.has(p.path) ? "CollectionPage" : "WebPage";
}

/**
 * Nó de página (toda página indexável, exceto a home): @id canonical#webpage, parte do
 * WebSite, sobre e publicado pela Bewild, imagem principal e trilha aninhada.
 * Na página de bairro, `about` é o lugar (Place dentro da cidade de São Paulo).
 */
export function webPageJsonLd(p: PaginaSeo, datas: DatasPagina = {}) {
  const url = urlCanonica(p.path);
  return {
    "@context": CONTEXT,
    "@type": tipoDaPagina(p),
    "@id": `${url}#webpage`,
    url,
    name: tituloComMarca(p.title),
    description: p.description,
    inLanguage: "pt-BR",
    isPartOf: { "@id": WEBSITE_ID },
    about: p.bairro
      ? { "@type": "Place", name: p.bairro, containedInPlace: { "@type": "City", name: "São Paulo", address: { "@type": "PostalAddress", addressLocality: "São Paulo", addressRegion: "SP", addressCountry: "BR" } } }
      : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGEM, width: 1200, height: 630 },
    ...(datas.dateModified ? { dateModified: datas.dateModified } : {}),
    breadcrumb: breadcrumbJsonLd(trilhaDaPagina(p)),
  };
}

/** Article dos temas do guia (/guia/<tema>): assinado pela Bewild como organização. */
export function articleJsonLd(p: PaginaSeo, datas: DatasPagina = {}) {
  const url = urlCanonica(p.path);
  return {
    "@context": CONTEXT,
    "@type": "Article",
    "@id": `${url}#article`,
    headline: p.h1,
    description: p.description,
    image: [OG_IMAGEM],
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    isPartOf: { "@id": WEBSITE_ID },
    url,
    inLanguage: "pt-BR",
    articleSection: NOMES_TRILHA.guia,
    isAccessibleForFree: true,
    ...(datas.datePublished ? { datePublished: datas.datePublished } : {}),
    ...(datas.dateModified ? { dateModified: datas.dateModified } : {}),
  };
}

/** ItemList dos bairros da base (páginas /ranking e /mercado), na ordem exibida. */
export function itemListBairrosJsonLd(nomes: string[], path: string) {
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    "@id": `${urlCanonica(path)}#lista-bairros`,
    name: "Bairros de São Paulo na base do Radar Bewild",
    numberOfItems: nomes.length,
    itemListElement: nomes.map((nome, i) => ({ "@type": "ListItem", position: i + 1, name: nome, url: urlCanonica(bairroPath(nome)) })),
  };
}

export const ehTemaGuia = (path: string) => TEMAS_GUIA.some((t) => `/guia/${t.slug}` === path);

/**
 * Todos os nós da página na ordem em que entram no HTML: Organization, WebSite, o nó
 * de página (fora da home), Article nos temas do guia e os extras da página (FAQPage,
 * Dataset, ItemList). Cada nó vira um <script> próprio.
 */
export function jsonLdDaPagina(p: PaginaSeo, datas: DatasPagina = {}, extras: object[] = []): object[] {
  const nos: object[] = [ORG_JSONLD, WEBSITE_JSONLD];
  if (p.path !== "/") nos.push(webPageJsonLd(p, datas));
  if (ehTemaGuia(p.path)) nos.push(articleJsonLd(p, datas));
  return [...nos, ...extras];
}

/** "2026-10-18T14:05:00-03:00": data ISO no fuso de São Paulo, como no bewild.com.br (saoPauloIso). */
export function isoSaoPaulo(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) throw new Error(`data inválida: ${String(data)}`);
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(d);
  const v = (t: string) => partes.find((x) => x.type === t)?.value ?? "00";
  const hora = v("hour") === "24" ? "00" : v("hour");
  return `${v("year")}-${v("month")}-${v("day")}T${hora}:${v("minute")}:${v("second")}-03:00`;
}
