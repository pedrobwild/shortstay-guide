import { describe, expect, it } from "vitest";
import { resumirConfianca } from "@/lib/radarMonitoramento";
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