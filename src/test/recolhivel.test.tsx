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

/**
 * Desktop (decisão do Pedro, 17/11/2026): seções recolhidas dentro de GrupoCartoes viram
 * cartões que abrem no lugar; ColunasComPainel põe o painel à direita só a partir de 1024px.
 */
describe("GrupoCartoes e ColunasComPainel", () => {
  it("dentro do grupo, o botão continua no desktop e o conteúdo abre no lugar", async () => {
    const { GrupoCartoes } = await import("@/components/estudo/Estrutura");
    render(
      <GrupoCartoes rotulo="Para aprofundar">
        <Secao recolhida id="cartao-a" rotulo="Cartão A" resumo="Resumo A" titulo="Título A"><p>Conteúdo A</p></Secao>
        <Secao recolhida id="cartao-b" rotulo="Cartão B" titulo="Título B"><p>Conteúdo B</p></Secao>
      </GrupoCartoes>,
    );
    const botao = screen.getByRole("button", { name: /Cartão A/ });
    expect(botao.className).not.toContain("lg:hidden");
    const conteudo = document.getElementById("cartao-a-conteudo")!;
    expect(conteudo.className).toContain("hidden");
    expect(conteudo.className).not.toContain("lg:block");
    expect(conteudo.textContent).toContain("Conteúdo A");
    expect(document.getElementById("cartao-a")!.className).toContain("lg:flex-1");
    fireEvent.click(botao);
    expect(conteudo.className.split(" ")).not.toContain("hidden");
    expect(document.getElementById("cartao-a")!.className).toContain("lg:basis-full");
    expect(document.getElementById("cartao-a")!.dataset.indice).toBe("Cartão A");
  });

  it("o painel lateral só aparece a partir de 1024px e tem nome acessível", async () => {
    const { ColunasComPainel } = await import("@/components/estudo/Estrutura");
    render(
      <ColunasComPainel rotuloPainel="Pinheiros em resumo" painel={<p>Painel</p>}>
        <Secao id="conta-teste" rotulo="Conta" titulo="Na coluna"><p>x</p></Secao>
      </ColunasComPainel>,
    );
    const painel = screen.getByRole("complementary", { name: "Pinheiros em resumo" });
    expect(painel.className).toContain("hidden");
    expect(painel.className).toContain("lg:block");
    expect(painel.className).toContain("lg:sticky");
  });
});
