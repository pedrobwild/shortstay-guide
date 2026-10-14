import { describe, expect, it } from "vitest";
import { caminhoSimulacao, campoParaInteiro, lerPremissas, temPremissasAlemDoBairro } from "@/lib/simulacaoLink";

describe("link da simulação", () => {
  it("ida e volta: o que vai na URL volta igual", () => {
    const premissas = { bairro: "vila-mariana", metragem: 27, ocupacao: 62, diaria: 260, objetivo: "premium" as const, boost: 20, reforma: 71850 };
    const caminho = caminhoSimulacao(premissas);
    expect(caminho).toBe("/?bairro=vila-mariana&m=27&occ=62&diaria=260&obj=premium&boost=20&reforma=71850#simulador");
    const search = caminho.slice(1, caminho.indexOf("#"));
    expect(lerPremissas(search)).toEqual(premissas);
  });

  it("aceita o nome do bairro com acento e devolve o slug", () => {
    expect(caminhoSimulacao({ bairro: "Jardim Paulista" })).toBe("/?bairro=jardim-paulista#simulador");
  });

  it("omite boost 0 e campos opcionais vazios", () => {
    expect(caminhoSimulacao({ bairro: "pinheiros", metragem: 30, ocupacao: 75, boost: 0 })).toBe("/?bairro=pinheiros&m=30&occ=75#simulador");
  });

  it("ignora valores fora das faixas do simulador ou malformados", () => {
    const p = lerPremissas("?bairro=pinheiros&m=500&occ=20&diaria=-3&obj=hack&boost=15&reforma=abc");
    expect(p).toEqual({ bairro: "pinheiros" });
    expect(temPremissasAlemDoBairro(p)).toBe(false);
  });

  it("reconhece um link compartilhado (mais que o bairro)", () => {
    expect(temPremissasAlemDoBairro(lerPremissas("?bairro=pinheiros&m=27"))).toBe(true);
    expect(temPremissasAlemDoBairro(lerPremissas("?bairro=pinheiros"))).toBe(false);
  });

  it("converte campos de texto em inteiros só quando são números positivos", () => {
    expect(campoParaInteiro("72000")).toBe(72000);
    expect(campoParaInteiro("")).toBeUndefined();
    expect(campoParaInteiro("72.000")).toBeUndefined();
    expect(campoParaInteiro("0")).toBeUndefined();
  });
});
