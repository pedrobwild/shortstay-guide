import { describe, expect, it } from "vitest";
import { planejarGuestFavorites } from "@/lib/planejamentoGuestFavorites";
import type { ObservacaoGuestFavorites } from "@/lib/resumoColetasGuestFavorites";
const linha = (indicador: string, ativo = true): ObservacaoGuestFavorites => ({ id: indicador, bairro: "Pinheiros", indicador, ativo, coletado_em: "2026-10-18", periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", fonte_id: "guestfavorites", url_origem: null, radar_fontes: null });
describe("planejamento GuestFavorites", () => {
  it("lista sem coleta direta e exclui cobertura completa ativa", () => {
    const r = planejarGuestFavorites([linha("adr_medio_brl"), linha("ocupacao_media_pct")], ["Pinheiros", "Brooklin"], "2026-10-18");
    expect(r.map((b) => b.bairro)).toEqual(["Brooklin"]);
    expect(r[0].status).toBe("sem_coleta");
  });
  it("inclui coletas incompletas e inativas", () => {
    expect(planejarGuestFavorites([linha("adr_medio_brl")], ["Pinheiros"], "2026-10-18")).toHaveLength(1);
    expect(planejarGuestFavorites([linha("adr_medio_brl", false), linha("ocupacao_media_pct", false)], ["Pinheiros"], "2026-10-18")).toHaveLength(1);
  });
  it("sugere meses encerrados, inclusive na virada do ano", () => {
    expect(planejarGuestFavorites([], ["Brooklin"], "2026-10-18")[0]).toMatchObject({ periodoInicio: "2026-01-01", periodoFim: "2026-09-30" });
    expect(planejarGuestFavorites([], ["Brooklin"], "2027-01-03")[0]).toMatchObject({ periodoInicio: "2026-01-01", periodoFim: "2026-12-31" });
  });
});
