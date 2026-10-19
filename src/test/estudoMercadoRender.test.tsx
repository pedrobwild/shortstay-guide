import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

import EstimativaBairro from "@/components/intelligence/EstimativaBairro";
import IntelligenceBairroDetail from "@/pages/IntelligenceBairroDetail";
import IntelligenceDashboard from "@/pages/IntelligenceDashboard";
import type { BairroAirbnb } from "@/types/intelligence";

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
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("/mercado e /bairro no Estudo aberto (base de reserva)", () => {
  it("/mercado: título-achado calculado, 28 pontos clicáveis com rótulo e a jornada guiada atrás de um botão", async () => {
    const el = await montar(<IntelligenceDashboard />, "/mercado", "/mercado");
    expect(el.querySelector("h1")?.textContent).toContain("16 de 28");
    expect(el.querySelector("h1")?.textContent).toContain("R$ 3.500 e R$ 4.500");
    const pontos = [...el.querySelectorAll("#distribuicao figure a[aria-label]")];
    expect(pontos).toHaveLength(28);
    expect(pontos.map((a) => a.getAttribute("aria-label"))).toContain("Morumbi: R$ 8.294 por mês");
    expect(el.textContent).toContain("19 de 28 bairros ficam abaixo");
    expect(el.textContent).toContain("Estimativa de mercado — base 2025");
    expect([...el.querySelectorAll("button")].some((b) => b.textContent === "Começar a jornada")).toBe(true);
    expect(el.textContent).toContain("não são garantia de resultado");
  });

  it("/bairro/pinheiros: posição, Fig. 1 com dois eixos e Tab. 1 até R$ 2.164 com as linhas como hipótese", async () => {
    const el = await montar(<IntelligenceBairroDetail />, "/bairro/pinheiros", "/bairro/:bairro");
    expect(el.querySelector("h1")?.textContent).toBe("Pinheiros");
    expect(el.textContent).toContain("18% acima de São Paulo");
    expect(el.querySelectorAll("#posicao figure a[aria-label]")).toHaveLength(56);
    expect(el.querySelector('#posicao a[aria-current="page"]')?.getAttribute("aria-label")).toContain("Pinheiros: R$ 299");
    const conta = el.querySelector("#conta")!;
    expect(conta.textContent).toContain("R$ 2.164");
    expect(conta.querySelectorAll(".e-tag-hipotese").length).toBeGreaterThanOrEqual(6);
    expect(el.querySelector('a[href="/projecao?bairro=pinheiros"]')).not.toBeNull();
    expect(el.querySelector('a[href="/comparar?b=pinheiros"]')).not.toBeNull();
  });

  it("/bairro/brooklin: aproximação identificada e referência extra fora das contas", async () => {
    const el = await montar(<IntelligenceBairroDetail />, "/bairro/brooklin", "/bairro/:bairro");
    expect(el.querySelector(".e-tag-aproximacao")?.textContent).toBe("Aproximação");
    expect(el.textContent).toContain("Referência extra, fora das contas");
    expect(el.textContent).toContain("sem contagem por bairro");
  });

  it("/bairro/mooca: aviso de amostra pequena", async () => {
    const el = await montar(<IntelligenceBairroDetail />, "/bairro/mooca", "/bairro/:bairro");
    expect(el.querySelector(".e-amostra")?.textContent).toMatch(/amostra pequena \(90 anúncios\)/i);
  });

  it("critérios internos da estimativa base 2025 montam sem erro", async () => {
    const b = {
      bairro: "Pinheiros", cidade: "São Paulo", periodo_inicio: "2025-01-01", periodo_fim: "2025-12-31", id: 1,
      n_listings_total: 1000, n_listings_studio_1q: 600, pct_studio_1q: 0.6, adr_medio_studio: 299, ocupacao_media_studio: 0.63,
      receita_anual_media_studio: 67812, estadia_media_noites: 3.2, porcentagem_reservas_30d_plus: 0.1, rating_medio: 4.8,
      percentual_superhost: 0.4, media_reviews_por_listing: 40, pct_politica_flexivel: 0.3, pct_politica_moderada: 0.4,
      pct_politica_rigida: 0.3, preco_m2_residencial_medio: 14000, aluguel_mensal_long_term_medio: 3000, dias_medio_venda_imovel: 120,
      numero_transacoes_imobiliarias_ano: 900, indice_criminalidade: 0.3, grau_saturacao_index: 0.5, risco_regulatorio: 0.2,
      risco_condominio: 0.3, area_media_estudio: 30, yield_bruto_airbnb: 0.16, yield_bruto_long_term: 0.086, delta_yield: 0.074,
      score_rentabilidade: 70, score_liquidez: 80, score_crescimento_potencial: 60, nivel_confianca_dados: "alto",
      fonte_primaria: "teste", data_atualizacao: "2025-12-31",
    } as BairroAirbnb;
    const el = await montar(<EstimativaBairro b={b} todos={[b, { ...b, bairro: "Moema", yield_bruto_airbnb: 0.1, score_liquidez: 50 }]} />, "/", "/");
    expect(el.textContent).toContain("Pilares do score");
    expect(el.textContent).toContain("Sazonalidade ilustrativa: modelo, não dado observado");
    expect(el.textContent).toContain("Tab. 2");
  });
});
