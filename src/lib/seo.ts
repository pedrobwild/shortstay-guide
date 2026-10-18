import seo from "@/data/seoRoutes.json";

export const SITE_URL = seo.siteUrl;
export const SITE_NAME = seo.siteName;
export const SEO_ROUTES = seo.routes;
export const SEO_BAIRROS = seo.bairros;
export const PREFIXOS_PRIVADOS = seo.privatePrefixes;

/** Imagem de compartilhamento (1200×630) usada em todas as páginas e o texto alternativo dela. */
export const OG_IMAGEM = `${SITE_URL}/og-radar-curados-20261013.jpg`;
export const OG_IMAGEM_ALT = "Radar Bewild — dados de short stay por bairro em São Paulo";

/** Diretivas de robots das páginas públicas (as mesmas do bewild.com.br) e das privadas. */
export const ROBOTS_INDEXAVEL = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
export const ROBOTS_NOINDEX = "noindex, nofollow";

/** Títulos visíveis no Google cabem em ~60 caracteres (regra do bewild.com.br: VISIBLE_TITLE_MAX). */
export const TITULO_VISIVEL_MAX = 60;

/**
 * Acrescenta " | Radar Bewild" só quando o título inteiro cabe nos 60 caracteres visíveis
 * (regra brandTitle do bewild.com.br). Título que já cita a marca fica como está.
 */
export function tituloComMarca(titulo: string, marca = SITE_NAME): string {
  const base = titulo.trim();
  if (base.includes(marca)) return base;
  const completo = `${base} | ${marca}`;
  return completo.length <= TITULO_VISIVEL_MAX ? completo : base;
}

/** Slug: minúsculas, sem acento, com hífen. */
export function slugifyBairro(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const bairroPath = (name: string) => `/bairro/${slugifyBairro(name)}`;

/** Título da página de bairro, sem a marca (tituloComMarca decide se ela cabe). */
export function bairroTitle(name: string) {
  return `Studio para Airbnb em ${name}: diária, ocupação e receita`;
}
export function bairroDescription(name: string) {
  return `Diária média, ocupação, receita estimada e score de investimento para studios de short stay em ${name}, São Paulo.`;
}
export function bairroH1(name: string) {
  return `Studio para Airbnb em ${name}`;
}

/**
 * Caminho canônico: sem query, sem #hash e sem barra final (a raiz fica "/").
 * O mesmo critério do bewild.com.br (seoHead) e do redirecionamento lowercasePathRedirect.
 */
export function caminhoCanonico(pathname: string): string {
  const limpo = pathname.split("#")[0].split("?")[0].replace(/\/+$/, "");
  return limpo === "" ? "/" : limpo;
}

export const urlCanonica = (pathname: string) => `${SITE_URL}${caminhoCanonico(pathname)}`;

export function isPrivatePath(pathname: string) {
  return PREFIXOS_PRIVADOS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
