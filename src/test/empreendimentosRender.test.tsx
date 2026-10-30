import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import type { Empreendimento } from "@/lib/empreendimentos";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

const LISTA: Empreendimento[] = [
  {
    id: "1", slug: "edificio-alfa-pinheiros", nome: "Edifício Alfa Pinheiros", bairro: "Pinheiros", endereco: "Rua Exemplo, 100",
    incorporadora: "Incorporadora A", tipologias: "studios de 24 a 35 m²", situacao: "pronto", entrega: null,
    resumo: "Prédio de studios perto do metrô.", diferenciais: ["Coworking", "Lavanderia compartilhada", "Academia", "Piscina na cobertura"],
    fonte_url: "https://exemplo.com.br/alfa", fonte_titulo: "Página oficial — Incorporadora A", fonte_consultada_em: "2026-10-30",
    foto_url: null, foto_alt: null, foto_credito: null, selo_bewild: true, status: "publicado",
  },
  {
    id: "2", slug: "residencial-beta", nome: "Residencial Beta", bairro: "Vila Nova Conceição", endereco: null,
    incorporadora: "Incorporadora B", tipologias: null, situacao: "em_obras", entrega: "dez/2026", resumo: "", diferenciais: ["Rooftop"],
    fonte_url: null, fonte_titulo: null, fonte_consultada_em: null, foto_url: null, foto_alt: null, foto_credito: null,
    selo_bewild: true, status: "publicado",
  },
  {
    id: "3", slug: "studio-gama-brooklin", nome: "Studio Gama Brooklin", bairro: "Brooklin", endereco: "Rua Exemplo, 200",
    incorporadora: null, tipologias: null, situacao: "pronto", entrega: null, resumo: "", diferenciais: ["Coworking"],
    fonte_url: "https://exemplo.com.br/gama", fonte_titulo: "Portal imobiliário", fonte_consultada_em: "2026-10-30",
    foto_url: null, foto_alt: null, foto_credito: null, selo_bewild: true, status: "publicado",
  },
];

vi.mock("@/lib/empreendimentos", async (original) => {
  const real = await original<typeof import("@/lib/empreendimentos")>();
  return {
    ...real,
    listarEmpreendimentosPublicos: vi.fn(async () => LISTA),
    buscarEmpreendimento: vi.fn(async (slug: string) => LISTA.find((e) => e.slug === slug) ?? null),
  };
});

import Empreendimentos from "@/pages/Empreendimentos";
import EmpreendimentoDetalhe from "@/pages/EmpreendimentoDetalhe";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class IOStub { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver ??= IOStub;
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= IOStub;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar(ui: React.ReactNode, rota: string, caminho: string) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <HelmetProvider>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter initialEntries={[rota]}>
            <Routes><Route path={caminho} element={ui} /></Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("/empreendimentos", () => {
  it("lista em ordem alfabética, com selo, até 3 diferenciais e o aviso de que não é recomendação", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos", "/empreendimentos");
    expect(el.querySelector("h1")?.textContent).toBe("Empreendimentos em destaque");
    const cards = [...el.querySelectorAll("ul > li button")];
    expect(cards.map((c) => c.querySelector(".e-h3")?.textContent)).toEqual(["Edifício Alfa Pinheiros", "Residencial Beta", "Studio Gama Brooklin"]);
    expect(el.textContent).toContain("A Bewild já atua neste prédio");
    expect(el.textContent).toContain("Coworking · Lavanderia compartilhada · Academia");
    expect(el.textContent).toContain("+1");
    expect(el.textContent).toContain("Não é recomendação de compra");
    expect(el.textContent).toContain("3 empreendimentos em 3 bairros");
  });

  it("card: botão com nome curto para leitor de tela e só elementos de linha dentro (HTML válido)", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos", "/empreendimentos");
    const card = el.querySelector("ul > li button") as HTMLButtonElement;
    expect(card.getAttribute("aria-label")).toBe("Edifício Alfa Pinheiros, Pinheiros. A Bewild já atua neste prédio. Ver resumo");
    expect(card.querySelector("div, figure, figcaption, p, section")).toBeNull();
  });

  it("filtra pelo bairro da URL", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos?bairro=vila-nova-conceicao", "/empreendimentos");
    const cards = [...el.querySelectorAll("ul > li button")];
    expect(cards).toHaveLength(1);
    expect(el.textContent).toContain("Vila Nova Conceição: 1 de 3 empreendimentos");
  });

  it("o card abre o resumo com o bairro no Radar e o link da página completa", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos", "/empreendimentos");
    const card = el.querySelector("ul > li button") as HTMLButtonElement;
    await act(async () => { card.click(); });
    const dialogo = document.body.querySelector("[role=dialog]");
    expect(dialogo?.textContent).toContain("Edifício Alfa Pinheiros");
    expect(dialogo?.textContent).toContain("Receita de referência");
    expect(dialogo?.textContent).toContain("não são garantia de resultado");
    expect(dialogo?.textContent).toContain("Conforme Página oficial — Incorporadora A, consultada em 30/10/2026.");
    expect(dialogo?.querySelector('a[href="/empreendimentos/edificio-alfa-pinheiros"]')?.textContent).toBe("Ver página completa");
  });

  it("sem fonte, o resumo não diz \"conforme\" (nada de fonte inventada)", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos", "/empreendimentos");
    const card = el.querySelectorAll("ul > li button")[1] as HTMLButtonElement;
    await act(async () => { card.click(); });
    const dialogo = document.body.querySelector("[role=dialog]");
    expect(dialogo?.textContent).toContain("Rooftop");
    expect(dialogo?.textContent).not.toContain("Conforme");
  });

  it("ao fechar o resumo, o foco volta ao card que o abriu", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos", "/empreendimentos");
    const card = el.querySelectorAll("ul > li button")[2] as HTMLButtonElement;
    card.focus();
    await act(async () => { card.click(); });
    const dialogo = document.body.querySelector("[role=dialog]") as HTMLElement;
    await act(async () => { dialogo.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(document.body.querySelector("[role=dialog]")).toBeNull();
    expect(document.activeElement).toBe(card);
  });
});

describe("/empreendimentos/:slug", () => {
  it("mostra ficha, diferenciais com fonte e os números do bairro na base", async () => {
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/edificio-alfa-pinheiros", "/empreendimentos/:slug");
    expect(el.querySelector("h1")?.textContent).toBe("Edifício Alfa Pinheiros");
    expect(el.textContent).toContain("Página oficial — Incorporadora A, consultada em 30/10/2026");
    expect(el.textContent).toContain("Pinheiros: os números do bairro para short stay");
    expect(el.textContent).toContain("Média dos anúncios do bairro no Airbnb, não deste prédio.");
    expect(el.querySelector('a[href="/bairro/pinheiros"]')).not.toBeNull();
    expect(el.textContent).not.toContain("Foto em breve");
  });

  it("Brooklin: números como aproximação pelo Itaim Bibi, nunca como dado do próprio bairro", async () => {
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/studio-gama-brooklin", "/empreendimentos/:slug");
    expect(el.textContent).toContain("Brooklin: aproximação pelo Itaim Bibi");
    expect(el.textContent).toContain("Média dos anúncios do distrito Itaim Bibi no Airbnb (aproximação), não deste prédio.");
    expect(el.textContent).not.toContain("Média dos anúncios do bairro");
    expect(el.textContent).not.toMatch(/tracejad/);
  });

  it("bairro fora da base: diz que não há dado, sem usar bairro vizinho", async () => {
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/residencial-beta", "/empreendimentos/:slug");
    expect(el.textContent).toContain("Vila Nova Conceição ainda não está entre os bairros da base do Radar");
    expect(el.textContent).toContain("Em obras · entrega dez/2026");
    expect(el.textContent).not.toContain("Receita de referência (R$/mês)");
    expect(el.textContent).not.toContain("Conforme");
    expect(el.textContent).toContain("Outros empreendimentos deste bairro");
  });

  it("carregando: não mexe no head (sem noindex até saber que o prédio não existe)", async () => {
    const { buscarEmpreendimento } = await import("@/lib/empreendimentos");
    vi.mocked(buscarEmpreendimento).mockImplementationOnce(() => new Promise(() => {}));
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/edificio-alfa-pinheiros", "/empreendimentos/:slug");
    expect(el.textContent).toContain("Carregando o empreendimento");
    expect(document.head.querySelector('meta[name="robots"][content*="noindex"]')).toBeNull();
  });

  it("slug inexistente: página de não encontrado com caminho de volta", async () => {
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/nao-existe", "/empreendimentos/:slug");
    expect(el.textContent).toContain("Este empreendimento não está no catálogo");
    expect(el.querySelector('a[href="/empreendimentos"]')).not.toBeNull();
  });
});
