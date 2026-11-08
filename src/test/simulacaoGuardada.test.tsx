import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

type Resposta = { data: unknown; error: unknown };
let resposta: Resposta = { data: null, error: null };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => resposta }) }) }),
  },
}));
vi.mock("@/hooks/useBairroData", () => ({
  useBairroData: () => ({ bairros: [{ name: "Mooca", coletadoEm: "2026-10-18" }], isLoading: false }),
}));

import SimulacaoGuardada from "@/components/ota/SimulacaoGuardada";
import { PREMISSAS_SIMULADOR_PADRAO } from "@/lib/simuladorReceita";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SimulacaoGuardada projectId="p1" /></MemoryRouter>);
  });
  return container;
}

const linha = (extra: Record<string, unknown> = {}) => ({
  created_at: "2026-10-20T15:00:00+00:00", neighborhood: null, area_sqm: null,
  premissas_simulador: null, versao_calculo: null, base_coletada_em: null, ...extra,
});
const NOTA = "A base de diária e ocupação foi atualizada";
const abrir = (el: HTMLElement) => [...el.querySelectorAll("a")].find((a) => a.textContent === "Reabrir na simulação");

beforeEach(() => { resposta = { data: null, error: null }; });
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("Simulação guardada em /projeto/:id", () => {
  it("erro na consulta mostra o estado de erro, sem link", async () => {
    resposta = { data: null, error: { message: "falhou" } };
    const el = await montar();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain("Não foi possível carregar a simulação");
    expect(abrir(el)).toBeUndefined();
  });

  it("sem linha, ou sem premissas e sem bairro, mostra o estado vazio", async () => {
    resposta = { data: null, error: null };
    let el = await montar();
    expect(el.textContent).toContain("Este projeto não tem simulação guardada; comece uma em /projecao.");
    expect(abrir(el)).toBeUndefined();
    await act(async () => root!.unmount()); el.remove();

    resposta = { data: linha(), error: null };
    el = await montar();
    expect(el.textContent).toContain("Este projeto não tem simulação guardada");
  });

  it("projeto antigo, só bairro e faixa, reabre com as premissas padrão e sem nota de base", async () => {
    resposta = { data: linha({ neighborhood: "Mooca", area_sqm: "20–25 m²" }), error: null };
    const el = await montar();
    expect(el.textContent).toContain("20/10/2026");
    expect(el.textContent).toContain("Mooca");
    expect(el.textContent).toContain("só o bairro e a faixa de área");
    expect(el.textContent).not.toContain(NOTA);
    const a = abrir(el)!;
    expect(a.getAttribute("href")).toBe("/projecao?bairro=mooca&area=20%E2%80%9325+m%C2%B2&reabrir=1");
  });

  it("base igual à vigente: link presente e sem nota", async () => {
    const premissas = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca", diaria: 310 };
    resposta = { data: linha({ neighborhood: "Mooca", premissas_simulador: premissas, base_coletada_em: "2026-10-18" }), error: null };
    const el = await montar();
    expect(abrir(el)?.getAttribute("href")).toContain("diaria=310");
    expect(el.textContent).not.toContain(NOTA);
  });

  it("base diferente da vigente: mostra a nota com a data atual", async () => {
    const premissas = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca" };
    resposta = { data: linha({ neighborhood: "Mooca", premissas_simulador: premissas, base_coletada_em: "2026-10-13" }), error: null };
    const el = await montar();
    expect(abrir(el)).toBeDefined();
    expect(el.textContent).toContain(`${NOTA} em 18/10/2026; ao reabrir, a conta é recalculada com a base atual.`);
  });
});
