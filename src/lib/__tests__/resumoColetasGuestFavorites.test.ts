import { describe, expect, it } from "vitest";
import { resumirColetasGuestFavorites, type ObservacaoGuestFavorites } from "@/lib/resumoColetasGuestFavorites";
const linha = (o: Partial<ObservacaoGuestFavorites> = {}): ObservacaoGuestFavorites => ({ id: "1", bairro: "Mooca", indicador: "adr_medio_brl", coletado_em: "2026-10-18", periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", ativo: true, fonte_id: "guestfavorites", url_origem: null, radar_fontes: { nome: "GuestFavorites" }, ...o });
describe("cobertura do histórico GuestFavorites", () => {
  it("agrupa diária e ocupação numa coleta ativa e mantém as anteriores inativas", () => {
    const r = resumirColetasGuestFavorites([linha(), linha({ id: "2", indicador: "ocupacao_media_pct" }), linha({ id: "3", coletado_em: "2026-10-13", ativo: false }), linha({ id: "4", coletado_em: "2026-10-13", ativo: false, indicador: "ocupacao_media_pct" })], ["Mooca"]);
    expect(r.coletas).toHaveLength(2);
    expect(r.coletas.map((c) => c.ativa)).toEqual([true, false]);
    expect(r.cobertura[0].status).toBe("ativa");
  });
  it("não conta uma aproximação pelo Itaim como coleta direta do Brooklin", () => {
    const r = resumirColetasGuestFavorites([linha({ bairro: "Brooklin", fonte_id: "aproximacao_itaim_bibi" })], ["Brooklin"]);
    expect(r.coletas).toHaveLength(0);
    expect(r.cobertura[0].status).toBe("sem_coleta");
  });
  it("não declara cobertura ativa quando falta ocupação ou ela está inativa", () => {
    expect(resumirColetasGuestFavorites([linha()], ["Mooca"]).coletas[0].completa).toBe(false);
    const r = resumirColetasGuestFavorites([linha(), linha({ indicador: "ocupacao_media_pct", ativo: false })], ["Mooca"]);
    expect(r.cobertura[0].status).toBe("sem_ativa");
  });
  it("não mistura períodos distintos coletados no mesmo dia", () => {
    const r = resumirColetasGuestFavorites([linha(), linha({ periodo_fim: "2026-07-31", indicador: "ocupacao_media_pct" })], ["Mooca"]);
    expect(r.coletas).toHaveLength(2);
    expect(r.coletas.every((c) => !c.completa)).toBe(true);
  });
});