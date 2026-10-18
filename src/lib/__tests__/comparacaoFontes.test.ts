import { describe, expect, it } from "vitest";
import { agregarAirDNA, compararIndicadores } from "../../../supabase/functions/_shared/comparacaoMetricas";

// Séries fictícias locais; não gravar na base de mercado.
const occ = [{ date: "2026-01-01", days_booked: 10, days_available: 20 }, { date: "2026-02-01", days_booked: 30, days_available: 40 }];
const adr = [{ date: "2026-01-01", adr: 100 }, { date: "2026-02-01", adr: 200 }];
const anuncios = [{ date: "2026-01-01", listing_count: 10 }, { date: "2026-02-01", listing_count: 20 }];
describe("comparação de fontes sem alterar base aprovada", () => {
  it("pondera diária pelas noites e calcula ocupação com o denominador correto", () => {
    const r = agregarAirDNA(occ, adr, anuncios, "2026-01-01", "2026-02-28");
    expect(r.indicadores.adr_medio_brl).toBe(175);
    expect(r.indicadores.ocupacao_media_pct).toBeCloseTo(66.6666667);
    expect(r.amostra_n).toBe(15);
  });
  it("não estima ocupação quando só há taxas ou calendário", () => {
    expect(() => agregarAirDNA([{ date: "2026-01-01" }], adr, anuncios, "2026-01-01", "2026-01-31")).toThrow(/Não será estimada/);
  });
  it("recusa meses faltantes e duplicados", () => {
    expect(() => agregarAirDNA(occ.slice(0, 1), adr, anuncios, "2026-01-01", "2026-02-28")).toThrow();
    expect(() => agregarAirDNA([...occ, occ[0]], adr, anuncios, "2026-01-01", "2026-02-28")).toThrow(/duplicado/);
  });
  it("amostra ausente não vira zero", () => {
    expect(agregarAirDNA(occ, adr, [], "2026-01-01", "2026-02-28").amostra_n).toBeNull();
  });
  it("não compara percentuais entre períodos distintos", () => {
    expect(compararIndicadores({ adr_medio_brl: 175, ocupacao_media_pct: 60 }, { adr_medio_brl: 100, ocupacao_media_pct: 50, periodo_inicio: "2026-01-01", periodo_fim: "2026-01-31" }, "2026-01-01", "2026-02-28").diferencas).toBeNull();
  });
  it("expressa diferença de ocupação em pontos percentuais", () => {
    expect(compararIndicadores({ adr_medio_brl: 175, ocupacao_media_pct: 60 }, { adr_medio_brl: 100, ocupacao_media_pct: 50, periodo_inicio: "2026-01-01", periodo_fim: "2026-02-28" }, "2026-01-01", "2026-02-28").diferencas).toEqual({ diaria_brl: 75, ocupacao_pp: 10 });
  });
});