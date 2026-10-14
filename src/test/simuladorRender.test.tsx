import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Sem rede nos testes: o simulador usa a base de reserva (bairrosCurados) e nenhum usuário logado.
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

import SimuladorSection from "@/components/guide/SimuladorSection";
import CompararBairros from "@/pages/CompararBairros";

// Renderiza de verdade (react-dom), para pegar erros de montagem que testes de funções puras não pegam.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// jsdom não tem IntersectionObserver (usado pelas animações de entrada); um stub basta para montar.
class IOStub { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver ??= IOStub;
// Idem para ResizeObserver (usado pelo controle deslizante).
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= IOStub;
let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar(ui: React.ReactNode, rota = "/") {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>
      </QueryClientProvider>,
    );
  });
  return container.textContent ?? "";
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("renderização", () => {
  it("o simulador monta com compartilhar e guardar", async () => {
    const texto = await montar(<SimuladorSection />);
    expect(texto).toContain("Compartilhar simulação");
    expect(texto).toContain("Criar conta e guardar");
  });

  it("o comparador monta com os bairros da URL e a fonte de cada um", async () => {
    const texto = await montar(<CompararBairros />, "/comparar?b=pinheiros,mooca");
    const titulos = [...container!.querySelectorAll("h2")].map((h) => h.textContent);
    expect(titulos).toEqual(["Pinheiros", "Mooca"]);
    expect(texto).toContain("amostra pequena");
  });
});
