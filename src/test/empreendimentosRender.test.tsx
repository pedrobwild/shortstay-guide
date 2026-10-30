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
    id: "1", slug: "do-it-pinheiros", nome: "Do It Pinheiros", bairro: "Pinheiros", endereco: "Rua Exemplo, 100",
    incorporadora: "Incorporadora A", tipologias: "studios de 24 a 35 m²", situacao: "pronto", entrega: null,
    resumo: "Prédio de studios perto do metrô.", diferenciais: ["Coworking", "Lavanderia compartilhada", "Academia", "Piscina na cobertura"],
    fonte_url: "https://exemplo.com.br/do-it", fonte_titulo: "Página oficial — Incorporadora A", fonte_consultada_em: "2026-10-30",
    foto_url: null, foto_alt: null, foto_credito: null, selo_bewild: true, status: "publicado",
  },
  {
    id: "2", slug: "nex-one-vila-nova", nome: "Nex One Vila Nova", bairro: "Vila Nova Conceição", endereco: null,
    incorporadora: "Incorporadora B", tipologias: null, situacao: "em_obras", entrega: "dez/2026", resumo: "", diferenciais: [],
    fonte_url: null, fonte_titulo: null, fonte_consultada_em: null, foto_url: null, foto_alt: null, foto_credito: null,
    selo_bewild: true, status: "publicado",
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
    expect(cards.map((c) => c.querySelector(".e-h3")?.textContent)).toEqual(["Do It Pinheiros", "Nex One Vila Nova"]);
    expect(el.textContent).toContain("A Bewild já atua neste prédio");
    expect(el.textContent).toContain("Coworking · Lavanderia compartilhada · Academia");
    expect(el.textContent).toContain("+1");
    expect(el.textContent).toContain("Não é recomendação de compra");
    expect(el.textContent).toContain("2 empreendimentos em 2 bairros");
  });

  it("filtra pelo bairro da URL", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos?bairro=vila-nova-conceicao", "/empreendimentos");
    const cards = [...el.querySelectorAll("ul > li button")];
    expect(cards).toHaveLength(1);
    expect(el.textContent).toContain("1 de 2 empreendimentos em Vila Nova Conceição");
  });

  it("o card abre o resumo com o bairro no Radar e o link da página completa", async () => {
    const el = await montar(<Empreendimentos />, "/empreendimentos", "/empreendimentos");
    const card = el.querySelector("ul > li button") as HTMLButtonElement;
    await act(async () => { card.click(); });
    const dialogo = document.body.querySelector("[role=dialog]");
    expect(dialogo?.textContent).toContain("Do It Pinheiros");
    expect(dialogo?.textContent).toContain("Receita de referência");
    expect(dialogo?.textContent).toContain("não são garantia de resultado");
    expect(dialogo?.querySelector('a[href="/empreendimentos/do-it-pinheiros"]')?.textContent).toBe("Ver página completa");
  });
});

describe("/empreendimentos/:slug", () => {
  it("mostra ficha, diferenciais com fonte e os números do bairro na base", async () => {
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/do-it-pinheiros", "/empreendimentos/:slug");
    expect(el.querySelector("h1")?.textContent).toBe("Do It Pinheiros");
    expect(el.textContent).toContain("Página oficial — Incorporadora A, consultada em 30/10/2026");
    expect(el.textContent).toContain("Os números de Pinheiros para short stay");
    expect(el.querySelector('a[href="/bairro/pinheiros"]')).not.toBeNull();
    expect(el.textContent).toContain("Foto em breve");
  });

  it("bairro fora da base: diz que não há dado, sem usar bairro vizinho", async () => {
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/nex-one-vila-nova", "/empreendimentos/:slug");
    expect(el.textContent).toContain("Vila Nova Conceição ainda não está na base do Radar");
    expect(el.textContent).toContain("Em obras · entrega dez/2026");
    expect(el.textContent).not.toContain("Receita de referência (R$/mês)");
  });

  it("slug inexistente: página de não encontrado com caminho de volta", async () => {
    const el = await montar(<EmpreendimentoDetalhe />, "/empreendimentos/nao-existe", "/empreendimentos/:slug");
    expect(el.textContent).toContain("Este empreendimento não está no catálogo");
    expect(el.querySelector('a[href="/empreendimentos"]')).not.toBeNull();
  });
});
