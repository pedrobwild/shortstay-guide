import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LLMS_TXT_CAMINHOS, gerarLlmsTxt } from "@/lib/llmsTxt";
import { linhasDadosAbertos } from "@/lib/dadosAbertos";
import { SEO_ROUTES } from "@/lib/seo";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";

describe("llms.txt do Radar", () => {
  const texto = gerarLlmsTxt(linhasDadosAbertos(), "2026-10-18");

  it("começa com o nome do site e lista todas as páginas públicas e todos os bairros da base", () => {
    expect(texto.startsWith("# Radar Bewild\n")).toBe(true);
    for (const r of SEO_ROUTES) expect(texto).toContain(`](https://radarbewild.com.br${r.path === "/" ? "/" : r.path})`);
    for (const b of BAIRROS_CURADOS) expect(texto, b.name).toContain(`- [${b.name}](`);
    expect(texto).toContain("Gerado em 18/10/2026.");
  });

  it("cada bairro sai com os números da base (nunca outros), a natureza e os avisos obrigatórios", () => {
    const n = new Intl.NumberFormat("pt-BR");
    const pinheiros = BAIRROS_CURADOS.find((b) => b.name === "Pinheiros")!;
    const mooca = BAIRROS_CURADOS.find((b) => b.name === "Mooca")!;
    expect(texto).toContain(`- [Pinheiros](https://radarbewild.com.br/bairro/pinheiros): ocupação ${n.format(pinheiros.avgOccupancy)}%; diária média R$ ${n.format(pinheiros.dailyAvg)}; quartis R$ ${pinheiros.dailyQuartiles!.map((q) => n.format(q)).join(" / R$ ")}; ${n.format(pinheiros.activeListings!)} anúncios`);
    expect(texto).toMatch(new RegExp(`- \\[Mooca\\][^\\n]*Amostra pequena \\(${mooca.activeListings} anúncios\\)\\.$`, "m"));
    expect(texto).toMatch(/- \[Brooklin\][^\n]*aproximação: Aproximação pelo Itaim Bibi/);
    expect(texto).toMatch(/- \[Vila Olímpia\][^\n]*Sem dado público por bairro: usa os números do distrito do Itaim Bibi\.$/m);
    expect(texto).not.toMatch(/\.\.$/m);
  });

  it("não promete resultado e manda ao orçamento da Bewild com UTM próprio", () => {
    expect(texto).toContain("não garante renda, ocupação nem rentabilidade");
    expect(texto).toContain("https://bewild.com.br/orcamento?utm_source=radar&utm_medium=referral&utm_campaign=radar_bewild&utm_content=llms");
  });

  it("as duas cópias versionadas (/llms.txt e /.well-known/llms.txt) são idênticas", () => {
    const [a, b] = LLMS_TXT_CAMINHOS.map((c) => `public${c}`);
    expect(existsSync(a), a).toBe(true);
    expect(existsSync(b), b).toBe(true);
    expect(readFileSync(a, "utf8")).toBe(readFileSync(b, "utf8"));
  });

  it("a cópia versionada vem do mesmo gerador (só a data de geração muda)", () => {
    const semData = (s: string) => s.replace(/Gerado em \d{2}\/\d{2}\/\d{4}\./, "");
    expect(semData(readFileSync("public/llms.txt", "utf8"))).toBe(semData(texto));
  });
});
