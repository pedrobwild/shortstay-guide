import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { Secao } from "@/components/estudo/Estrutura";

vi.mock("@/hooks/useGuideAnalytics", () => ({ trackGlobal: vi.fn() }));

/**
 * Páginas curtas no celular (decisão do Pedro, 16/11/2026): os blocos secundários ficam
 * recolhidos abaixo de 1024px e abertos no desktop, sem tirar nada do HTML.
 */
describe("Secao recolhida", () => {
  const montar = () => render(
    <Secao recolhida id="historico" rotulo="Histórico" resumo="Cada coleta" titulo="Título da seção">
      <p id="dentro">Conteúdo da seção</p>
    </Secao>,
  );

  it("mantém o conteúdo no HTML, escondido só por classe no celular", () => {
    montar();
    const conteudo = document.getElementById("historico-conteudo")!;
    expect(conteudo.textContent).toContain("Conteúdo da seção");
    expect(conteudo.className).toContain("hidden");
    expect(conteudo.className).toContain("lg:block");
    expect(conteudo.className).toContain("e-recolhe");
  });

  it("abre e fecha pelo botão, com aria-expanded", () => {
    montar();
    const botao = screen.getByRole("button", { name: /Histórico/ });
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    expect(botao.className).toContain("lg:hidden");
    fireEvent.click(botao);
    expect(botao.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("historico-conteudo")!.className).not.toContain("hidden");
    fireEvent.click(botao);
    expect(botao.getAttribute("aria-expanded")).toBe("false");
  });

  it("abre quando um link da página aponta para o bloco ou para algo dentro dele", () => {
    Element.prototype.scrollIntoView = vi.fn();
    montar();
    const link = document.createElement("a");
    link.href = "#dentro";
    document.body.appendChild(link);
    fireEvent.click(link);
    expect(screen.getByRole("button", { name: /Histórico/ }).getAttribute("aria-expanded")).toBe("true");
    link.remove();
  });

  it("continua no índice Nesta página e sem recolhida não ganha botão", () => {
    montar();
    expect(document.getElementById("historico")!.dataset.indice).toBe("Histórico");
    render(<Secao id="conta" rotulo="Conta" titulo="Aberta"><p>x</p></Secao>);
    expect(screen.queryByRole("button", { name: /Conta/ })).toBeNull();
  });

  it("sem JavaScript os blocos ficam abertos (noscript do index.html)", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).toContain("<noscript><style>.e-recolhe{display:block!important}.e-recolhe-botao{display:none!important}tr.e-recolhe-linha{display:table-row!important}</style></noscript>");
  });
});
