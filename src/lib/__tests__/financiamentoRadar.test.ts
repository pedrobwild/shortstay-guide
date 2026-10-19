import { describe, expect, it } from "vitest";
import { bairrosReserva } from "@/lib/radarBase";
import { bairroFinanciamento, projetarFinanciamentoRadar } from "@/lib/financiamentoRadar";

describe("financiamento com coletas aprovadas", () => {
  it("encontra o bairro por nome sem acento e não inventa bairro ausente", () => {
    expect(bairroFinanciamento(bairrosReserva(), "vila olimpia")?.name).toBe("Vila Olímpia");
    expect(bairroFinanciamento(bairrosReserva(), "Bairro inexistente")).toBeUndefined();
  });
  it("projeta diária e ocupação da coleta, deduz despesas e a parcela completa", () => {
    const resultado = projetarFinanciamentoRadar({ dailyAvg: 299, avgOccupancy: 63 }, 2000, { condominio: 500, iptu: 100, contas: 500 });
    expect(resultado?.receitaBruta).toBe(5651);
    expect(resultado?.liquido).toBe(2064);
    expect(resultado?.aposParcela).toBe(64);
  });
  it("recalcula quando a coleta muda sem mudar o valor da parcela", () => {
    const despesas = { condominio: 0, iptu: 0, contas: 0 };
    expect(projetarFinanciamentoRadar({ dailyAvg: 200, avgOccupancy: 50 }, 2000, despesas)?.aposParcela).toBe(-320);
    expect(projetarFinanciamentoRadar({ dailyAvg: 300, avgOccupancy: 50 }, 2000, despesas)?.aposParcela).toBe(520);
  });
  it("não projeta métricas inválidas", () => {
    expect(projetarFinanciamentoRadar({ dailyAvg: 299, avgOccupancy: 101 }, 2000)).toBeNull();
  });
});