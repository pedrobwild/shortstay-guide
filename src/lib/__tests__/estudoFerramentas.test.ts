import { describe, expect, it } from "vitest";
import { simulate } from "@/lib/financiamento";
import { resultadoShortStay, SHORT_STAY_PADRAO, IMOVEL_PADRAO } from "@/lib/simuladorReceita";
import { ORCAMENTO_MINIMO_BASE } from "@/data/provasBewild";
import {
  amostrarSerie, dominioRegua, estimativaReformaCompleta, fracaoNoDominio, limitarArea, listaPt, marcasEixo,
  resumoFinanciamento, segmentosReceita,
} from "@/lib/estudoFerramentas";

describe("02 · Reformar — estimativa a partir do estudo Bewild", () => {
  it("27,5 m² (área mediana): P25, mediana e P75 do R$/m² × área, arredondados a R$ 500", () => {
    const e = estimativaReformaCompleta(27.5, false);
    expect([e.p25.valor, e.mediana.valor, e.p75.valor]).toEqual([67500, 75500, 86000]);
    expect(e.algumNoPiso).toBe(false);
    expect(e.prazoDiasUteis).toBe(60);
  });

  it("áreas pequenas sobem para o piso de R$ 55 mil (nenhum contrato abaixo disso)", () => {
    const e = estimativaReformaCompleta(15, false);
    expect([e.p25.valor, e.mediana.valor, e.p75.valor]).toEqual([ORCAMENTO_MINIMO_BASE, ORCAMENTO_MINIMO_BASE, ORCAMENTO_MINIMO_BASE]);
    expect(e.algumNoPiso).toBe(true);
    expect(estimativaReformaCompleta(20, false).p25.noPiso).toBe(true);
    expect(estimativaReformaCompleta(20, false).p75.noPiso).toBe(false);
  });

  it("prazo em contrato pela metragem e sacada; marcenaria em paralelo (25 + 5 dias úteis)", () => {
    expect(estimativaReformaCompleta(30, true).prazoDiasUteis).toBe(65);
    expect(estimativaReformaCompleta(35, false).prazoDiasUteis).toBe(70);
    expect(estimativaReformaCompleta(40, true).prazoDiasUteis).toBe(75);
    expect(estimativaReformaCompleta(45, true).acimaDe40).toBe(true);
    expect(estimativaReformaCompleta(30, false).marcenaria).toEqual({ fabrica: 25, montagem: 5, total: 30 });
  });

  it("área digitada fica entre 15 e 50 m²; vazia vira null", () => {
    expect(limitarArea(null)).toBeNull();
    expect(limitarArea(0)).toBeNull();
    expect(limitarArea(8)).toBe(15);
    expect(limitarArea(80)).toBe(50);
    expect(limitarArea(27.54)).toBe(27.5);
  });
});

describe("01 · Comprar — resumo do financiamento", () => {
  it("usa o motor de financiamento (SAC): 1ª e última parcela, juros no prazo", () => {
    const r = resumoFinanciamento({ valor: 500000, entrada: 100000, prazoMeses: 360, jurosAA: 11.19 });
    const ref = simulate("SAC", { propertyValue: 500000, downPayment: 100000, termMonths: 360, annualRate: 11.19, annualRateType: "efetiva" });
    expect(r).not.toBeNull();
    expect(r!.valorFinanciado).toBe(400000);
    expect(r!.entradaPct).toBe(20);
    expect(r!.primeiraParcela).toBeCloseTo(ref.firstInstallment, 6);
    expect(r!.ultimaParcela).toBeCloseTo(ref.lastInstallment, 6);
    expect(r!.jurosNoPrazo).toBeCloseTo(ref.totalInterest, 6);
    expect(r!.primeiraParcela).toBeGreaterThan(r!.ultimaParcela);
  });

  it("sem valor, sem juros, prazo curto ou entrada cobrindo o imóvel: nada a mostrar", () => {
    expect(resumoFinanciamento({ valor: 0, entrada: 0, prazoMeses: 360, jurosAA: 11 })).toBeNull();
    expect(resumoFinanciamento({ valor: 500000, entrada: 100000, prazoMeses: 360, jurosAA: 0 })).toBeNull();
    expect(resumoFinanciamento({ valor: 500000, entrada: 100000, prazoMeses: 6, jurosAA: 11 })).toBeNull();
    expect(resumoFinanciamento({ valor: 500000, entrada: 500000, prazoMeses: 360, jurosAA: 11 })).toBeNull();
  });
});

describe("Simular — barra empilhada da receita", () => {
  it("custos + líquido fecham a receita bruta, com os fixos agrupados", () => {
    const r = resultadoShortStay({ diaria: 299, ocupacaoPct: 63 }, { ...IMOVEL_PADRAO, iptu: 100 }, SHORT_STAY_PADRAO);
    const s = segmentosReceita(r);
    const soma = s.custos.reduce((t, c) => t + c.valor, 0) + (s.liquido?.valor ?? 0);
    expect(soma).toBe(r.receitaBruta);
    expect(s.custos.map((c) => c.chave)).toEqual(["airbnb", "gestao", "impostos", "manutencao", "fixos"]);
    expect(s.custos[4].rotulo).toBe("Fixos (condomínio, IPTU e contas)");
    expect(s.liquido?.fim).toBeCloseTo(1, 6);
    expect(s.deficit).toBeNull();
  });

  it("resultado negativo: custos passam da receita e o excesso vira déficit", () => {
    const r = resultadoShortStay({ diaria: 100, ocupacaoPct: 30 }, { valorImovel: 0, condominio: 1500, iptu: 200 }, SHORT_STAY_PADRAO);
    const s = segmentosReceita(r);
    expect(r.liquido).toBeLessThan(0);
    expect(s.liquido).toBeNull();
    expect(s.deficit?.valor).toBe(-r.liquido);
    expect(s.escala).toBe(r.totalDeducoes);
  });
});

describe("Réguas e eixos", () => {
  it("domínio com folga, em passos de R$ 50, nunca negativo", () => {
    expect(dominioRegua([171, 232, 301, 299])).toEqual([100, 400]);
    expect(dominioRegua([20])[0]).toBe(0);
    expect(fracaoNoDominio(250, [100, 400])).toBeCloseTo(0.5, 6);
    expect(fracaoNoDominio(999, [100, 400])).toBe(1);
  });

  it("marcas redondas", () => {
    expect(marcasEixo([0, 6000], 6)).toEqual([0, 1000, 2000, 3000, 4000, 5000, 6000]);
    expect(marcasEixo([100, 350], 5)).toEqual([100, 150, 200, 250, 300, 350]);
  });

  it("amostragem mantém primeiro e último", () => {
    const s = amostrarSerie(Array.from({ length: 360 }, (_, i) => i), 60);
    expect(s[0]).toBe(0);
    expect(s[s.length - 1]).toBe(359);
    expect(s.length).toBeLessThanOrEqual(61);
  });

  it("listas em pt-BR", () => {
    expect(listaPt(["a"])).toBe("a");
    expect(listaPt(["a", "b", "c"])).toBe("a, b e c");
  });
});
