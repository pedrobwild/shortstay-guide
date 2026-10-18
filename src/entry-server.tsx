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
import { csvDadosAbertos, datasetJsonLd, jsonDadosAbertos, linhasDadosAbertos } from "./lib/dadosAbertos";
import { bairrosReserva } from "./lib/radarBase";
import { bairroDescription, bairroH1, bairroTitle, tituloComMarca, OG_IMAGEM, OG_IMAGEM_ALT, ROBOTS_INDEXAVEL, ROBOTS_NOINDEX, caminhoCanonico } from "./lib/seo";
import { isoSaoPaulo, itemListBairrosJsonLd, jsonLdDaPagina } from "./lib/seoJsonLd";
import { gerarLlmsTxt, LLMS_TXT_CAMINHOS } from "./lib/llmsTxt";

// Tudo que scripts/prerender.mjs usa do código do app (regras de SEO ficam em TS, testadas).
export {
  FAQ_ITEMS, csvDadosAbertos, datasetJsonLd, jsonDadosAbertos, linhasDadosAbertos, bairrosReserva,
  bairroDescription, bairroH1, bairroTitle, tituloComMarca, OG_IMAGEM, OG_IMAGEM_ALT, ROBOTS_INDEXAVEL, ROBOTS_NOINDEX, caminhoCanonico,
  isoSaoPaulo, itemListBairrosJsonLd, jsonLdDaPagina, gerarLlmsTxt, LLMS_TXT_CAMINHOS,
};

/** HTML estático das páginas de dados (/ranking, /mercado, /bairro/*); o app o substitui ao abrir. */
export function renderEstatico(p: { path: string; h1: string; description: string; bairro?: string }): string | null {
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
