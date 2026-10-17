// Entrada usada só no build (pré-renderização). Renderiza a mesma árvore do app
// com um roteador estático e devolve o HTML + head gerado pelo Helmet.
import { PassThrough } from "stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import type { HelmetData } from "react-helmet-async";
import { AppShell, AppRoutes } from "./App";
import { FAQ_ITEMS } from "./components/guide/FAQSection";

import { TabelaBairrosEstatica, BairroEstatico } from "./components/PreRenderMercado";

export { FAQ_ITEMS };

/** HTML estático das páginas de dados (/ranking, /mercado, /bairro/*); o app o substitui ao abrir. */
export function renderEstatico(p: { path: string; h1: string; description: string; bairro?: string }): string | null {
  if (p.path === "/ranking" || p.path === "/mercado") return renderToStaticMarkup(<TabelaBairrosEstatica h1={p.h1} descricao={p.description} />);
  if (p.bairro) return renderToStaticMarkup(<BairroEstatico nome={p.bairro} h1={p.h1} descricao={p.description} />);
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
