/**
 * Feed RSS 2.0 dos conteúdos do Radar (/conteudos/rss.xml), gerado no build com os mesmos
 * textos do sitemap: só publicados e indexáveis (texto com versão original no site Bewild
 * fica de fora). Leva título, resumo e link; o corpo completo fica na página.
 */
import { SITE_NAME, SITE_URL, urlCanonica } from "@/lib/seo";
import { CAMINHO_CONTEUDOS, CAMINHO_FEED, TIPOS_CONTEUDO, caminhoConteudo, ehIndexavel, ordenarConteudos, type ConteudoRadar } from "@/lib/conteudosRadar";

export const TITULO_FEED = `${SITE_NAME} — Conteúdos`;
export const DESCRICAO_FEED = "Artigos, releases e estudos do Radar Bewild sobre studios e short stay em São Paulo.";

const xml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
/** Data no formato do RSS (RFC 822), em UTC. */
const rfc822 = (iso: string) => new Date(iso).toUTCString();

type ItemFeed = Pick<ConteudoRadar, "slug" | "tipo" | "titulo" | "resumo" | "status" | "canonical_externo" | "publicado_em" | "atualizado_em">;

export function rssConteudos(lista: ItemFeed[], geradoEm: Date = new Date()): string {
  const itens = ordenarConteudos(lista.filter(ehIndexavel)).slice(0, 50);
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>${xml(TITULO_FEED)}</title>`,
    `    <link>${SITE_URL}${CAMINHO_CONTEUDOS}</link>`,
    `    <description>${xml(DESCRICAO_FEED)}</description>`,
    `    <language>pt-BR</language>`,
    `    <lastBuildDate>${rfc822((itens[0]?.atualizado_em) ?? geradoEm.toISOString())}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}${CAMINHO_FEED}" rel="self" type="application/rss+xml" />`,
    ...itens.map((c) => {
      const url = urlCanonica(caminhoConteudo(c.slug));
      return [
        `    <item>`,
        `      <title>${xml(c.titulo)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <category>${xml(TIPOS_CONTEUDO[c.tipo].rotulo)}</category>`,
        `      <pubDate>${rfc822(c.publicado_em ?? c.atualizado_em)}</pubDate>`,
        `      <description>${xml(c.resumo)}</description>`,
        `    </item>`,
      ].join("\n");
    }),
    `  </channel>`,
    `</rss>`,
    ``,
  ].join("\n");
}
