import { describe, expect, it } from "vitest";
import { coletaSchema, numeroColeta } from "@/lib/radarColetas";
const base = { bairro: "Mooca", fonte_id: "guestfavorites", periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", coletado_em: "2026-10-13", publicado_em: "2026-10-08", amostra_n: 85, url_origem: "https://www.guestfavorites.com/airbnb-occupancy-rates-in-mooca-sao-paulo-brazil", observacao: "amostra pequena", indicadores: { adr_medio_brl: 241, ocupacao_media_pct: 59 } };
describe("nova coleta", () => {
  it("preserva os valores de Mooca e sua amostra", () => { expect(coletaSchema.parse(base)).toMatchObject({ amostra_n: 85, indicadores: { adr_medio_brl: 241, ocupacao_media_pct: 59 } }); });
  it("rejeita ocupação acima de 100", () => { expect(coletaSchema.safeParse({ ...base, indicadores: { ...base.indicadores, ocupacao_media_pct: 101 } }).success).toBe(false); });
  it("rejeita amostra fracionária", () => { expect(coletaSchema.safeParse({ ...base, amostra_n: 85.5 }).success).toBe(false); });
  it("rejeita período invertido", () => { expect(coletaSchema.safeParse({ ...base, periodo_inicio: "2026-10-01" }).success).toBe(false); });
  it("rejeita quartis incompletos", () => { expect(coletaSchema.safeParse({ ...base, indicadores: { ...base.indicadores, adr_p25_brl: 27 } }).success).toBe(false); });
  it("rejeita outro domínio", () => { expect(coletaSchema.safeParse({ ...base, url_origem: "https://guestfavorites.com.evil.com/a" }).success).toBe(false); });
  it("converte decimal brasileiro sem mudar o valor", () => { expect(numeroColeta("1.234,56")).toBe(1234.56); });
});