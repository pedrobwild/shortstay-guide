import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATALHOS_CELULAR, GRUPOS_MENU, linkAtivo, LINKS_PUBLICOS, linkProjecaoBairro, linkSimuladorBairro, VISOES_BAIRROS } from "@/data/navegacao";
import { orcamentoUrl } from "@/lib/orcamento";

const rotasApp = readFileSync("src/App.tsx", "utf8");

describe("navegação pública", () => {
  it("todo link da navbar aponta para uma rota existente em App.tsx", () => {
    for (const link of LINKS_PUBLICOS) {
      const caminho = link.to.split("#")[0] || "/";
      expect(rotasApp, `rota ${caminho} (${link.label})`).toContain(`path="${caminho}"`);
    }
  });

  it("a barra tem as quatro tarefas (auditoria de UX, 15/11/2026) e Conteúdos (18/11/2026)", () => {
    expect(LINKS_PUBLICOS.map((l) => l.label)).toEqual(["Bairros", "Simular", "Reforma", "Guia", "Conteúdos"]);
  });

  it("em /conteudos só o item Conteúdos fica ativo, inclusive nas listas e nos artigos", () => {
    for (const rota of ["/conteudos", "/conteudos/artigos", "/conteudos/algum-artigo"]) {
      expect(LINKS_PUBLICOS.filter((l) => linkAtivo(l, rota)).map((l) => l.label), rota).toEqual(["Conteúdos"]);
    }
    const guia = LINKS_PUBLICOS.find((l) => l.id === "guia_temas")!;
    expect(linkAtivo(guia, "/guia/reforma")).toBe(true);
    expect(linkAtivo(guia, "/metodologia")).toBe(true);
  });

  it("todo link do menu lateral e das visões de bairro aponta para uma rota existente", () => {
    for (const link of [...GRUPOS_MENU.flatMap((g) => g.links), ...VISOES_BAIRROS]) {
      const caminho = link.to.split("#")[0] || "/";
      expect(rotasApp, `rota ${caminho} (${link.label})`).toContain(`path="${caminho}"`);
    }
  });

  it("nenhum menu leva a /imoveis enquanto não há imóvel publicado; a rota continua", () => {
    const todos = [...LINKS_PUBLICOS, ...GRUPOS_MENU.flatMap((g) => g.links), ...VISOES_BAIRROS];
    expect(todos.some((l) => l.to.startsWith("/imoveis"))).toBe(false);
    expect(rotasApp).toContain('path="/imoveis"');
  });

  it("toda tela pública que estava na barra antiga continua alcançável pelo menu", () => {
    const destinos = new Set([...LINKS_PUBLICOS, ...GRUPOS_MENU.flatMap((g) => g.links)].map((l) => l.to.split("#")[0]));
    for (const rota of ["/mercado", "/mapa", "/ranking", "/comparar", "/projecao", "/ferramentas", "/empreendimentos", "/conteudos"]) {
      expect(destinos.has(rota), rota).toBe(true);
    }
  });

  it("Bairros fica ativo na lista, no mapa, no comparador e na página de bairro", () => {
    const bairros = LINKS_PUBLICOS.find((l) => l.id === "bairros")!;
    for (const rota of ["/ranking", "/mapa", "/comparar", "/mercado", "/bairro/pinheiros"]) expect(linkAtivo(bairros, rota), rota).toBe(true);
    expect(linkAtivo(bairros, "/projecao")).toBe(false);
    expect(linkAtivo(bairros, "/")).toBe(false);
  });

  it("as visões de bairro são Lista, Mapa e Comparar, e só a da rota fica ativa", () => {
    expect(VISOES_BAIRROS.map((v) => v.to)).toEqual(["/ranking", "/mapa", "/comparar"]);
    expect(VISOES_BAIRROS.filter((v) => linkAtivo(v, "/mapa")).map((v) => v.label)).toEqual(["Mapa"]);
  });

  it("o atalho Simular aponta para a projeção do studio (fluxo explorar → comparar → simular)", () => {
    expect(LINKS_PUBLICOS.find((l) => l.id === "simular")?.to).toBe("/projecao");
  });

  it("os atalhos do celular existem entre os links públicos", () => {
    for (const id of ATALHOS_CELULAR) expect(LINKS_PUBLICOS.some((l) => l.id === id), id).toBe(true);
  });

  it("monta o link do simulador (/projecao) com o bairro pré-selecionado", () => {
    expect(linkSimuladorBairro("vila-mariana")).toBe("/projecao?bairro=vila-mariana");
  });

  it("monta o link da projeção com o bairro pré-selecionado", () => {
    expect(linkProjecaoBairro("vila-mariana")).toBe("/projecao?bairro=vila-mariana");
  });

  it("os novos locais de orçamento usam a mesma URL com UTM próprio", () => {
    for (const local of ["navbar", "bairro"] as const) {
      const url = new URL(orcamentoUrl(local));
      expect(url.origin + url.pathname).toBe("https://bewild.com.br/orcamento");
      expect(url.searchParams.get("utm_content")).toBe(local);
      expect(url.searchParams.get("utm_campaign")).toBe("radar_bewild");
    }
  });
});
