import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { readFileSync } from "fs";
import { resolve } from "path";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

import ReformaNoSite from "@/components/ReformaNoSite";
import RodapeRadar from "@/components/RodapeRadar";
import Index from "@/pages/Index";
import { ConteudoTema } from "@/pages/GuiaTema";
import { ConteudoPerfil } from "@/pages/PerfilDestino";
import { EmpreendimentoEstatico } from "@/components/empreendimentos/EmpreendimentosEstatico";
import { INDICE_CUSTO, LINKS_REFORMA_SITE } from "@/data/artigosBewild";
import { linksDeRetornoAusentes } from "@/lib/linksRetorno";
import { bairrosReserva } from "@/lib/radarBase";
import type { Empreendimento } from "@/lib/empreendimentos";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class IOStub { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver ??= IOStub;
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= IOStub;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function montar(rota: string, tela: ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <HelmetProvider>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter initialEntries={[rota]}>{tela}</MemoryRouter>
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

const linksPara = (el: Element, url: string) => [...el.querySelectorAll<HTMLAnchorElement>(`a[href="${url}"]`)];
const INDICE = INDICE_CUSTO.url;

describe("bloco “Reforma no site da Bewild”", () => {
  const html = renderToStaticMarkup(<ReformaNoSite />);

  it("traz o índice de custo e as 16 páginas de bairro do site", () => {
    expect(linksDeRetornoAusentes(html)).toEqual([]);
    expect(html.match(/<a /g)).toHaveLength(LINKS_REFORMA_SITE.length);
    for (const l of LINKS_REFORMA_SITE) expect(html).toContain(`>${l.titulo}</a>`);
  });

  it("são links normais: sem nofollow, sem noreferrer, sem nova aba e sem UTM", () => {
    expect(html).not.toMatch(/nofollow|noreferrer|target=|utm_/);
  });

  it("é uma navegação com nome próprio (leitor de tela não confunde com o menu)", () => {
    expect(html).toMatch(/<nav aria-label="Reforma no site da Bewild"/);
  });
});

describe("rodapé das telas públicas", () => {
  it("carrega o bloco de retorno, então toda tela com rodapé linka o índice e os bairros", async () => {
    const el = await montar("/mercado", <RodapeRadar />);
    expect(linksDeRetornoAusentes(el.innerHTML)).toEqual([]);
  });

  it("“Um produto Bewild” passa a origem para o site (sem noreferrer)", async () => {
    const el = await montar("/mercado", <RodapeRadar />);
    const [home] = linksPara(el, "https://bewild.com.br");
    expect(home).toBeTruthy();
    expect(home.rel).not.toContain("noreferrer");
    expect(home.rel).not.toContain("nofollow");
  });

  it("todas as telas públicas montam o rodapé", () => {
    const TELAS = [
      "Index", "IntelligenceDashboard", "Posts", "Empreendimentos", "EmpreendimentoDetalhe", "Imoveis", "IntelligenceRanking",
      "IntelligenceBairroDetail", "IntelligenceListings", "MapaBairros", "CompararBairros", "GuiaTema", "Metodologia", "Ferramentas",
      "PerfilDestino", "StudioProjection", "NotFound",
    ];
    for (const tela of TELAS) {
      const fonte = readFileSync(resolve(__dirname, `../pages/${tela}.tsx`), "utf8");
      expect(/<(RodapeRadar|PaginaEstudo)\b/.test(fonte), tela).toBe(true);
    }
  });
});

describe("índice de custo onde o Radar fala de custo de reforma", () => {
  it("home, no bloco Reforma", async () => {
    const el = await montar("/", <Index />);
    expect(linksPara(el.querySelector("#reforma")!, INDICE)).toHaveLength(1);
  });

  it("/guia/reforma, no corpo do tema", async () => {
    const el = await montar("/guia/reforma", <ConteudoTema slug="reforma" />);
    expect(linksPara(el.querySelector("main")!, INDICE)).toHaveLength(1);
  });

  it("/guia/checklist, no corpo do tema", async () => {
    const el = await montar("/guia/checklist", <ConteudoTema slug="checklist" />);
    expect(linksPara(el.querySelector("main")!, INDICE)).toHaveLength(1);
  });

  it("/reformar, junto da fonte da faixa de custo", async () => {
    const el = await montar("/reformar", <ConteudoPerfil etapa="reformar" bairros={bairrosReserva()} />);
    // ConteudoPerfil traz a tela inteira (com o rodapé): o link de contexto é o do <main>.
    expect(linksPara(el.querySelector("main")!, INDICE)).toHaveLength(1);
    expect(el.querySelector("main")!.textContent).toContain(INDICE_CUSTO.titulo);
  });
});

describe("página de prédio → reforma no bairro do prédio", () => {
  const predio: Empreendimento = {
    id: "1", slug: "studio-gama", nome: "Studio Gama", bairro: "Higienópolis", endereco: null, incorporadora: null,
    tipologias: null, situacao: "pronto", entrega: null, resumo: null, diferenciais: [],
    fonte_url: null, fonte_titulo: null, fonte_consultada_em: null, foto_url: null,
    foto_alt: null, foto_credito: null, selo_bewild: false, status: "publicado",
  };

  it("bairro com página no site (mesmo fora da base do Radar) ganha o link", () => {
    const html = renderToStaticMarkup(<EmpreendimentoEstatico e={predio} naBase={null} />);
    expect(html).toContain('<a href="https://bewild.com.br/reforma/higienopolis">Reforma em Higienópolis</a>');
  });

  it("bairro sem página no site não ganha link de reforma por bairro", () => {
    const html = renderToStaticMarkup(<EmpreendimentoEstatico e={{ ...predio, bairro: "Tatuapé" }} naBase={null} />);
    expect(html).not.toContain("bewild.com.br/reforma");
  });
});
