import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Sem rede nos testes: base de reserva (bairrosCurados) e nenhum usuário logado.
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import ProjecaoStudio from "@/components/projecao/ProjecaoStudio";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class IOStub { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver ??= IOStub;
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= IOStub;
if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar(rota: string) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[rota]}><GuideDecisionProvider><ProjecaoStudio /></GuideDecisionProvider></MemoryRouter>
      </QueryClientProvider>,
    );
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("/projecao a 320 px: sem scroll horizontal da página", () => {
  it("a linha numérica da fórmula só fica numa linha a partir de sm (quebra no celular)", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    const span = [...el.querySelectorAll("span")].find((s) => s.textContent?.includes("× 30 ×") && s.textContent.includes("=") && s.className.includes("tabular-nums"));
    expect(span, "span da fórmula numérica").toBeTruthy();
    const classes = span!.className.split(/\s+/);
    expect(classes).toContain("sm:whitespace-nowrap");
    expect(classes).not.toContain("whitespace-nowrap");
  });

  it("a Tab. 1 rola dentro da própria caixa (overflow-x-auto)", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    const tabela = [...el.querySelectorAll("table")].find((t) => t.textContent?.includes("Da receita bruta ao resultado líquido"));
    expect(tabela, "Tab. 1").toBeTruthy();
    expect(tabela!.parentElement!.className).toContain("overflow-x-auto");
  });
});
