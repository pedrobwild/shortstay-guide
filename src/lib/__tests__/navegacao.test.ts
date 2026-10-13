import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LINKS_PUBLICOS, linkSimuladorBairro } from "@/data/navegacao";
import { orcamentoUrl } from "@/lib/orcamento";

const rotasApp = readFileSync("src/App.tsx", "utf8");

describe("navegação pública", () => {
  it("todo link da navbar aponta para uma rota existente em App.tsx", () => {
    for (const link of LINKS_PUBLICOS) {
      const caminho = link.to.split("#")[0] || "/";
      expect(rotasApp, `rota ${caminho} (${link.label})`).toContain(`path="${caminho}"`);
    }
  });

  it("o atalho Simular aponta para o simulador da home", () => {
    expect(LINKS_PUBLICOS.find((l) => l.id === "simular")?.to).toBe("/#simulador");
  });

  it("monta o link do simulador com o bairro pré-selecionado", () => {
    expect(linkSimuladorBairro("vila-mariana")).toBe("/?bairro=vila-mariana#simulador");
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
