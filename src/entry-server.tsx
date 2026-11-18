// Entrada usada só no build (pré-renderização). Renderiza a mesma árvore do app
// com um roteador estático e devolve o HTML + head gerado pelo Helmet.
import { PassThrough } from "stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import type { HelmetData } from "react-helmet-async";
import { AppShell, AppRoutes } from "./App";
import { FAQ_ITEMS } from "./components/guide/FAQSection";

import { TabelaBairrosEstatica, BairroEstatico } from "./components/PreRenderMercado";
import { ConteudoTema } from "./pages/GuiaTema";
import { temaPorSlug } from "./data/temasGuia";
import { ConteudoMetodologia } from "./pages/Metodologia";
import { ConteudoPerfil } from "./pages/PerfilDestino";
import { csvDadosAbertos, datasetJsonLd, jsonDadosAbertos, linhasDadosAbertos } from "./lib/dadosAbertos";
import { bairrosReserva } from "./lib/radarBase";
import { bairroDescription, bairroH1, bairroTitle, tituloComMarca, OG_IMAGEM, OG_IMAGEM_ALT, ROBOTS_INDEXAVEL, ROBOTS_NOINDEX, caminhoCanonico } from "./lib/seo";
import { isoSaoPaulo, itemListBairrosJsonLd, jsonLdDaPagina } from "./lib/seoJsonLd";
import { gerarLlmsTxt, LLMS_TXT_CAMINHOS } from "./lib/llmsTxt";
import { CatalogoEmpreendimentosEstatico, EmpreendimentoEstatico } from "./components/empreendimentos/EmpreendimentosEstatico";
import { bairroNaBase, COLUNAS_PUBLICAS, paginaSeoEmpreendimento, type Empreendimento } from "./lib/empreendimentos";
import type { BairroBase } from "./lib/radarUi";
import ReformaNoSite from "./components/ReformaNoSite";
import { linksDeRetornoAusentes } from "./lib/linksRetorno";
import { ConteudoEstatico, IndiceConteudosEstatico } from "./components/conteudos/ConteudosEstatico";
import { COLUNAS_CONTEUDO, caminhoTipo, ehIndexavel, ehPublicavel, ordenarConteudos, paginaSeoConteudo, type ConteudoRadar, type TipoConteudo } from "./lib/conteudosRadar";
import { rssConteudos } from "./lib/conteudosFeed";
import { conteudosDoRepositorio } from "./lib/conteudosRepositorio";
import { conteudoJsonLd, itemListConteudosJsonLd } from "./lib/seoJsonLd";

// Tudo que scripts/prerender.mjs usa do código do app (regras de SEO ficam em TS, testadas).
export {
  FAQ_ITEMS, csvDadosAbertos, datasetJsonLd, jsonDadosAbertos, linhasDadosAbertos, bairrosReserva,
  bairroDescription, bairroH1, bairroTitle, tituloComMarca, OG_IMAGEM, OG_IMAGEM_ALT, ROBOTS_INDEXAVEL, ROBOTS_NOINDEX, caminhoCanonico,
  isoSaoPaulo, itemListBairrosJsonLd, jsonLdDaPagina, gerarLlmsTxt, LLMS_TXT_CAMINHOS, linksDeRetornoAusentes, rssConteudos, ehIndexavel, conteudosDoRepositorio,
};

/** Bloco de retorno para o bewild.com.br (índice de custo + reforma por bairro) das páginas cujo HTML estático não tem o rodapé. */
export const renderReformaNoSite = (): string => renderToStaticMarkup(<ReformaNoSite />);

// ---------- Empreendimentos (dados do banco, lidos no build pela chave pública) ----------
/** Colunas da leitura pública no build (as do site + a data de alteração para o lastmod). */
export const COLUNAS_EMPREENDIMENTOS_BUILD = `${COLUNAS_PUBLICAS},atualizado_em`;
const SLUG_SEGURO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Páginas /empreendimentos/<slug> dos publicados (slug fora do padrão fica de fora: vira caminho de arquivo). */
export function paginasEmpreendimentos(lista: Empreendimento[]) {
  const base = bairrosReserva() as BairroBase[];
  return lista
    .filter((e) => e.status === "publicado" && SLUG_SEGURO.test(e.slug))
    .map((e) => ({ ...paginaSeoEmpreendimento(e, bairroNaBase(e.bairro, base) !== null), priority: "0.5", empreendimento: e, atualizadoEm: e.atualizado_em ?? null }));
}

export function renderEmpreendimentoEstatico(e: Empreendimento): string {
  const naBase = bairroNaBase(e.bairro, bairrosReserva() as BairroBase[]);
  return renderToStaticMarkup(<EmpreendimentoEstatico e={e} naBase={naBase} />);
}

export function renderCatalogoEmpreendimentosEstatico(p: { h1: string; description: string }, lista: Empreendimento[]): string {
  return renderToStaticMarkup(<CatalogoEmpreendimentosEstatico h1={p.h1} descricao={p.description} lista={lista} />);
}

// ---------- Conteúdos (artigos, releases e estudos do banco, lidos no build pela chave pública) ----------
export const COLUNAS_CONTEUDOS_BUILD = COLUNAS_CONTEUDO;

/** Só o que pode virar página: publicado, de tipo conhecido e com endereço seguro (vira caminho de arquivo). */
export const conteudosDoBuild = (lista: ConteudoRadar[]): ConteudoRadar[] => ordenarConteudos(lista.filter(ehPublicavel));

/** Textos do repositório + do banco, sem repetir endereço (o arquivo do repositório prevalece). */
export function juntarConteudosDoBuild(doBanco: ConteudoRadar[], doRepositorio: ConteudoRadar[] = conteudosDoRepositorio()): ConteudoRadar[] {
  const slugs = new Set(doRepositorio.map((c) => c.slug));
  return conteudosDoBuild([...doRepositorio, ...doBanco.filter((c) => !slugs.has(c.slug))]);
}

/**
 * Páginas /conteudos/<slug>. Texto com versão original no site Bewild (`canonical_externo`)
 * ganha a página, mas com o canonical apontando para lá e fora do sitemap.
 */
export function paginasConteudos(lista: ConteudoRadar[]) {
  return conteudosDoBuild(lista).map((c) => ({
    ...paginaSeoConteudo(c),
    priority: "0.6",
    conteudo: c,
    atualizadoEm: c.atualizado_em,
    publicadoEm: c.publicado_em,
    ogImagem: c.capa_url,
    ogImagemAlt: c.capa_alt,
    canonical: c.canonical_externo,
    foraDoSitemap: !ehIndexavel(c),
    jsonLd: [conteudoJsonLd(c)],
  }));
}

/** Textos de um índice: todos em /conteudos, só os do tipo em /conteudos/<tipo>. */
export const conteudosDoIndice = (lista: ConteudoRadar[], tipo?: TipoConteudo): ConteudoRadar[] =>
  conteudosDoBuild(lista).filter((c) => !tipo || c.tipo === tipo);

export const jsonLdIndiceConteudos = (lista: ConteudoRadar[], path: string) => itemListConteudosJsonLd(lista.filter(ehIndexavel), path);
export const caminhoIndiceTipo = (tipo: TipoConteudo) => caminhoTipo(tipo);

export function renderConteudoEstatico(c: ConteudoRadar, todos: ConteudoRadar[]): string {
  const relacionados = conteudosDoBuild(todos).filter((o) => o.tipo === c.tipo && o.slug !== c.slug).slice(0, 3);
  return renderToStaticMarkup(<ConteudoEstatico c={c} relacionados={relacionados} />);
}

export function renderIndiceConteudosEstatico(p: { h1: string; description: string }, lista: ConteudoRadar[]): string {
  return renderToStaticMarkup(<IndiceConteudosEstatico h1={p.h1} descricao={p.description} lista={lista} />);
}

/** HTML estático das páginas de dados (/ranking, /mercado, /bairro/*); o app o substitui ao abrir. */
export function renderEstatico(p: { path: string; h1: string; description: string; bairro?: string }): string | null {
  if (p.path === "/reformar" || p.path === "/operar") {
    return renderToStaticMarkup(
      <AppShell helmetContext={{}}>
        <StaticRouter location={p.path}>
          <ConteudoPerfil etapa={p.path === "/reformar" ? "reformar" : "tenho"} bairros={bairrosReserva()} />
        </StaticRouter>
      </AppShell>,
    );
  }
  if (p.path === "/ranking" || p.path === "/mercado") return renderToStaticMarkup(<TabelaBairrosEstatica h1={p.h1} descricao={p.description} />);
  if (p.bairro) return renderToStaticMarkup(<BairroEstatico nome={p.bairro} h1={p.h1} descricao={p.description} />);
  // /guia/<tema>: a seção completa (mesmo componente da home) com links e fontes; o app a substitui ao abrir.
  const tema = p.path.startsWith("/guia/") ? temaPorSlug(p.path.slice("/guia/".length)) : undefined;
  if (tema) {
    return renderToStaticMarkup(
      <AppShell helmetContext={{}}>
        <StaticRouter location={p.path}>
          <header><h1>{p.h1}</h1><p>{p.description}</p></header>
          <ConteudoTema slug={tema.slug} />
        </StaticRouter>
      </AppShell>,
    );
  }
  // /metodologia: conteúdo completo com o registro de atualizações da reserva offline; o app o substitui ao abrir.
  if (p.path === "/metodologia") {
    return renderToStaticMarkup(
      <AppShell helmetContext={{}}>
        <StaticRouter location={p.path}>
          <ConteudoMetodologia />
        </StaticRouter>
      </AppShell>,
    );
  }
  return null;
}

export function render(url: string): Promise<{ html: string; helmet: HelmetData | undefined }> {
  const helmetContext: { helmet?: HelmetData } = {};
  return new Promise((resolve, reject) => {
    let html = "";
    const stream = new PassThrough();
    stream.on("data", (c) => (html += c.toString()));
    stream.on("end", () => resolve({ html, helmet: helmetContext.helmet }));
    const { pipe } = renderToPipeableStream(
      <AppShell helmetContext={helmetContext}>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </AppShell>,
      {
        onAllReady() { pipe(stream); },
        onShellError: reject,
        onError(err) { console.error("[ssr]", err); },
      },
    );
  });
}
