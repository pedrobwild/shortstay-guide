import { describe, expect, it } from "vitest";
import { bairrosReserva } from "@/lib/radarBase";
import { SAO_PAULO_REFERENCIA } from "@/data/bairrosCurados";
import { RECEITA_REFERENCIA_SP } from "@/lib/radarUi";
import {
  classeModal, classeQuartil, classesHistograma, compararOperacao, contagemContra, difPercentual, estimativaReforma,
  extremos, faixaNosQuartis, limitesQuartis, posicaoEntre, prazoContrato, quantil, receitaDe, temAmostraPequena,
} from "@/lib/estudo";

const base = bairrosReserva();

/** Os números do direcionamento do redesign (out/2026) conferidos contra a base aprovada. */
describe("Estudo aberto — números da base de 28 bairros", () => {
  it("São Paulo: receita de referência R$ 4.770 (R$ 265 × 30 × 60%)", () => {
    expect(RECEITA_REFERENCIA_SP).toBe(4770);
    expect(receitaDe(SAO_PAULO_REFERENCIA)).toBe(4770);
  });

  it("19 de 28 bairros ficam abaixo da receita de São Paulo", () => {
    expect(base).toHaveLength(28);
    expect(contagemContra(base, receitaDe, RECEITA_REFERENCIA_SP)).toEqual({ abaixo: 19, acima: 9, iguais: 0, total: 28 });
  });

  it("Morumbi tem a maior receita (R$ 8.294) e a ocupação vai de 54% (Perdizes) a 65% (Brás)", () => {
    const r = extremos(base, receitaDe);
    expect(r?.max).toBe(8294);
    expect(r?.nomesMax).toEqual(["Morumbi"]);
    const o = extremos(base, (b) => b.avgOccupancy);
    expect([o?.min, o?.max]).toEqual([54, 65]);
    expect(o?.nomesMin).toEqual(["Perdizes"]);
    expect(o?.nomesMax).toEqual(["Brás"]);
  });

  it("amostra pequena: só Mooca, Bom Retiro e Lapa (fonte pública com menos de 200 anúncios)", () => {
    expect(base.filter(temAmostraPequena).map((b) => b.name).sort()).toEqual(["Bom Retiro", "Lapa", "Mooca"]);
  });

  it("histograma em classes de R$ 500 cobre os 28 bairros sem sobrepor classes", () => {
    const classes = classesHistograma(base);
    expect(classes.reduce((s, c) => s + c.itens.length, 0)).toBe(28);
    expect(classes[0].inicio).toBe(3000);
    expect(classes[classes.length - 1].inicio).toBe(8000);
    for (const c of classes) for (const i of c.itens) expect(i.receita >= c.inicio && i.receita < c.fim).toBe(true);
    const modal = classeModal(classes);
    expect(modal?.inicio).toBe(4000);
  });

  it("posição de Pinheiros entre os 28 pela receita e pela ocupação", () => {
    // Receita: Morumbi, Itaim Bibi, Brooklin e Vila Olímpia (aproximação pelo Itaim, em ordem alfabética) e Jardim Paulista à frente.
    expect(posicaoEntre(base, "Pinheiros", "receita")).toEqual({ posicao: 6, total: 28 });
    expect(posicaoEntre(base, "Bairro que não existe", "receita")).toBeNull();
  });

  it("diferença percentual contra SP", () => {
    expect(difPercentual(5651, 4770)).toBe(18);
    expect(difPercentual(3402, 4770)).toBe(-29);
  });
});

describe("quartis e classes", () => {
  it("quantil por interpolação linear", () => {
    expect(quantil([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(quantil([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75);
  });
  it("4 classes por quartil", () => {
    const lim = limitesQuartis([10, 20, 30, 40, 50]);
    expect(lim).toEqual([20, 30, 40]);
    expect([10, 20, 25, 35, 41].map((v) => classeQuartil(v, lim))).toEqual([1, 1, 2, 3, 4]);
  });
});

describe("perfil 03 · Já opero", () => {
  const pinheiros = base.find((b) => b.name === "Pinheiros")!;
  it("compara receita, ocupação em pontos percentuais e a faixa da diária nos quartis", () => {
    const r = compararOperacao({ diaria: 260, ocupacaoPct: 70 }, pinheiros);
    expect(r.receitaBairro).toBe(5651);
    expect(r.receitaMinha).toBe(5460);
    expect(r.difReceita).toBe(-191);
    expect(r.difOcupacaoPP).toBe(7);
    expect(r.faixaDiaria).toBe("mediana-p75");
  });
  it("faixa nos quartis (171 / 232 / 301)", () => {
    const q = pinheiros.dailyQuartiles;
    expect(faixaNosQuartis(150, q)).toBe("abaixo-p25");
    expect(faixaNosQuartis(200, q)).toBe("p25-mediana");
    expect(faixaNosQuartis(301, q)).toBe("mediana-p75");
    expect(faixaNosQuartis(320, q)).toBe("acima-p75");
    expect(faixaNosQuartis(320, null)).toBeNull();
  });
});

describe("perfil 02 · Vou reformar", () => {
  it("27,5 m² × R$/m² do estudo (P25 2.457 · mediana 2.744 · P75 3.125), arredondado a R$ 500", () => {
    const e = estimativaReforma(27.5);
    expect([e.p25.valor, e.mediana.valor, e.p75.valor]).toEqual([67500, 75500, 86000]);
    expect(e.p25.noPiso).toBe(false);
  });
  it("abaixo de R$ 55 mil vale o piso do estudo", () => {
    const e = estimativaReforma(20);
    expect(e.p25).toEqual({ valor: 55000, noPiso: true });
    expect(e.mediana.valor).toBe(55000);
  });
  it("prazo em contrato: 60 a 75 dias úteis conforme metragem e sacada", () => {
    expect([prazoContrato(25, false), prazoContrato(25, true), prazoContrato(35, false), prazoContrato(38, true)]).toEqual([60, 65, 70, 75]);
  });
});
