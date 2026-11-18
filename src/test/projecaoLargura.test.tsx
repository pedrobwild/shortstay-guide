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

describe("/projecao: um resultado só e orçamento depois do valor (auditoria de UX, 15/11/2026)", () => {
  it("não compara receita com e sem a Bewild", async () => {
    const texto = (await montar("/projecao?bairro=pinheiros")).textContent ?? "";
    for (const proibido of ["Com a Bewild", "Fazer sozinho", "operado pela Bewild", "quanto a mais o imóvel rende"]) {
      expect(texto, proibido).not.toContain(proibido);
    }
  });

  it("a barra fixa do celular leva à conta e não pede orçamento", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    const barra = [...el.querySelectorAll("div")].find((d) => d.className.includes("fixed") && d.className.includes("bottom-0"));
    expect(barra, "barra fixa").toBeTruthy();
    expect(barra!.querySelector('a[href*="bewild.com.br/orcamento"]')).toBeNull();
    expect(barra!.querySelector('a[href="#resultado"]')?.textContent).toContain("Ver a conta");
    expect(el.querySelector("#resultado"), "âncora do resultado").toBeTruthy();
  });

  it("todo botão de orçamento da página usa o rótulo oficial", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    const botoes = [...el.querySelectorAll('a[href*="bewild.com.br/orcamento"]')];
    expect(botoes.length).toBeGreaterThan(0);
    for (const b of botoes) expect(b.textContent).toContain("Peça seu orçamento");
  });
});

describe("/projecao: valor do imóvel no essencial e custos recolhidos (auditoria de UX, 15/11/2026)", () => {
  // Rótulos do bloco Premissas, na ordem da tela. Sem o combinador "~ div label": o nwsapi 2.2.23
  // (jsdom) não resolve irmão + descendente e devolvia lista vazia, embora a tela estivesse certa.
  const rotulos = (el: HTMLElement) => [...el.querySelectorAll('section[aria-labelledby="premissas-titulo"] label')].map((l) => l.textContent ?? "");

  it("o valor do imóvel vem antes da diária e dos custos fixos", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    const ordem = rotulos(el);
    const pos = (t: string) => ordem.findIndex((r) => r.includes(t));
    expect(pos("Valor do imóvel")).toBeGreaterThanOrEqual(0);
    expect(pos("Valor do imóvel")).toBeLessThan(pos("Diária média"));
    expect(pos("Valor do imóvel")).toBeLessThan(pos("Condomínio"));
  });

  it("condomínio, IPTU, contas e reforma ficam dentro de \"Ajustar custos\"", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    const custos = [...el.querySelectorAll("details")].find((d) => d.querySelector("summary")?.textContent?.includes("Ajustar custos"));
    expect(custos, "bloco Ajustar custos").toBeTruthy();
    const texto = custos!.textContent ?? "";
    for (const campo of ["Condomínio", "IPTU", "Contas", "Reforma", "ITBI"]) expect(texto, campo).toContain(campo);
    expect(texto).not.toContain("Valor do imóvel");
  });

  it("\"Usar um exemplo\" preenche o valor do estudo, rotula como hipótese e libera a rentabilidade", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    expect(el.textContent).toContain("Informe o valor do imóvel para ver a rentabilidade.");
    const botao = [...el.querySelectorAll("button")].find((b) => b.textContent?.includes("Usar um exemplo"));
    expect(botao, "botão do exemplo").toBeTruthy();
    await act(async () => { botao!.click(); });
    const texto = el.textContent ?? "";
    expect(texto).toContain("Hipótese · exemplo");
    expect(texto).toContain("ao preço médio FipeZap");
    expect(texto).not.toContain("Informe o valor do imóvel para ver a rentabilidade.");
    expect([...el.querySelectorAll("button")].some((b) => b.textContent?.includes("Usar um exemplo"))).toBe(false);
  });

  it("sem etapa escolhida, o próximo passo é o checklist, com o orçamento como link", async () => {
    const el = await montar("/projecao?bairro=pinheiros");
    const secao = el.querySelector("#proximo-passo");
    expect(secao?.textContent).toContain("Receber meu checklist");
    expect(secao?.querySelector('a[href*="bewild.com.br/orcamento"]')?.textContent).toContain("Peça seu orçamento");
  });
});
