import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { precarregarHome } from "./rotaHome";
import "./index.css";

// Após uma nova versão, a aba aberta pode pedir arquivos que já não existem.
// Recarrega uma única vez (guarda de 10s) para buscar a versão atual.
const CHAVE_RECARGA = "bw-chunk-reload";
function recarregarVersaoNova() {
  const ultima = Number(sessionStorage.getItem(CHAVE_RECARGA) || 0);
  if (Date.now() - ultima < 10_000) return;
  sessionStorage.setItem(CHAVE_RECARGA, String(Date.now()));
  window.location.reload();
}
const ehFalhaDeChunk = (msg: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(String(msg));
window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); recarregarVersaoNova(); });
window.addEventListener("unhandledrejection", (e) => {
  if (ehFalhaDeChunk((e.reason as Error)?.message ?? e.reason)) recarregarVersaoNova();
});
window.addEventListener("error", (e) => { if (ehFalhaDeChunk(e.message)) recarregarVersaoNova(); });

const root = document.getElementById("root")!;
// Hidrata só quando o HTML pré-renderizado (com React) é da própria rota atual.
// O index.html também é servido como fallback para outras rotas; nesse caso,
// ou nas páginas com conteúdo estático simples, recria do zero.
const ssrPath = root.getAttribute("data-ssr-path");
if (ssrPath && ssrPath === window.location.pathname) {
  // Só a home é pré-renderizada com React; carrega a página antes de hidratar (ver precarregarHome).
  const pronto = ssrPath === "/" ? precarregarHome().catch(() => undefined) : Promise.resolve();
  void pronto.then(() => hydrateRoot(root, <App />));
} else {
  root.innerHTML = "";
  createRoot(root).render(<App />);
}
