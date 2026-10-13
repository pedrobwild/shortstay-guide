import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BAIRROS_CURADOS, getBairroCurado, receitaMensalReferencia, diariaPorMetragem } from "@/data/bairrosCurados";
import { aplicarCurados } from "@/hooks/useIntelligenceData";
import type { BairroAirbnb } from "@/types/intelligence";

describe("bairrosCurados", () => {
  it("tem os 11 bairros curados e não inclui a Mooca", () => {
    expect(BAIRROS_CURADOS).toHaveLength(11);
    expect(getBairroCurado("Mooca")).toBeUndefined();
  });

  it("Bela Vista: 240–370, 64%, 220/290/360", () => {
    const b = getBairroCurado("Bela Vista")!;
    expect([b.dailyMin, b.dailyMax, b.dailyAvg, b.avgOccupancy]).toEqual([240, 370, 305, 64]);
    expect(b.avgBySize).toEqual({ "20–25 m²": 220, "26–35 m²": 290, "36–50 m²": 360 });
  });

  it("Pinheiros 62% e Vila Mariana 60%", () => {
    expect(getBairroCurado("Pinheiros")!.avgOccupancy).toBe(62);
    expect(getBairroCurado("Vila Mariana")!.avgOccupancy).toBe(60);
  });

  it("Jardim Paulista: média informada 440, sem recorte por metragem", () => {
    const b = getBairroCurado("jardim paulista")!;
    expect(b.dailyAvg).toBe(440);
    expect(b.avgBySize).toBeNull();
    expect(diariaPorMetragem(b, "20–25 m²")).toBe(440);
  });

  it("receita mensal = diária média × 30 × ocupação", () => {
    expect(receitaMensalReferencia(getBairroCurado("Bela Vista")!)).toBe(Math.round(305 * 30 * 0.64));
  });

  it("banco não sobrescreve diária/ocupação de bairro curado", () => {
    const row = { bairro: "Bela Vista", adr_medio_studio: 180, ocupacao_media_studio: 0.72, preco_m2_residencial_medio: 0, area_media_estudio: 30 } as unknown as BairroAirbnb;
    const r = aplicarCurados(row);
    expect(r.adr_medio_studio).toBe(305);
    expect(r.ocupacao_media_studio).toBeCloseTo(0.64);
  });

  it("nenhum multiplicador de diária sobrou no código", () => {
    const files: string[] = [];
    const walk = (d: string) => readdirSync(d).forEach((n) => { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) && !p.includes("__tests__") && files.push(p); });
    walk("src");
    for (const f of files) {
      const s = readFileSync(f, "utf8");
      expect(s, f).not.toMatch(/adr \* (0\.8|1\.4|0\.78|1\.24)\b/);
      expect(s, f).not.toMatch(/BAIRRO_DATA/);
    }
  });
});
