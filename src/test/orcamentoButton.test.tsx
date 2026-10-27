import { afterEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("@/lib/marketingConsent", () => ({ trackBudgetClick: vi.fn(), canMeasure: () => true }));
vi.mock("@/hooks/useGuideAnalytics", () => ({ trackGlobal: vi.fn() }));

import { MemoryRouter } from "react-router-dom";
import OrcamentoButton from "@/components/OrcamentoButton";
import FinalCTASection from "@/components/guide/FinalCTASection";
import { lembrarBairro } from "@/lib/retomada";
import { orcamentoUrl } from "@/lib/orcamento";
import { trackBudgetClick } from "@/lib/marketingConsent";
import { trackGlobal } from "@/hooks/useGuideAnalytics";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FUTURO = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar(el: ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(el);
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  vi.clearAllMocks();
  try { localStorage.clear(); } catch { /* sem armazenamento */ }
});

describe("OrcamentoButton", () => {
  it("renderiza o CTA oficial como link externo e mede o clique", async () => {
    const c = await montar(<OrcamentoButton local="projecao" contexto={{ bairro: "Mooca" }} />);
    const a = c.querySelector("a")!;
    expect(a.textContent).toContain("Peça seu orçamento");
    expect(a.getAttribute("href")).toBe(orcamentoUrl("projecao", { bairro: "Mooca" }));
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    // evita navegação do jsdom no clique
    a.addEventListener("click", (e) => e.preventDefault());
    await act(async () => { a.click(); });
    expect(trackBudgetClick).toHaveBeenCalledWith("projecao");
    expect(trackGlobal).toHaveBeenCalledWith("cta_clicked", expect.objectContaining({ cta_id: "orcamento", local: "projecao", bairro: "Mooca" }));
  });

  it("rótulo próprio continua valendo", async () => {
    const c = await montar(<OrcamentoButton local="final" rotulo="Solicitar orçamento para este studio" />);
    expect(c.querySelector("a")!.textContent).toContain("Solicitar orçamento para este studio");
  });

  it("avisa leitor de tela que abre em nova aba, a não ser com icone={false}", async () => {
    let c = await montar(<OrcamentoButton local="hero" />);
    expect(c.querySelector("a")!.textContent).toContain("(abre em nova aba)");
    expect(c.querySelector("a svg")).not.toBeNull();
    act(() => root?.unmount());
    c.remove();
    c = await montar(<OrcamentoButton local="hero" icone={false} />);
    expect(c.querySelector("a svg")).toBeNull();
  });

  it("sem contexto, o evento leva bairro nulo", async () => {
    const c = await montar(<OrcamentoButton local="rodape" />);
    const a = c.querySelector("a")!;
    a.addEventListener("click", (e) => e.preventDefault());
    await act(async () => { a.click(); });
    expect(trackGlobal).toHaveBeenCalledWith("cta_clicked", { cta_id: "orcamento", local: "rodape", bairro: null });
  });
});

describe("FinalCTASection", () => {
  it("leva o bairro atual na URL do pedido, lido depois da montagem; sem bairro, só UTMs", async () => {
    let c = await montar(<MemoryRouter future={FUTURO}><FinalCTASection /></MemoryRouter>);
    const href = () => new URL(c.querySelector('a[href^="https://bewild.com.br/orcamento"]')!.getAttribute("href")!);
    expect(href().searchParams.has("bairro")).toBe(false);
    act(() => root?.unmount());
    c.remove();
    lembrarBairro("mooca", "Mooca");
    c = await montar(<MemoryRouter future={FUTURO}><FinalCTASection /></MemoryRouter>);
    expect(href().searchParams.get("bairro")).toBe("Mooca");
    expect(href().searchParams.get("utm_content")).toBe("final");
  });
});
