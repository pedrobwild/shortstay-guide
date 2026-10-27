import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";

const { insert } = vi.hoisted(() => ({ insert: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => ({ insert })) },
}));

import MedicaoGlobal from "@/components/MedicaoGlobal";
import { trackGlobal, getGlobalSessionId } from "@/hooks/useGuideAnalytics";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Evento = { event_type: string; page: string };

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let ir: ((para: string) => void) | null = null;

/** Expõe o navigate do roteador para o teste simular a troca de rota. */
function Navegador() {
  const navigate = useNavigate();
  ir = (para) => navigate(para);
  return null;
}

/** O `page` vem do roteador; o `canMeasure` lê window.location, então os dois acompanham a rota. */
async function montar(rota: string) {
  window.history.replaceState({}, "", rota);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <MemoryRouter initialEntries={[rota]}>
        <MedicaoGlobal />
        <Navegador />
      </MemoryRouter>,
    );
  });
}

async function passar5s() {
  await act(async () => { vi.advanceTimersByTime(5000); });
}

beforeEach(() => {
  vi.useFakeTimers();
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  localStorage.setItem("radar_bewild_consent_v1", "accepted");
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  ir = null;
  vi.useRealTimers();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("MedicaoGlobal (telemetria interna em toda rota pública)", () => {
  it("registra trackGlobal fora da home e grava page com o caminho", async () => {
    await montar("/projecao?bairro=mooca");
    trackGlobal("cta_clicked", { cta_id: "x" });
    await passar5s();
    const lote = insert.mock.calls[0][0] as Evento[];
    expect(lote.map((e) => e.event_type)).toEqual(["page_view", "cta_clicked"]);
    expect(lote.every((e) => e.page === "/projecao")).toBe(true);
  });

  it("sem consentimento não grava nada", async () => {
    localStorage.clear();
    await montar("/bairro/pinheiros");
    trackGlobal("cta_clicked", {});
    await passar5s();
    expect(insert).not.toHaveBeenCalled();
  });

  it("em /admin não registra page_view", async () => {
    await montar("/admin/leads");
    await passar5s();
    expect(insert).not.toHaveBeenCalled();
  });

  it("registra um page_view a cada troca de caminho, com o page de cada rota", async () => {
    await montar("/ranking");
    window.history.replaceState({}, "", "/guia/reforma");
    await act(async () => { ir!("/guia/reforma"); });
    await passar5s();
    const lote = insert.mock.calls[0][0] as Evento[];
    expect(lote.map((e) => [e.event_type, e.page])).toEqual([
      ["page_view", "/ranking"],
      ["page_view", "/guia/reforma"],
    ]);
  });

  it("expõe o session_id enquanto montado e o limpa ao desmontar", async () => {
    await montar("/mercado");
    expect(getGlobalSessionId()).toBeTruthy();
    act(() => root!.unmount());
    expect(getGlobalSessionId()).toBeNull();
    insert.mockClear(); // a desmontagem descarrega o que já estava no buffer
    trackGlobal("cta_clicked", {});
    await passar5s();
    expect(insert).not.toHaveBeenCalled();
    root = createRoot(container!); // o afterEach desmonta de novo
  });
});
