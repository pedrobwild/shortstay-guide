import { beforeEach, describe, expect, it } from "vitest";
import { RETOMADA_MAX_DIAS, lembrarBairro, lembrarSimulacao, lerUltimaSimulacao, lerUltimoBairro } from "@/lib/retomada";

const DIA = 24 * 60 * 60 * 1000;

describe("retomar de onde parou", () => {
  beforeEach(() => localStorage.clear());

  it("lembra a última simulação e o último bairro", () => {
    lembrarSimulacao("/?bairro=pinheiros&m=27#simulador", "Pinheiros");
    lembrarBairro("vila-mariana", "Vila Mariana");
    expect(lerUltimaSimulacao()?.bairro).toBe("Pinheiros");
    expect(lerUltimoBairro()?.nome).toBe("Vila Mariana");
  });

  it(`expira depois de ${RETOMADA_MAX_DIAS} dias`, () => {
    lembrarSimulacao("/?bairro=pinheiros#simulador", "Pinheiros");
    expect(lerUltimaSimulacao(Date.now() + (RETOMADA_MAX_DIAS + 1) * DIA)).toBeNull();
    expect(lerUltimaSimulacao(Date.now() + (RETOMADA_MAX_DIAS - 1) * DIA)).not.toBeNull();
  });

  it("recusa conteúdo adulterado no armazenamento", () => {
    localStorage.setItem("radar_ultima_simulacao", JSON.stringify({ caminho: "https://exemplo.com", bairro: "x", quando: Date.now() }));
    localStorage.setItem("radar_ultimo_bairro", JSON.stringify({ slug: "../admin", nome: "x", quando: Date.now() }));
    expect(lerUltimaSimulacao()).toBeNull();
    expect(lerUltimoBairro()).toBeNull();
    localStorage.setItem("radar_ultimo_bairro", "{quebrado");
    expect(lerUltimoBairro()).toBeNull();
  });
});
