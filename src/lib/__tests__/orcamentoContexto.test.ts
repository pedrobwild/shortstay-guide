import { describe, expect, it } from "vitest";
import { orcamentoUrl } from "@/lib/orcamento";
import { formatBRL } from "@/lib/numberFormat";

const UTM = "utm_source=radar&utm_medium=referral&utm_campaign=radar_bewild";

describe("pedido de orçamento", () => {
  it("sem contexto, a URL é a oficial com UTM do local", () => {
    expect(orcamentoUrl("projecao")).toBe(`https://bewild.com.br/orcamento?${UTM}&utm_content=projecao`);
    expect(orcamentoUrl("comparar")).toBe(`https://bewild.com.br/orcamento?${UTM}&utm_content=comparar`);
  });

  it("com contexto da projeção, leva bairro, faixa, valor e resultado (sem dado pessoal)", () => {
    const url = new URL(orcamentoUrl("projecao", { bairro: "Vila Olímpia", area: "26–35 m²", valorImovel: 650000.4, resultadoLiquido: 36408.6 }));
    expect(url.origin + url.pathname).toBe("https://bewild.com.br/orcamento");
    expect(url.searchParams.get("utm_content")).toBe("projecao");
    expect(url.searchParams.get("utm_campaign")).toBe("radar_bewild");
    expect(url.searchParams.get("bairro")).toBe("vila-olimpia");
    expect(url.searchParams.get("area")).toBe("26-35");
    expect(url.searchParams.get("valor_imovel")).toBe("650000");
    expect(url.searchParams.get("resultado_12m")).toBe("36409");
    expect([...url.searchParams.keys()].sort()).toEqual(
      ["area", "bairro", "resultado_12m", "utm_campaign", "utm_content", "utm_medium", "utm_source", "valor_imovel"],
    );
  });

  it("valor do imóvel não informado não vai na URL; resultado negativo vai com sinal", () => {
    const url = new URL(orcamentoUrl("projecao", { bairro: "Mooca", area: "20–25 m²", valorImovel: 0, resultadoLiquido: -1200 }));
    expect(url.searchParams.has("valor_imovel")).toBe(false);
    expect(url.searchParams.get("area")).toBe("20-25");
    expect(url.searchParams.get("resultado_12m")).toBe("-1200");
  });
});

describe("moeda em reais", () => {
  it("formata inteiro com ponto de milhar", () => expect(formatBRL(71850)).toBe("R$ 71.850"));
  it("negativo com sinal de menos tipográfico", () => expect(formatBRL(-9120)).toBe("−R$ 9.120"));
  it("arredonda para o real e não mostra −R$ 0", () => {
    expect(formatBRL(87692.8)).toBe("R$ 87.693");
    expect(formatBRL(-0.4)).toBe("R$ 0");
  });
});
