import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { URL_BAIRRO_GF, URL_CIDADE_GF, lerPaginaGuestFavorites, lerPeriodo, slugGuestFavorites, textoDaPagina } from "@/lib/guestfavoritesParser";

const html = readFileSync("src/test/fixtures/guestfavorites-santana.html", "utf8");

describe("leitura da página da GuestFavorites", () => {
  it("lê diária, ocupação, quartis, anúncios, período e atualização como a página mostra (Santana, 18/10/2026)", () => {
    expect(lerPaginaGuestFavorites(html)).toEqual({
      ocupacaoPct: 62, adrBrl: 229, quartis: [164, 207, 257], anuncios: 510,
      periodoInicio: "2026-01-01", periodoFim: "2026-09-30", atualizadoEm: "2026-10-08",
    });
  });

  it("não confunde o texto do script com os números da página", () => {
    expect(textoDaPagina(html)).not.toContain('"adr":70');
  });

  it("sem a tabela de faixas, devolve quartis null; sem diária ou período, devolve null", () => {
    const semTiers = html.replace(/Airbnb Pricing Tiers in Santana/g, "Tabela removida");
    expect(lerPaginaGuestFavorites(semTiers)?.quartis).toBeNull();
    expect(lerPaginaGuestFavorites(html.replace("Average Daily Rate (ADR)", "x"))).toBeNull();
    expect(lerPaginaGuestFavorites(html.replace("Period:", "x"))).toBeNull();
    expect(lerPaginaGuestFavorites("<html><body>Not found</body></html>")).toBeNull();
  });

  it("quartis fora de ordem são descartados (página inconsistente), sem inventar valores", () => {
    const trocado = html.replace("R$164</span>", "R$999</span>");
    expect(lerPaginaGuestFavorites(trocado)?.quartis).toBeNull();
  });

  it("período em inglês vira datas AAAA-MM-DD com o último dia do mês", () => {
    expect(lerPeriodo("Period: January 2026 - July 2026")).toEqual({ inicio: "2026-01-01", fim: "2026-07-31" });
    expect(lerPeriodo("Period: December 2025 - February 2026")).toEqual({ inicio: "2025-12-01", fim: "2026-02-28" });
    expect(lerPeriodo("sem período")).toBeNull();
  });

  it("slug e URL seguem o padrão das páginas (sem acento, hífens)", () => {
    expect(slugGuestFavorites("Santa Cecília")).toBe("santa-cecilia");
    expect(slugGuestFavorites("Sé")).toBe("se");
    expect(URL_BAIRRO_GF("Jardim Paulista")).toBe("https://www.guestfavorites.com/airbnb-occupancy-rates-in-jardim-paulista-sao-paulo-brazil");
    expect(URL_CIDADE_GF).toContain("sao-paulo-brasil");
  });

  it("a Edge Function usa uma cópia idêntica do parser", () => {
    expect(readFileSync("supabase/functions/coletar-guestfavorites/parser.ts", "utf8")).toBe(readFileSync("src/lib/guestfavoritesParser.ts", "utf8"));
  });
});
