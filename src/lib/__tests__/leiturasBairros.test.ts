import { describe, expect, it } from "vitest";
import { NEIGHBORHOODS } from "@/data/mapaBairrosData";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import { bairrosReserva } from "@/lib/radarBase";
import { aplicarAjuste } from "@/lib/bairroAjustes";
import { SEM_FONTE_LEITURA, alinharLeiturasComBase, temPerfil } from "@/lib/leiturasBairros";

const base = bairrosReserva();
const leituras = alinharLeiturasComBase(NEIGHBORHOODS, base);
const porNome = (nome: string) => leituras.find((n) => n.name === nome)!;

describe("leituras do /mapa com a base do Radar", () => {
  it("bairro da base mostra os mesmos números do painel (um bairro, um número)", () => {
    for (const b of base) {
      const n = leituras.find((l) => l.name === b.name);
      if (!n) continue;
      expect(n.naBase).toBe(true);
      expect(n.metrics.nightlyRate).toBe(b.dailyAvg);
      expect(n.metrics.occupancy).toBe(b.avgOccupancy);
      expect(n.metrics.avgRevenueMo).toBe(receitaMensalReferencia(b));
      expect(n.metrics.activeListings).toBe(b.activeListings);
    }
    expect(porNome("Pinheiros").metrics).toMatchObject({ nightlyRate: 300, occupancy: 62, avgRevenueMo: 5580, activeListings: 2424 });
  });

  it("estimativa não ganha número de anúncios nem fonte GuestFavorites", () => {
    for (const nome of ["Brooklin", "Consolação"]) {
      const n = porNome(nome);
      expect(n.natureza).toBe("estimativa");
      expect(n.metrics.activeListings).toBeNull();
      expect(n.metrics.dataSource).toBe("Sem fonte pública atualizada");
    }
  });

  it("Mooca leva o aviso de amostra pequena", () => {
    expect(porNome("Mooca").aviso).toBe("amostra pequena (85 anúncios)");
  });

  it("bairro fora da base fica sem número de mercado", () => {
    for (const nome of ["Barra Funda", "Campo Belo", "Santana", "Itaquera"]) {
      const n = porNome(nome);
      expect(n.naBase).toBe(false);
      expect(n.metrics).toMatchObject({ nightlyRate: 0, occupancy: 0, avgRevenueMo: 0, estimatedROI: 0, activeListings: null, dataSource: SEM_FONTE_LEITURA });
    }
  });

  it("segue os ajustes do admin, como o painel", () => {
    const ajustada = base.map((b) => (b.name === "Moema" ? aplicarAjuste(b, { bairro: "Moema", diaria: 280, ocupacao: 65, fonte: "Ajuste" }) : b));
    const moema = alinharLeiturasComBase(NEIGHBORHOODS, ajustada).find((n) => n.name === "Moema")!;
    expect(moema.metrics.nightlyRate).toBe(280);
    expect(moema.metrics.occupancy).toBe(65);
    expect(moema.metrics.dataSource).toBe("Ajuste manual da Bewild");
  });
});

describe("perfil de demanda", () => {
  it("as chaves do filtro casam com as tags em português", () => {
    const turismo = NEIGHBORHOODS.filter((n) => temPerfil(n, ["tourism"])).map((n) => n.name);
    expect(turismo).toContain("Pinheiros");
    expect(turismo).toContain("Jardim Paulista"); // turismo premium também é turismo
    const hospitais = NEIGHBORHOODS.filter((n) => temPerfil(n, ["medical"])).map((n) => n.name);
    expect(hospitais).toEqual(["Vila Mariana"]);
  });

  it("todo filtro de perfil encontra pelo menos um bairro", async () => {
    const { DEMAND_FILTERS } = await import("@/data/mapaBairrosData");
    for (const f of DEMAND_FILTERS) expect(NEIGHBORHOODS.some((n) => temPerfil(n, [f.key])), f.key).toBe(true);
  });

  it("sem perfil escolhido, nenhum bairro em destaque", () => {
    expect(NEIGHBORHOODS.some((n) => temPerfil(n, []))).toBe(false);
  });
});
