import { describe, expect, it } from "vitest";
import { DEFAULT_PROJECTION_COSTS } from "@/lib/projectAnalytics";
import {
  CHAVE_LEGADA, CHAVE_PREMISSAS, PREMISSAS_PADRAO, lerPremissasSalvas, normalizarPremissas, salvarPremissas,
} from "@/lib/projecaoPremissas";

/** Armazenamento em memória no lugar do localStorage. */
function memoria(inicial: Record<string, string> = {}) {
  const dados = new Map(Object.entries(inicial));
  return { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => void dados.set(k, v), dados };
}

describe("premissas da projeção do studio", () => {
  it("os padrões são as premissas do projeto (hipóteses editáveis)", () => {
    expect(PREMISSAS_PADRAO).toMatchObject({
      bairro: null, area: "26–35 m²", valorImovel: 0, diaria: null, ocupacao: null, estadia: 3,
      limpeza: DEFAULT_PROJECTION_COSTS.cleaningPerStay, gestao: DEFAULT_PROJECTION_COSTS.managementPct,
      impostos: DEFAULT_PROJECTION_COSTS.taxesPct, condominio: DEFAULT_PROJECTION_COSTS.condoMonthly,
    });
  });

  it("campo fora do formato ou dos limites volta ao padrão", () => {
    const p = normalizarPremissas({ bairro: "  ", area: "100 m²", valorImovel: -5, diaria: 50, ocupacao: 99, gestao: 99, impostos: "6", estadia: 0, limpeza: 200 });
    expect(p).toEqual({ ...PREMISSAS_PADRAO, limpeza: 200 });
  });

  it("aceita valores válidos, inclusive diária e ocupação ajustadas", () => {
    const p = normalizarPremissas({ bairro: "Moema", area: "20–25 m²", valorImovel: 650000, diaria: 280, ocupacao: 70, estadia: 4, gestao: 20, impostos: 6.5, condominio: 800 });
    expect(p).toMatchObject({ bairro: "Moema", area: "20–25 m²", valorImovel: 650000, diaria: 280, ocupacao: 70, estadia: 4, gestao: 20, impostos: 6.5, condominio: 800 });
  });

  it("sem armazenamento ou com rascunho ilegível, usa os padrões", () => {
    expect(lerPremissasSalvas(null)).toEqual(PREMISSAS_PADRAO);
    expect(lerPremissasSalvas(memoria({ [CHAVE_PREMISSAS]: "{quebrado" }))).toEqual(PREMISSAS_PADRAO);
  });

  it("aproveita custos e valor do imóvel da versão anterior, mas não a diária antiga", () => {
    const legado = JSON.stringify({ adr: 999, cleaningPerStay: 150, managementPct: 20, taxesPct: 6, condoMonthly: 700, propertyValue: 500000 });
    const p = lerPremissasSalvas(memoria({ [CHAVE_LEGADA]: legado }));
    expect(p).toMatchObject({ valorImovel: 500000, limpeza: 150, gestao: 20, impostos: 6, condominio: 700, diaria: null, ocupacao: null });
  });

  it("guarda e lê o rascunho da versão atual (só números e escolhas da simulação)", () => {
    const armazenamento = memoria();
    const p = { ...PREMISSAS_PADRAO, bairro: "Pinheiros", valorImovel: 650000, diaria: 310 };
    salvarPremissas(p, armazenamento);
    expect(Object.keys(JSON.parse(armazenamento.dados.get(CHAVE_PREMISSAS)!)).sort()).toEqual(
      ["area", "bairro", "condominio", "diaria", "estadia", "gestao", "impostos", "limpeza", "ocupacao", "valorImovel"],
    );
    expect(lerPremissasSalvas(armazenamento)).toEqual(p);
  });

  it("navegador sem armazenamento não quebra a tela", () => {
    const quebrado = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } };
    expect(lerPremissasSalvas(quebrado)).toEqual(PREMISSAS_PADRAO);
    expect(() => salvarPremissas(PREMISSAS_PADRAO, quebrado)).not.toThrow();
  });
});
