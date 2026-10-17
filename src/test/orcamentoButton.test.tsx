import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OrcamentoButton from "@/components/OrcamentoButton";
import { CONSENT_KEY } from "@/lib/marketingConsent";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let container: HTMLDivElement | null = null;

const contexto = { bairro: "Pinheiros", area: "26–35 m²", valorImovel: 650000, resultadoLiquido: 36408 };

async function abrirDialogo(consentimento: "accepted" | "refused" | null) {
  if (consentimento) localStorage.setItem(CONSENT_KEY, consentimento); else localStorage.removeItem(CONSENT_KEY);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root!.render(<OrcamentoButton local="projecao" rotulo="Orçar reforma" contexto={contexto} />); });
  await act(async () => { container!.querySelector("button")!.click(); });
  const link = [...document.body.querySelectorAll<HTMLAnchorElement>("a")].find((a) => a.textContent?.includes("Continuar para o orçamento"));
  return { url: new URL(link!.href), texto: document.body.textContent ?? "" };
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  localStorage.removeItem(CONSENT_KEY);
});

describe("orçamento com o contexto da simulação", () => {
  it("com a medição aceita, os dados da simulação vão no link do pedido", async () => {
    const { url, texto } = await abrirDialogo("accepted");
    expect(url.searchParams.get("utm_content")).toBe("projecao");
    expect(url.searchParams.get("bairro")).toBe("pinheiros");
    expect(url.searchParams.get("valor_imovel")).toBe("650000");
    expect(texto).toContain("vão no link do pedido");
  });

  it.each(["refused", null] as const)("sem aceite (%s), o link leva só o UTM", async (escolha) => {
    const { url, texto } = await abrirDialogo(escolha);
    expect(url.searchParams.get("utm_content")).toBe("projecao");
    for (const k of ["bairro", "area", "valor_imovel", "resultado_12m"]) expect(url.searchParams.has(k)).toBe(false);
    expect(texto).toContain("Os dados só vão no link do pedido quando você aceita os cookies de medição.");
    expect(texto).toContain("R$ 650.000"); // o resumo continua visível para a pessoa informar no pedido
  });
});
