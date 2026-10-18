import { describe, expect, it } from "vitest";
import { EVENTS, NEIGHBORHOODS } from "@/data/mapaBairrosData";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import { bairrosReserva } from "@/lib/radarBase";
import { aplicarAjuste } from "@/lib/bairroAjustes";
import { alinharLeiturasComBase, nomesNaBase, temPerfil } from "@/lib/leiturasBairros";

const base = bairrosReserva();
const leituras = alinharLeiturasComBase(NEIGHBORHOODS, base);
const porNome = (nome: string) => leituras.find((n) => n.name === nome)!;

describe("leituras do /mapa com a base do Radar", () => {
  it("bairro da base mostra os mesmos números do painel (um bairro, um número)", () => {
    for (const b of base) {
      const n = leituras.find((l) => l.name === b.name);
      if (!n) continue;
      expect(n.metrics.nightlyRate).toBe(b.dailyAvg);
      expect(n.metrics.occupancy).toBe(b.avgOccupancy);
      expect(n.metrics.avgRevenueMo).toBe(receitaMensalReferencia(b));
      expect(n.metrics.activeListings).toBe(b.activeListings);
    }
    expect(porNome("Pinheiros").metrics).toMatchObject({ nightlyRate: 300, occupancy: 62, avgRevenueMo: 5580, activeListings: 2424 });
  });

  it("estimativa e aproximação não ganham número de anúncios; a fonte diz o que são", () => {
    const consolacao = porNome("Consolação");
    expect(consolacao.natureza).toBe("estimativa");
    expect(consolacao.metrics.activeListings).toBeNull();
    expect(consolacao.metrics.dataSource).toBe("Sem fonte pública atualizada");
    for (const nome of ["Brooklin"]) {
      const n = porNome(nome);
      expect(n.natureza).toBe("aproximacao");
      expect(n.metrics.activeListings).toBeNull();
      expect(n.metrics).toMatchObject({ nightlyRate: 359, occupancy: 59 });
      expect(n.metrics.dataSource).toBe("GuestFavorites (aproximação pelo Itaim Bibi) · jan–set/2026 · coleta 13/10/2026");
    }
  });

  it("Mooca leva o aviso de amostra pequena", () => {
    expect(porNome("Mooca").aviso).toBe("amostra pequena (85 anúncios)");
  });

  it("bairro fora da base não entra nas leituras", () => {
    const nomes = leituras.map((n) => n.name);
    for (const nome of ["Vila Nova Conceição", "Itaquera"]) expect(nomes).not.toContain(nome);
    const naBase = new Set(base.map((b) => b.name));
    for (const nome of nomes) expect(naBase.has(nome), nome).toBe(true);
  });

  it("eventos ficam só com bairros próximos da base", () => {
    expect(nomesNaBase(["Moema", "Itaquera", "itaim bibi"], base)).toEqual(["Moema", "Itaim Bibi"]);
    const apas = EVENTS.find((e) => e.name === "APAS Show")!;
    expect(nomesNaBase(apas.nearbyNeighborhoods, base)).toEqual(["Barra Funda", "Santana"]); // entraram na base em 18/10/2026
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
