import { describe, expect, it } from "vitest";
import { calcularVariacoes, type LinhaObservacao } from "@/lib/variacaoColeta";

let seq = 0;
const linha = (p: Partial<LinhaObservacao>): LinhaObservacao => ({
  id: `id-${String(++seq).padStart(3, "0")}`,
  bairro: "Pinheiros",
  indicador: "adr_medio_brl",
  valor: 300,
  coletado_em: "2026-10-13T12:00:00Z",
  ativo: true,
  fonte_id: "guestfavorites",
  periodo_inicio: "2026-01-01",
  periodo_fim: "2026-09-30",
  ...p,
});

describe("o que mudou nesta coleta", () => {
  it("sem coleta anterior, não há variação (situação atual da base)", () => {
    expect(calcularVariacoes([linha({}), linha({ indicador: "ocupacao_media_pct", valor: 62 })])).toEqual([]);
  });

  it("compara a ativa com a coleta anterior da mesma fonte", () => {
    const [v] = calcularVariacoes([
      linha({ valor: 300, coletado_em: "2027-01-15T10:00:00Z", periodo_fim: "2026-12-31" }),
      linha({ valor: 280, coletado_em: "2026-10-13T12:00:00Z", ativo: false }),
      linha({ indicador: "ocupacao_media_pct", valor: 64, coletado_em: "2027-01-15T10:00:00Z" }),
      linha({ indicador: "ocupacao_media_pct", valor: 62, coletado_em: "2026-10-13T12:00:00Z", ativo: false }),
    ]);
    expect(v.bairro).toBe("Pinheiros");
    expect(v.adr?.anterior.valor).toBe(280);
    expect(v.adr?.atual.valor).toBe(300);
    expect(v.adr?.diferenca).toBe(20);
    expect(v.adr?.percentual).toBeCloseTo(7.142857, 4);
    expect(v.adr?.atual.periodo).toBe("jan–dez/2026");
    expect(v.ocupacao?.diferenca).toBe(2);
  });

  it("não mistura fontes: anterior de outra fonte é ignorada", () => {
    expect(calcularVariacoes([
      linha({ valor: 300, coletado_em: "2027-01-15T10:00:00Z" }),
      linha({ valor: 360, coletado_em: "2026-10-13T12:00:00Z", ativo: false, fonte_id: "estimativa-bewild" }),
    ])).toEqual([]);
  });

  it("linhas do mesmo dia são a mesma coleta, não uma anterior", () => {
    expect(calcularVariacoes([
      linha({ valor: 300, coletado_em: "2026-10-13T15:00:00Z" }),
      linha({ valor: 290, coletado_em: "2026-10-13T09:00:00Z", ativo: false }),
    ])).toEqual([]);
  });

  it("ignora bairros sem linha ativa e indicadores fora da lista", () => {
    expect(calcularVariacoes([
      linha({ ativo: false, coletado_em: "2027-01-15T10:00:00Z" }),
      linha({ ativo: false }),
      linha({ indicador: "adr_p25_brl", coletado_em: "2027-01-15T10:00:00Z" }),
      linha({ indicador: "adr_p25_brl", ativo: false, valor: 150 }),
    ])).toEqual([]);
  });
});
