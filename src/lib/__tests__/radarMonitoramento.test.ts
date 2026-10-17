import { describe, expect, it } from "vitest";
import { montarGraficoColetas, resumirConfianca, statusColetaBase } from "@/lib/radarMonitoramento";
import { bairrosReserva } from "@/lib/radarBase";

describe("contagem de bairros por confiança", () => {
  it("conta Mooca e Brooklin como baixa sem confundir tipo de fonte", () => {
    const bairros = bairrosReserva().filter((b) => ["Mooca", "Brooklin", "Liberdade", "Pinheiros"].includes(b.name))
      .map((b) => ({ ...b, confianca: b.name === "Pinheiros" ? "alta" as const : b.name === "Liberdade" ? "media" as const : "baixa" as const }));
    expect(resumirConfianca(bairros).map((r) => r.quantidade)).toEqual([1, 1, 2]);
  });
  it("não conta reserva sem confiança, cidade ou bairro repetido", () => {
    const base = bairrosReserva()[0];
    expect(resumirConfianca([base, { ...base, confianca: "alta" }, { ...base, confianca: "alta" }, { ...base, name: "São Paulo", confianca: "alta" }]).map((r) => r.quantidade)).toEqual([1, 0, 0]);
  });
});

describe("gráfico de coletas registradas", () => {
  it("não presume recebimento no Bewild para uma coleta ativa na base", () => {
    expect(statusColetaBase(true)).toEqual({ base: "ativa", bewild: "nao_verificada" });
  });
  it("preserva o status histórico sem presumir sincronização", () => {
    expect(statusColetaBase(false)).toEqual({ base: "historica", bewild: "nao_verificada" });
  });
  it("mantém cada coleta, inclusive inativas, com autor, horário e UTMs originais", () => {
    const auditoria = { autor_nome: "Administrador de teste", registrado_em: "2026-10-17T00:30:00Z", utms: { utm_source: "radar", utm_campaign: "coleta" } };
    const linhas = [
      { id: "nova", bairro: "Mooca", valor: "241", coletado_em: "2026-10-13", ativo: true, radar_coleta_auditoria: auditoria },
      { id: "antiga", bairro: "Mooca", valor: 230, coletado_em: "2026-09-13", ativo: false, radar_coleta_auditoria: null },
    ];
    const grafico = montarGraficoColetas(linhas);
    expect(grafico.map((r) => r.id)).toEqual(["nova", "antiga"]);
    expect(grafico.map((r) => r.diaria)).toEqual([241, 230]);
    expect(grafico[0].radar_coleta_auditoria).toEqual(auditoria);
    expect(grafico[1].radar_coleta_auditoria).toBeNull();
    expect(grafico[1].ativo).toBe(false);
  });
});