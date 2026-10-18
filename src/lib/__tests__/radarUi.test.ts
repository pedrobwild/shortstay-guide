import { describe, expect, it } from "vitest";
import { BAIRROS_CURADOS, SAO_PAULO_REFERENCIA, receitaMensalReferencia } from "@/data/bairrosCurados";
import { GEO_BAIRROS } from "@/data/bairrosGeo";
import { bairrosReserva } from "@/lib/radarBase";
import { aplicarAjuste } from "@/lib/bairroAjustes";
import {
  BAIRROS_SEM_ARTIGO, FILTROS_INICIAIS, RECEITA_REFERENCIA_SP, ajusteManual, artigoBairro, bairrosNaFrase, corEscalaReceita, descricaoNatureza, diferencasAteOMaior,
  estiloMarcador, extremosLegendaReceita,
  fimEscalaQuartis, fonteCurtaBairro, lerNumeroDigitado, marcaNatureza, naturezaBairro, notaEstimativas, ordenarPorReceita, passaFiltros,
  passoEscalaReceita, posicoesEsquema, tamanhoMarcador, temFiltroAtivo, textoSemQuartis, textosFontes, avisoAmostraBairro,
} from "@/lib/radarUi";

// Desde 18/10/2026 a base não tem estimativa Bewild como número principal (a Consolação passou a dado público).
const ESTIMATIVAS: string[] = [];
const APROXIMACOES = ["Brooklin", "Vila Olímpia"];
const SEM_DADO_PROPRIO = [...APROXIMACOES, ...ESTIMATIVAS];
const reserva = bairrosReserva();
const porNome = (nome: string) => reserva.find((b) => b.name === nome)!;
/** Cenário com estimativa Bewild como número principal (como a Consolação era até 17/10/2026): as regras de exibição de estimativa continuam cobertas. */
const estimada = {
  ...porNome("Consolação"), name: "Consolação", dailyMin: 260, dailyMax: 390, dailyAvg: 325, avgOccupancy: 63, ocupacaoFonte: "bewild" as const,
  dailyQuartiles: null, activeListings: null, period: null, sourceUrl: null, coletadoEm: "2026-10-13", fonteNome: "Estimativa Bewild", fonteTipo: "estimativa", amostraN: null, estimativa: true,
};
const reservaComEstimativa = reserva.map((b) => (b.name === "Consolação" ? estimada : b));

describe("natureza e fonte de cada bairro na nova interface", () => {
  it("Consolação é dado observado desde 18/10/2026; Brooklin e Vila Olímpia, aproximação pelo Itaim Bibi", () => {
    const por = (n: string) => BAIRROS_CURADOS.filter((b) => naturezaBairro(b) === n).map((b) => b.name).sort();
    expect(por("estimativa")).toEqual(ESTIMATIVAS);
    expect(por("aproximacao")).toEqual(APROXIMACOES);
    expect(marcaNatureza(porNome("Brooklin"))).toBe("aproximação");
    expect(marcaNatureza(porNome("Consolação"))).toBeNull();
    expect(marcaNatureza(estimada)).toBe("estimativa");
    expect(marcaNatureza(porNome("Pinheiros"))).toBeNull();
    expect(descricaoNatureza(porNome("Vila Olímpia"))).toBe(", aproximação pelo Itaim Bibi");
  });

  it("estimativa nunca recebe GuestFavorites no carimbo; a aproximação diz de onde vem", () => {
    expect(fonteCurtaBairro(estimada)).toBe("Sem fonte pública atualizada");
    expect(fonteCurtaBairro(porNome("Consolação"))).toBe("GuestFavorites · jan–set/2026 · coleta 18/10/2026");
    for (const nome of APROXIMACOES) {
      expect(fonteCurtaBairro(porNome(nome))).toBe("GuestFavorites (aproximação pelo Itaim Bibi) · jan–set/2026 · coleta 13/10/2026");
    }
  });

  it("dado observado mostra fonte, período e data da coleta", () => {
    expect(fonteCurtaBairro(porNome("Pinheiros"))).toBe("GuestFavorites · jan–set/2026 · coleta 13/10/2026");
    expect(fonteCurtaBairro(porNome("Liberdade"))).toBe("GuestFavorites · jan–jul/2026 · coleta 13/10/2026");
  });

  it("ajuste manual do admin sobre bairro observado é sinalizado como ajuste", () => {
    const ajustado = aplicarAjuste(porNome("Pinheiros"), { bairro: "Pinheiros", diaria: 320, ocupacao: 64, fonte: "Ajuste", updated_at: "2026-10-14" });
    expect(naturezaBairro(ajustado)).toBe("estimativa");
    expect(ajusteManual(ajustado)).toBe(true);
    expect(fonteCurtaBairro(ajustado)).toBe("Ajuste manual da Bewild");
    expect(ajusteManual(porNome("Brooklin"))).toBe(false);
    const aproxAjustada = aplicarAjuste(porNome("Vila Olímpia"), { bairro: "Vila Olímpia", diaria: 380, ocupacao: 70, fonte: "Ajuste" });
    expect(ajusteManual(aproxAjustada)).toBe(true);
    expect(ajusteManual(estimada)).toBe(false);
  });

  it("Mooca sempre traz o aviso de amostra pequena", () => {
    expect(avisoAmostraBairro(porNome("Mooca"))).toBe("amostra pequena (85 anúncios)");
    expect(avisoAmostraBairro(porNome("Pinheiros"))).toBeNull();
    expect(avisoAmostraBairro(porNome("Brooklin"))).toBeNull();
  });
});

describe("receita de referência e escala do mapa", () => {
  it("a referência de São Paulo é diária × 30 × ocupação da mesma coleta", () => {
    expect(RECEITA_REFERENCIA_SP).toBe(receitaMensalReferencia(SAO_PAULO_REFERENCIA));
    expect(RECEITA_REFERENCIA_SP).toBe(4788);
  });

  it("classifica a receita nos cinco passos da legenda", () => {
    expect(passoEscalaReceita(3837)).toBe(1);
    expect(passoEscalaReceita(4200)).toBe(2);
    expect(passoEscalaReceita(4600)).toBe(3);
    expect(passoEscalaReceita(5580)).toBe(4);
    expect(passoEscalaReceita(5933)).toBe(5);
    expect(corEscalaReceita(5580)).toBe("hsl(var(--escala-4))");
  });

  it("os extremos da legenda usam só dado observado", () => {
    // Bom Retiro (R$ 3.402) e Morumbi (R$ 8.294); estimativas e aproximações ficam de fora.
    expect(extremosLegendaReceita(BAIRROS_CURADOS)).toEqual([3400, 8300]);
  });

  it("marcador cresce com a amostra; sem amostra própria tem tamanho fixo", () => {
    expect(tamanhoMarcador(porNome("Brooklin"))).toBe(18);
    expect(tamanhoMarcador(estimada)).toBe(18);
    expect(tamanhoMarcador(porNome("Itaim Bibi"))).toBeGreaterThan(tamanhoMarcador(porNome("Mooca")));
  });

  it("contorno do marcador: azul tracejado na aproximação, âmbar na estimativa, cor da escala no observado", () => {
    expect(estiloMarcador(porNome("Vila Olímpia")).border).toBe("2px dashed hsl(var(--accent-text))");
    expect(estiloMarcador(estimada).border).toBe("2px dashed hsl(var(--estimate))");
    expect(estiloMarcador(porNome("Pinheiros")).background).toBe("hsl(var(--escala-4))");
    expect(estiloMarcador(porNome("Brooklin")).background).toBe("hsl(var(--card) / 0.9)");
  });

  it("ordena por receita de referência, da maior para a menor", () => {
    const ordem = ordenarPorReceita(BAIRROS_CURADOS);
    // Morumbi na frente; Brooklin e Vila Olímpia usam os números do Itaim Bibi: empatam e o desempate é pelo nome.
    expect(ordem.slice(0, 4).map((o) => [o.bairro.name, o.receita])).toEqual([["Morumbi", 8294], ["Brooklin", 6354], ["Itaim Bibi", 6354], ["Vila Olímpia", 6354]]);
    expect(ordem[ordem.length - 1].bairro.name).toBe("Bom Retiro"); // R$ 189 × 30 × 60% = R$ 3.402
    for (let i = 1; i < ordem.length; i++) expect(ordem[i - 1].receita).toBeGreaterThanOrEqual(ordem[i].receita);
    expect(ordem.find((o) => o.bairro.name === "Pinheiros")?.receita).toBe(5580);
  });
});

describe("filtros do mapa", () => {
  it("sem filtro, passam os 28 bairros", () => {
    expect(temFiltroAtivo(FILTROS_INICIAIS)).toBe(false);
    expect(BAIRROS_CURADOS.filter((b) => passaFiltros(b, FILTROS_INICIAIS))).toHaveLength(28);
  });

  it("busca ignora acento e maiúscula", () => {
    const f = { ...FILTROS_INICIAIS, busca: "OLIMPIA" };
    expect(temFiltroAtivo(f)).toBe(true);
    expect(BAIRROS_CURADOS.filter((b) => passaFiltros(b, f)).map((b) => b.name)).toEqual(["Vila Olímpia"]);
  });

  it("“só dado observado” tira a estimativa e as aproximações", () => {
    const f = { ...FILTROS_INICIAIS, fonte: "observados" as const };
    const nomes = BAIRROS_CURADOS.filter((b) => passaFiltros(b, f)).map((b) => b.name);
    expect(nomes).toHaveLength(26);
    for (const nome of SEM_DADO_PROPRIO) expect(nomes).not.toContain(nome);
    expect(reservaComEstimativa.filter((b) => passaFiltros(b, f)).map((b) => b.name)).not.toContain("Consolação");
  });

  it("receita mínima combina com a fonte", () => {
    const f = { ...FILTROS_INICIAIS, fonte: "observados" as const, receitaMin: 5500 };
    expect(BAIRROS_CURADOS.filter((b) => passaFiltros(b, f)).map((b) => b.name).sort()).toEqual(["Itaim Bibi", "Jardim Paulista", "Morumbi", "Pinheiros"]);
  });
});

describe("textos montados a partir da base", () => {
  it("nota dos números sem dado próprio cita aproximações e, quando houver, estimativa", () => {
    expect(notaEstimativas(BAIRROS_CURADOS)).toBe("Brooklin e Vila Olímpia usam a aproximação pelo Itaim Bibi (sem dado público por bairro).");
    expect(notaEstimativas(reservaComEstimativa)).toBe(
      "Brooklin e Vila Olímpia usam a aproximação pelo Itaim Bibi (sem dado público por bairro). A estimativa Bewild fica acima da média e não tem fonte pública atualizada — leia com cautela.",
    );
    expect(notaEstimativas(BAIRROS_CURADOS.filter((b) => naturezaBairro(b) === "observado"))).toBeNull();
  });

  it("Fontes e atualização citam coleta, períodos, aproximações e a estimativa certa", () => {
    const t = textosFontes(reserva);
    expect(t.observado).toContain("Coletas de 13/10/2026 e 18/10/2026");
    expect(t.observado).toContain("período jan–set/2026 (Liberdade e República: jan–jul/2026)");
    for (const nome of SEM_DADO_PROPRIO) expect(t.observado).not.toContain(nome);
    expect(t.aproximacao).toBe("Brooklin e Vila Olímpia não têm dado público por bairro: usam os números do Itaim Bibi, mesma coleta da GuestFavorites.");
    expect(t.estimativa).not.toContain("Consolação");
    expect(t.estimativa).toContain("Em Brooklin e Vila Olímpia, a estimativa Bewild anterior aparece só como referência extra, fora das contas.");
    expect(textosFontes(reservaComEstimativa).estimativa).toContain("Consolação usa valores Bewild anteriores, sem fonte pública atualizada.");
    expect(t.hipotese).toContain("não retorno garantido");
  });

  it("sem quartis, a estimativa mostra a faixa Bewild", () => {
    expect(textoSemQuartis(estimada)).toBe("Sem quartis publicados. Estimativa Bewild de R$ 260 a R$ 390 por diária.");
  });

  it("escala comum dos quartis começa em R$ 450 e arredonda para R$ 50 (Morumbi, P75 R$ 574 → R$ 600)", () => {
    expect(fimEscalaQuartis(BAIRROS_CURADOS)).toBe(600);
    expect(fimEscalaQuartis([{ dailyQuartiles: [100, 200, 471] }])).toBe(500);
    expect(fimEscalaQuartis([{ dailyQuartiles: null }])).toBe(450);
  });
});

describe("entrada de números em português", () => {
  it.each([
    ["1.500", 1500], ["6,5", 6.5], ["R$ 120", 120], ["18%", 18], ["1.234.567", 1234567], ["R$ 1.234,56", 1234.56], ["12.5", 12.5],
  ])("lê %s como %d", (texto, esperado) => expect(lerNumeroDigitado(texto)).toBe(esperado));

  it("sem número, devolve nulo", () => {
    expect(lerNumeroDigitado("")).toBeNull();
    expect(lerNumeroDigitado("abc")).toBeNull();
  });
});

describe("mapa esquemático da home", () => {
  it("todos os bairros da base têm posição e ficam dentro da margem", () => {
    const pos = posicoesEsquema(BAIRROS_CURADOS.map((b) => b.name));
    expect(pos.size).toBe(28);
    for (const { x, y } of pos.values()) {
      expect(x).toBeGreaterThanOrEqual(8);
      expect(x).toBeLessThanOrEqual(92);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(92);
    }
    expect(pos.get("Tatuapé")!.x).toBeCloseTo(92); // o bairro mais a leste
    expect(pos.get("Santo Amaro")!.y).toBeCloseTo(92); // o mais ao sul
    expect(pos.get("Santana")!.y).toBeCloseTo(8); // o mais ao norte
  });

  it("bairro sem posição conhecida fica de fora", () => {
    expect(posicoesEsquema(["Pinheiros", "Bairro inexistente"]).has("Bairro inexistente")).toBe(false);
    expect(Object.keys(GEO_BAIRROS).sort()).toEqual(BAIRROS_CURADOS.map((b) => b.name).sort());
  });
});

describe("diferença até o maior valor na comparação", () => {
  const linha = (nomes: string[], valor: (b: ReturnType<typeof porNome>) => number | null) => diferencasAteOMaior(nomes.map((n) => ({ nome: n, valor: valor(porNome(n)) })));

  it("mostra quanto cada bairro fica abaixo do maior, com os números da base", () => {
    expect(linha(["Pinheiros", "Itaim Bibi", "Bela Vista"], (b) => b.dailyAvg)).toEqual([
      { maiores: ["Itaim Bibi"], diferenca: 59 }, null, { maiores: ["Itaim Bibi"], diferenca: 122 },
    ]);
    // Ocupação em pontos percentuais: 64% (Bela Vista) − 62% (Pinheiros).
    expect(linha(["Pinheiros", "Bela Vista"], (b) => b.avgOccupancy)).toEqual([{ maiores: ["Bela Vista"], diferenca: 2 }, null]);
    // Receita de referência: R$ 6.354 (Itaim Bibi) − R$ 5.580 (Pinheiros).
    expect(linha(["Pinheiros", "Itaim Bibi"], receitaMensalReferencia)).toEqual([{ maiores: ["Itaim Bibi"], diferenca: 774 }, null]);
  });

  it("empate no maior valor junta os nomes; empate geral não tem diferença", () => {
    // Brooklin usa os números do Itaim Bibi (aproximação): os dois empatam na diária.
    expect(linha(["Pinheiros", "Itaim Bibi", "Brooklin"], (b) => b.dailyAvg)[0]).toEqual({ maiores: ["Itaim Bibi", "Brooklin"], diferenca: 59 });
    expect(linha(["Itaim Bibi", "Brooklin"], (b) => b.dailyAvg)).toEqual([null, null]);
  });

  it("sem valor (anúncios da aproximação) não entra na conta; com menos de dois valores não há diferença", () => {
    expect(linha(["Pinheiros", "Itaim Bibi", "Brooklin"], (b) => b.activeListings)).toEqual([{ maiores: ["Itaim Bibi"], diferenca: 1460 }, null, null]);
    expect(linha(["Pinheiros", "Brooklin"], (b) => b.activeListings)).toEqual([null, null]);
    expect(linha(["Pinheiros"], (b) => b.dailyAvg)).toEqual([null]);
  });

  it("usa os números como aparecem na tela (inteiros)", () => {
    expect(diferencasAteOMaior([{ nome: "A", valor: 61.6 }, { nome: "B", valor: 59.4 }])).toEqual([null, { maiores: ["A"], diferenca: 3 }]);
  });

  it("escreve o nome do bairro com o artigo certo e a natureza do dado", () => {
    const marca = (nome: string) => marcaNatureza(reservaComEstimativa.find((b) => b.name === nome)!);
    expect(bairrosNaFrase(["Itaim Bibi"], "de")).toBe("do Itaim Bibi");
    expect(bairrosNaFrase(["Mooca"], "de")).toBe("da Mooca");
    expect(bairrosNaFrase(["Pinheiros"], "de")).toBe("de Pinheiros");
    expect(bairrosNaFrase(["Itaim Bibi"], "que")).toBe("que o Itaim Bibi");
    expect(bairrosNaFrase(["Pinheiros"], "que")).toBe("que Pinheiros");
    expect(bairrosNaFrase(["Itaim Bibi", "Brooklin"], "de", marca)).toBe("do Itaim Bibi e do Brooklin (aproximação)");
    expect(bairrosNaFrase(["Consolação"], "de", marca)).toBe("da Consolação (estimativa)");
    expect(bairrosNaFrase(["Itaim Bibi", "Brooklin"], null, marca)).toBe("Itaim Bibi e Brooklin (aproximação)");
  });

  it("todo bairro da base tem o artigo definido (com artigo ou na lista sem artigo)", () => {
    const semArtigo: readonly string[] = BAIRROS_SEM_ARTIGO;
    for (const b of BAIRROS_CURADOS) expect(artigoBairro(b.name) !== null || semArtigo.includes(b.name), b.name).toBe(true);
    for (const nome of semArtigo) expect(artigoBairro(nome), nome).toBeNull();
  });
});
