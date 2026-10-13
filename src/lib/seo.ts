import seo from "@/data/seoRoutes.json";

export const SITE_URL = seo.siteUrl;
export const SITE_NAME = seo.siteName;
export const SEO_ROUTES = seo.routes;
export const SEO_BAIRROS = seo.bairros;

/** Slug: minúsculas, sem acento, com hífen. */
export function slugifyBairro(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const bairroPath = (name: string) => `/bairro/${slugifyBairro(name)}`;

export function bairroTitle(name: string) {
  return `Studio para Airbnb em ${name}: diária, ocupação e receita | ${SITE_NAME}`;
}
export function bairroDescription(name: string) {
  return `Diária média, ocupação, receita estimada e score de investimento para studios de short stay em ${name}, São Paulo.`;
}

export function isPrivatePath(pathname: string) {
  return seo.privatePrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
