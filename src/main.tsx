import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { precarregarHome } from "./rotaHome";
import "./index.css";

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
