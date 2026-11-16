import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Sem rede nos testes: base de reserva (bairrosCurados) e nenhum usuário logado.
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

import ResumoEstudo from "@/pages/ResumoEstudo";
import { CHAVE_RASCUNHO, PREMISSAS_SIMULADOR_PADRAO } from "@/lib/simuladorReceita";
import { formatBRL } from "@/lib/numberFormat";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <HelmetProvider>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter initialEntries={["/resumo"]}><ResumoEstudo /></MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  });
  return container;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("/resumo: fechamento do estudo em 3 passos", () => {
  it("sem bairro escolhido, mostra os três passos como links e nenhum número de exemplo", async () => {
    const el = await montar();
    expect(el.querySelector("#bairro h2")?.textContent).toBe("Você ainda não escolheu um bairro");
    expect([...el.querySelectorAll("#bairro a, #conta a, #reforma a")].map((a) => a.getAttribute("href"))).toEqual(["/ranking", "/projecao", "/reformar"]);
    expect(el.querySelector("#conta")?.textContent).not.toContain("R$");
    expect(el.querySelector("#orcamento a")?.getAttribute("href")).toContain("utm_content=resumo");
  });

  it("com a simulação guardada, mostra o bairro, a conta e a reforma e termina no orçamento com o bairro", async () => {
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Pinheiros", imovel: { ...PREMISSAS_SIMULADOR_PADRAO.imovel, valorImovel: 400000 } }));
    const el = await montar();
    expect(el.querySelector("#bairro h2")?.textContent).toBe("Pinheiros");
    // Receita de referência do bairro: 299 × 30 × 63% (base aprovada).
    expect(el.querySelector("#bairro")?.textContent).toContain(formatBRL(5651));
    const conta = el.querySelector("#conta")?.textContent ?? "";
    expect(conta).toContain("Resultado líquido");
    expect(conta).toContain("Prazo estimado de retorno");
    expect(conta).not.toMatch(/payback|yield|ROI/i);
    expect(el.querySelector("#reforma")?.textContent).toContain("Estimativa, não orçamento");
    expect(el.querySelector("#reforma")?.textContent).toContain("sem ITBI");
    // "Ajustar a conta" não leva ?bairro=, para não apagar a diária e a ocupação ajustadas.
    expect(el.querySelector('#conta a[href^="/projecao"]')?.getAttribute("href")).toBe("/projecao");
    const cta = el.querySelector("#orcamento a")!;
    expect(cta.textContent).toContain("Peça seu orçamento");
    expect(cta.getAttribute("href")).toContain("bairro=Pinheiros");
    // O texto da tela diz o que o link de orçamento leva; nenhum valor da simulação vai na URL.
    expect(el.textContent).toContain("leva apenas o bairro e a faixa de área");
    expect(el.textContent).not.toContain("nada é enviado");
    expect([...new URL(cta.getAttribute("href")!).searchParams.keys()].sort()).toEqual(["area", "bairro", "utm_campaign", "utm_content", "utm_medium", "utm_source"]);
  });

  it("sem valor do imóvel, pede o valor em vez de mostrar rentabilidade", async () => {
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Pinheiros" }));
    const el = await montar();
    expect(el.querySelector("#conta")?.textContent).toContain("Informe o valor do imóvel no passo 2");
  });
});
