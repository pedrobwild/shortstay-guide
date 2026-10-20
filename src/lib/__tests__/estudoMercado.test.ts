import { describe, expect, it } from "vitest";
import { bairrosReserva } from "@/lib/radarBase";
import { DESPESAS_EXEMPLO, DRE_LINHAS } from "@/data/dreGuia";
import { classesHistograma } from "@/lib/estudo";
import {
  dominioEixo, empilharEnxame, faixaConcentracao, fracao, fraseContraSP, linhasDre, marcasEixo, posicaoComEmpate, textoPosicao, frasePosicao,
} from "@/lib/estudoMercado";

const base = bairrosReserva();

describe("Mercado — título-achado do histograma", () => {
  it("a maioria dos 28 bairros (16) fica entre R$ 3.500 e R$ 4.500 por mês", () => {
    expect(faixaConcentracao(classesHistograma(base))).toEqual({ inicio: 3500, fim: 4500, quantidade: 16, total: 28, classes: 2 });
  });
  it("uma classe com mais da metade basta; sem bairros, nada", () => {
    const c = (n: number, inicio: number) => ({ inicio, fim: inicio + 500, itens: Array.from({ length: n }, () => ({ bairro: null, receita: inicio })) });
    expect(faixaConcentracao([c(1, 0), c(5, 500), c(1, 1000)])?.classes).toBe(1);
    expect(faixaConcentracao([])).toBeNull();
  });
});

describe("eixos e enxame de pontos", () => {
  it("domínio arredondado para fora e marcas a cada passo", () => {
    expect(dominioEixo([184, 485], 50)).toEqual([150, 500]);
    expect(marcasEixo([150, 300], 50)).toEqual([150, 200, 250, 300]);
    expect(fracao(250, [200, 300])).toBe(0.5);
  });
  it("pontos que encostam sobem e descem de nível; os demais ficam no nível 0", () => {
    const r = empilharEnxame([{ item: "a", x: 10 }, { item: "b", x: 12 }, { item: "c", x: 13 }, { item: "d", x: 40 }], 10);
    expect(r.map((p) => p.nivel)).toEqual([0, 1, -1, 0]);
    expect(r.map((p) => p.item)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("Bairro — resumo contra São Paulo e posição", () => {
  it("frase com sinal", () => {
    expect(fraseContraSP(18)).toBe("18% acima de São Paulo");
    expect(fraseContraSP(-29)).toBe("29% abaixo de São Paulo");
    expect(fraseContraSP(0)).toBe("no nível de São Paulo");
  });
  it("Pinheiros é o 6º em receita; na ocupação, empata com outros bairros de 63%", () => {
    const rec = posicaoComEmpate(base, "Pinheiros", "receita")!;
    expect(rec).toMatchObject({ posicao: 6, primeira: 6, ultima: 6, total: 28, empatados: [] });
    expect(textoPosicao(rec)).toBe("6º");
    // Ocupação de 63%: Brás (65%) e Bela Vista e Sé (64%) à frente; Pinheiros empata com mais três.
    const occ = posicaoComEmpate(base, "Pinheiros", "ocupacao")!;
    expect(occ.empatados.sort()).toEqual(["Consolação", "República", "Saúde"]);
    expect(textoPosicao(occ)).toBe("4º a 7º");
    expect(frasePosicao(occ)).toBe("entre o 4º e o 7º");
    expect(frasePosicao(rec)).toBe("o 6º");
    // Brooklin (aproximação) tem os números do Itaim Bibi: empata com ele e com a Vila Olímpia.
    expect(textoPosicao(posicaoComEmpate(base, "Brooklin", "receita")!)).toBe("2º a 4º");
    expect(posicaoComEmpate(base, "Bairro que não existe", "receita")).toBeNull();
  });
});

describe("Bairro, Tab. 1 — DRE do guia até o resultado líquido", () => {
  it("Pinheiros: R$ 5.651 de receita de referência → R$ 2.164 de resultado líquido por mês (o mesmo do simulador)", () => {
    const d = linhasDre(5651);
    expect(d.liquido).toBe(2164);
    expect(d.linhas.map((l) => l.chave)).toEqual(DRE_LINHAS.map((l) => l.chave));
    expect(d.receita - d.linhas.reduce((s, l) => s + l.valor, 0)).toBe(d.liquido);
  });
  it("percentuais vêm de DRE_LINHAS; fixos e contas em reais de DESPESAS_EXEMPLO", () => {
    const d = linhasDre(10000);
    for (const l of d.linhas) {
      const fonte = DRE_LINHAS.find((x) => x.chave === l.chave)!;
      if (l.base.tipo === "pct") expect(l.base.pct).toBe(fonte.pct);
    }
    expect(d.linhas.find((l) => l.chave === "fixos")?.valor).toBe(DESPESAS_EXEMPLO.condominio);
    expect(d.linhas.find((l) => l.chave === "contas")?.valor).toBe(DESPESAS_EXEMPLO.contas);
  });
});
