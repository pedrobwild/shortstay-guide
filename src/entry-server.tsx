// Entrada usada só no build (pré-renderização). Renderiza a mesma árvore do app
// com um roteador estático e devolve o HTML + head gerado pelo Helmet.
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import type { HelmetData } from "react-helmet-async";
import { AppShell, AppRoutes } from "./App";
import { FAQ_ITEMS } from "./components/guide/FAQSection";

export { FAQ_ITEMS };

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
