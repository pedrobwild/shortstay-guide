import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEDUCOES_PADRAO_PCT, DRE_GUIA, DRE_LINHAS, DRE_PERCENTUAIS_PCT, TEXTO_DRE_COMPLETO, TEXTO_DRE_PERCENTUAIS, investimentoTotal, liquidoDetalhado, resultadoLiquidoMensal } from "@/data/dreGuia";
import { SHORT_STAY_PADRAO } from "@/lib/simuladorReceita";
import { DEFAULT_PROJECTION_COSTS } from "@/lib/projectAnalytics";

const SELF = "dreGuia.test.ts";
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|md)$/.test(f) && !p.endsWith(SELF) ? [p] : [];
  });
}

describe("DRE padrão do guia — fonte única", () => {
  it("Airbnb 15% e gestão 18% (decisões de 18/10/2026); total de 55%", () => {
    expect(DRE_GUIA).toEqual({ airbnbPct: 15, gestaoPct: 18, impostosPct: 6, manutencaoPct: 5, fixosPct: 8, contasPct: 3 });
    expect(DRE_PERCENTUAIS_PCT).toBe(44);
    expect(DEDUCOES_PADRAO_PCT).toBe(55);
    expect(resultadoLiquidoMensal(10000)).toBe(4500);
    expect(DRE_LINHAS.reduce((s, l) => s + l.pct, 0)).toBe(DEDUCOES_PADRAO_PCT);
  });

  it("simulador e painel de projeção leem os mesmos percentuais", () => {
    expect(SHORT_STAY_PADRAO).toMatchObject({ airbnbPct: 15, gestaoPct: 18, impostosPct: 6, manutencaoPct: 5 });
    expect(DEFAULT_PROJECTION_COSTS.managementPct).toBe(DRE_GUIA.gestaoPct);
    expect(DEFAULT_PROJECTION_COSTS.taxesPct).toBe(DRE_GUIA.impostosPct);
  });

  it("textos em pt-BR a partir dos mesmos números", () => {
    expect(TEXTO_DRE_PERCENTUAIS).toBe("Airbnb 15%, gestão 18%, impostos 6% e manutenção 5% da receita bruta");
    expect(TEXTO_DRE_COMPLETO).toContain("total 55%");
  });

  it("conta detalhada: percentuais sobre a bruta mais despesas em reais", () => {
    const c = liquidoDetalhado(10000, { condominio: 500, iptu: 100, contas: 400 });
    expect(c.airbnb).toBe(1500);
    expect(c.gestao).toBe(1800);
    expect(c.fixos).toBe(1000);
    expect(c.liquido).toBe(10000 - 4400 - 1000);
    expect(liquidoDetalhado(5580).liquido).toBe(2125); // cada linha arredondada ao real, como no simulador
  });

  it("investimento total = imóvel + reforma + ITBI (quando informado), nunca negativo", () => {
    expect(investimentoTotal({ imovel: 300000 })).toBe(300000);
    expect(investimentoTotal({ imovel: 300000, reforma: 71850, itbi: 9000 })).toBe(380850);
    expect(investimentoTotal({ imovel: 300000, reforma: -5 })).toBe(300000);
  });

  it.each(["gestão 20%", "gestão de 20%", "Gestão 20%", "DRE de 45%", "45% de custo", "× 0,55", "Airbnb 3%", "DRE de 43%"])(
    "nenhum texto antigo do DRE sobrevive em src/: '%s'",
    (termo) => {
      const achados = files("src").filter((f) => readFileSync(f, "utf8").includes(termo));
      expect(achados).toEqual([]);
    },
  );
});
