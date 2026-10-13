import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  RESPOSTA_CUSTO_REFORMA, ORCAMENTO_MEDIANO, CONTRATOS_ANALISADOS,
  SELO_REFORMAS, SELO_PROJETOS, SELO_BAIRROS,
  GARANTIA_ANOS, TEXTO_GARANTIA, TEXTO_MULTA_ATRASO,
} from "@/data/provasBewild";
import { FAQ_DATA, TRUST_SIGNALS_DATA } from "@/data/guide-data";
import { FAQ_ITEMS } from "@/components/guide/FAQSection";

const BANIDOS = ["R$ 15k", "R$ 35.000 a R$ 120.000", "+200 studios", "4.9 nota", ">4.9<", "+5 anos no mercado", "Garantia de 1 ano"];
const SELF = "provasBewild.test.ts";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|json)$/.test(f) && !p.endsWith(SELF) ? [p] : [];
  });
}

describe("provas Bewild — fonte única", () => {
  it.each(BANIDOS)("'%s' não aparece em src/", (termo) => {
    const achados = files("src").filter((f) => readFileSync(f, "utf8").includes(termo));
    expect(achados).toEqual([]);
  });

  it("resposta de custo usa 188 contratos e mediana R$ 71.850", () => {
    expect(CONTRATOS_ANALISADOS).toBe(188);
    expect(ORCAMENTO_MEDIANO).toBe(71850);
    expect(RESPOSTA_CUSTO_REFORMA).toContain("R$ 71.850");
    expect(RESPOSTA_CUSTO_REFORMA).toContain("R$ 55 mil");
  });

  it("as duas FAQs dão a mesma resposta de custo de reforma", () => {
    const guia = FAQ_DATA.find((f) => f.q.includes("Quanto custa começar"))!;
    const faq = FAQ_ITEMS.find((f) => f.q.includes("reforma"))!;
    expect(guia.a).toBe(faq.a);
  });

  it("selos de confiança usam os números oficiais", () => {
    const labels = TRUST_SIGNALS_DATA.map((s) => s.label);
    expect(labels).toEqual([SELO_REFORMAS, SELO_PROJETOS, "Operação própria", SELO_BAIRROS]);
    expect(SELO_BAIRROS).toBe("27 bairros com obra entregue");
  });

  it("garantia e atraso usam a fonte de verdade da Bewild", () => {
    expect(GARANTIA_ANOS).toBe(5);
    expect(TEXTO_GARANTIA).toBe("5 anos de garantia");
    expect(TEXTO_MULTA_ATRASO).toBe("multa por dia de atraso prevista em contrato");
    const secao = readFileSync("src/components/guide/ProjetoSection.tsx", "utf8");
    expect(secao).toContain("TEXTO_GARANTIA");
    expect(secao).toContain("TEXTO_MULTA_ATRASO");
  });
});
