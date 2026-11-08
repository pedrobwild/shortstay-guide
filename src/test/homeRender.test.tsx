import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

import Index from "@/pages/Index";
import { FAQ_ITEMS } from "@/components/guide/FAQSection";
import { AVISO_UNIVERSO } from "@/lib/estudo";
import { TEMAS_GUIA } from "@/data/temasGuia";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class IOStub { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver ??= IOStub;
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= IOStub;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar(rota: string) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <HelmetProvider>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter initialEntries={[rota]}>
            <Routes><Route path="/" element={<Index />} /></Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
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

/** Texto visível do <main> fora dos <details> (FAQ e temas recolhidos). */
function textoAberto(el: HTMLElement) {
  const main = el.querySelector("main")!.cloneNode(true) as HTMLElement;
  main.querySelectorAll("details").forEach((d) => d.remove());
  return main.textContent ?? "";
}

describe("home reestruturada (26/10/2026, base de reserva)", () => {
  it("hero com o bairro em análise: três números, natureza, diferença contra SP e o botão de simular", async () => {
    const el = await montar("/");
    const hero = el.querySelector("main section")!;
    expect(hero.querySelector("h1")?.textContent).toBe("Studios para short stay em São Paulo, bairro a bairro");
    expect(hero.textContent).toContain("R$ 299");
    expect(hero.textContent).toContain("63%");
    expect(hero.textContent).toContain("R$ 5.651");
    expect(hero.textContent).toContain("+R$ 881");
    expect(hero.textContent).toContain("Observado");
    expect(hero.querySelector('a[href="/projecao?bairro=pinheiros"]')?.textContent).toBe("Simular este bairro");
  });

  it("o universo da fonte aparece junto dos números de receita", async () => {
    const el = await montar("/");
    expect(el.textContent).toContain(AVISO_UNIVERSO);
  });

  it("Mooca leva o aviso de amostra pequena e Vila Olímpia a aproximação pelo Itaim Bibi", async () => {
    let el = await montar("/?bairro=mooca");
    expect(el.querySelector("main section")!.textContent).toContain("amostra pequena");
    act(() => root?.unmount());
    container?.remove();
    el = await montar("/?bairro=vila-olimpia");
    const hero = el.querySelector("main section")!.textContent;
    expect(hero).toContain("Aproximação");
    expect(hero).toContain("Itaim Bibi");
  });

  it("uma ideia por bloco: portas com um botão, figura dos bairros, cada número da reforma uma vez", async () => {
    const el = await montar("/");
    for (const id of ["perfis", "bairros", "reforma", "guia", "base", "faq"]) expect(el.querySelector(`#${id}`)).not.toBeNull();
    const portas = [...el.querySelectorAll("#perfis article")];
    expect(portas).toHaveLength(3);
    for (const p of portas) expect(p.querySelectorAll("a")).toHaveLength(1);
    expect(el.querySelectorAll("#bairros figure a[aria-label]")).toHaveLength(28);
    const aberto = textoAberto(el);
    expect(aberto.split("R$ 71.850").length - 1).toBe(2); // título e indicador da seção Reforma
    expect(aberto).toContain("não são garantia de resultado");
  });

  it("guia e FAQ ficam inteiros no HTML (destaques + recolhidos)", async () => {
    const el = await montar("/");
    expect(el.querySelectorAll('#guia a[href^="/guia/"]')).toHaveLength(TEMAS_GUIA.length);
    expect(el.querySelectorAll("#faq details > summary").length).toBe(FAQ_ITEMS.length + 1);
  });
});
