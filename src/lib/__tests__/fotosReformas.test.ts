import { describe, expect, it } from "vitest";
import { FOTOS_REFORMAS, linkProjetoPortfolio, urlFotoReforma } from "@/data/fotosReformas";

describe("fotos de reformas entregues (portfólio do site)", () => {
  it("são três, de projetos diferentes, com prédio, bairro, área e texto alternativo", () => {
    expect(FOTOS_REFORMAS).toHaveLength(3);
    expect(new Set(FOTOS_REFORMAS.map((f) => f.slug)).size).toBe(3);
    for (const f of FOTOS_REFORMAS) {
      expect(f.predio.length).toBeGreaterThan(2);
      expect(f.bairro.length).toBeGreaterThan(2);
      expect(f.areaM2).toBeGreaterThan(15);
      expect(f.areaM2).toBeLessThan(60);
      expect(f.alt).toMatch(/^Foto de studio reformado/);
    }
  });

  it("nunca usam render 3D nem arquivo com nome de pessoa: só a foto principal do projeto", () => {
    for (const f of FOTOS_REFORMAS) {
      expect(f.caminho.startsWith(`${f.slug}/`), f.caminho).toBe(true);
      expect(f.caminho).not.toMatch(/executivo|render|3d/i);
      expect(f.alt).not.toMatch(/render|3d/i);
    }
  });

  it("a URL leva a largura pedida e o link aponta para o projeto no portfólio", () => {
    const f = FOTOS_REFORMAS[0];
    // resize=contain é obrigatório: sem ele o serviço devolve uma tira central recortada.
    expect(urlFotoReforma(f, 640)).toContain(`/project-images/bewild/${f.caminho}?width=640&quality=70&resize=contain`);
    expect(linkProjetoPortfolio(f)).toBe(`https://bewild.com.br/portfolio/${f.slug}`);
  });
});
