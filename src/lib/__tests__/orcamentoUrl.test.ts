import { describe, expect, it } from "vitest";
import { orcamentoUrl } from "@/lib/orcamento";
import { formatBRL } from "@/lib/numberFormat";

const UTM = "utm_source=radar&utm_medium=referral&utm_campaign=radar_bewild";

describe("pedido de orçamento", () => {
  it("a URL é a oficial com o UTM do local, também nas telas novas", () => {
    expect(orcamentoUrl("projecao")).toBe(`https://bewild.com.br/orcamento?${UTM}&utm_content=projecao`);
    expect(orcamentoUrl("comparar")).toBe(`https://bewild.com.br/orcamento?${UTM}&utm_content=comparar`);
  });

  it("não leva dados da simulação nem nada além do UTM", () => {
    const url = new URL(orcamentoUrl("projecao"));
    expect([...url.searchParams.keys()].sort()).toEqual(["utm_campaign", "utm_content", "utm_medium", "utm_source"]);
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
