import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

const { mockRegistrar, mockTrack } = vi.hoisted(() => ({ mockRegistrar: vi.fn(), mockTrack: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert: async () => ({ error: null }) }) } }));
vi.mock("@/lib/pedidosMaterial", async (original) => ({
  ...(await original<typeof import("@/lib/pedidosMaterial")>()),
  registrarPedido: mockRegistrar,
}));
vi.mock("@/hooks/useGuideAnalytics", () => ({ trackGlobal: mockTrack, getGlobalSessionId: () => "sessao-1" }));

import PedidoMaterial from "@/components/captacao/PedidoMaterial";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// A caixa de seleção (Radix) mede o próprio tamanho; o jsdom não tem ResizeObserver.
class ROStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= ROStub;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PedidoMaterial material="checklist_compra" origem="bairro" bairro="Mooca" />
      </MemoryRouter>,
    );
  });
  return container;
}

/** Preenche um input controlado do React (setter nativo + evento input). */
function digitar(input: HTMLInputElement, valor: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const email = (el: HTMLElement) => el.querySelector<HTMLInputElement>('input[type="email"]')!;
const botao = (el: HTMLElement) => [...el.querySelectorAll("button")].find((b) => b.textContent === "Receber meu checklist")!;
const linkChecklist = (el: HTMLElement) => [...el.querySelectorAll("a")].find((a) => a.getAttribute("href") === "/guia/checklist");

async function enviar(el: HTMLElement) {
  await act(async () => { botao(el).click(); });
}

beforeEach(() => {
  mockRegistrar.mockReset();
  mockTrack.mockReset();
  localStorage.clear();
});
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("PedidoMaterial", () => {
  it("mostra título, campos, boletim desmarcado e o consentimento com o link da política", async () => {
    const el = await montar();
    expect(el.textContent).toContain("Antes de comprar o studio, confira o que pode mudar a conta.");
    expect(el.textContent).toContain("Receba um checklist para avaliar o prédio, a unidade, os custos e a preparação para alugar.");
    const caixa = el.querySelector('[role="checkbox"]')!;
    expect(caixa.getAttribute("aria-checked")).toBe("false");
    expect(el.textContent).toContain("Quero também receber as próximas análises do Radar Bewild.");
    const politica = el.querySelector<HTMLAnchorElement>('a[href="https://bewild.com.br/privacidade"]')!;
    expect(politica.getAttribute("target")).toBe("_blank");
    expect(politica.textContent).toContain("(abre em nova aba)");
    expect(el.textContent).toContain("A Bewild usa seu e-mail só para enviar este material");
  });

  it("sem e-mail o botão não envia e avisa o que falta", async () => {
    const el = await montar();
    await enviar(el);
    expect(mockRegistrar).not.toHaveBeenCalled();
    expect(email(el).getAttribute("aria-invalid")).toBe("true");
    expect(el.textContent).toContain("Informe um e-mail válido");
  });

  it("com e-mail válido e registro ok, entrega o link do checklist e mede sem o e-mail", async () => {
    localStorage.setItem("radar_momento", JSON.stringify({ momento: "procurando", quando: Date.now() }));
    mockRegistrar.mockResolvedValueOnce("ok");
    const el = await montar();
    digitar(email(el), " pedro@bewild.com.br ");
    await enviar(el);
    expect(mockRegistrar).toHaveBeenCalledWith({
      email: "pedro@bewild.com.br", nome: null, material: "checklist_compra", etapa: "procurando", bairro: "Mooca",
      boletim: false, consentimento_versao: "2026-10-27", origem: "bairro", sessao: "sessao-1",
    });
    expect(el.textContent).toContain("Pedido registrado. O checklist está aqui:");
    expect(linkChecklist(el)?.textContent).toBe("Checklist antes de comprar o studio");
    expect(mockTrack).toHaveBeenCalledWith("material_solicitado", { material: "checklist_compra", origem: "bairro", boletim: false });
    expect(JSON.stringify(mockTrack.mock.calls)).not.toContain("pedro@");
  });

  it("boletim marcado vai no registro; pedido repetido mostra o mesmo sucesso e não mede", async () => {
    mockRegistrar.mockResolvedValueOnce("duplicado");
    const el = await montar();
    digitar(email(el), "pedro@bewild.com.br");
    await act(async () => { el.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(); });
    await enviar(el);
    expect(mockRegistrar.mock.calls[0][0].boletim).toBe(true);
    expect(el.textContent).toContain("Pedido registrado. O checklist está aqui:");
    expect(linkChecklist(el)).toBeDefined();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("em erro, avisa e mantém o link do checklist", async () => {
    mockRegistrar.mockResolvedValueOnce("erro");
    const el = await montar();
    digitar(email(el), "pedro@bewild.com.br");
    await enviar(el);
    expect(el.textContent).toContain("Não foi possível registrar agora; o checklist continua disponível em");
    expect(linkChecklist(el)).toBeDefined();
    expect(botao(el)).toBeDefined();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("enquanto registra, o botão fica ocupado e não duplica o pedido", async () => {
    let resolver: (v: string) => void = () => {};
    mockRegistrar.mockReturnValueOnce(new Promise((res) => { resolver = res; }));
    const el = await montar();
    digitar(email(el), "pedro@bewild.com.br");
    await enviar(el);
    expect(botao(el).getAttribute("aria-busy")).toBe("true");
    expect(botao(el).disabled).toBe(true);
    await enviar(el);
    expect(mockRegistrar).toHaveBeenCalledTimes(1);
    await act(async () => { resolver("ok"); });
    expect(el.textContent).toContain("Pedido registrado.");
  });
});
