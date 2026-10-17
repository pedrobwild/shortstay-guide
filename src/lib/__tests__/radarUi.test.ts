import { describe, expect, it } from "vitest";
import { BAIRROS_CURADOS, SAO_PAULO_REFERENCIA, receitaMensalReferencia } from "@/data/bairrosCurados";
import { GEO_BAIRROS } from "@/data/bairrosGeo";
import { bairrosReserva } from "@/lib/radarBase";
import { aplicarAjuste } from "@/lib/bairroAjustes";
import {
  FILTROS_INICIAIS, RECEITA_REFERENCIA_SP, ajusteManual, corEscalaReceita, extremosLegendaReceita, fimEscalaQuartis,
  fonteCurtaBairro, lerNumeroDigitado, naturezaBairro, notaEstimativas, ordenarPorReceita, passaFiltros,
  passoEscalaReceita, posicoesEsquema, tamanhoMarcador, temFiltroAtivo, textoSemQuartis, textosFontes, avisoAmostraBairro,
} from "@/lib/radarUi";

const ESTIMATIVAS = ["Brooklin", "Consolação", "Vila Olímpia"];
const reserva = bairrosReserva();
const porNome = (nome: string) => reserva.find((b) => b.name === nome)!;

describe("natureza e fonte de cada bairro na nova interface", () => {
  it("só Brooklin, Consolação e Vila Olímpia são estimativa Bewild", () => {
    const estimativas = BAIRROS_CURADOS.filter((b) => naturezaBairro(b) === "estimativa").map((b) => b.name);
    expect(estimativas.sort()).toEqual([...ESTIMATIVAS].sort());
  });

  it("estimativa nunca recebe GuestFavorites no carimbo de fonte", () => {
    for (const nome of ESTIMATIVAS) {
      expect(fonteCurtaBairro(porNome(nome))).toBe("Sem fonte pública atualizada");
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
    // República (R$ 3.837) e Itaim Bibi (R$ 6.354); as estimativas ficam de fora.
    expect(extremosLegendaReceita(BAIRROS_CURADOS)).toEqual([3800, 6400]);
  });

  it("marcador cresce com a amostra; estimativa tem tamanho fixo", () => {
    expect(tamanhoMarcador(porNome("Brooklin"))).toBe(18);
    expect(tamanhoMarcador(porNome("Itaim Bibi"))).toBeGreaterThan(tamanhoMarcador(porNome("Mooca")));
  });

  it("ordena por receita de referência, da maior para a menor", () => {
    const ordem = ordenarPorReceita(BAIRROS_CURADOS);
    expect(ordem[0].bairro.name).toBe("Vila Olímpia");
    expect(ordem[ordem.length - 1].bairro.name).toBe("República");
    for (let i = 1; i < ordem.length; i++) expect(ordem[i - 1].receita).toBeGreaterThanOrEqual(ordem[i].receita);
    expect(ordem.find((o) => o.bairro.name === "Pinheiros")?.receita).toBe(5580);
  });
});

describe("filtros do mapa", () => {
  it("sem filtro, passam os 13 bairros", () => {
    expect(temFiltroAtivo(FILTROS_INICIAIS)).toBe(false);
    expect(BAIRROS_CURADOS.filter((b) => passaFiltros(b, FILTROS_INICIAIS))).toHaveLength(13);
  });

  it("busca ignora acento e maiúscula", () => {
    const f = { ...FILTROS_INICIAIS, busca: "OLIMPIA" };
    expect(temFiltroAtivo(f)).toBe(true);
    expect(BAIRROS_CURADOS.filter((b) => passaFiltros(b, f)).map((b) => b.name)).toEqual(["Vila Olímpia"]);
  });

  it("“só dado observado” tira as três estimativas", () => {
    const f = { ...FILTROS_INICIAIS, fonte: "observados" as const };
    const nomes = BAIRROS_CURADOS.filter((b) => passaFiltros(b, f)).map((b) => b.name);
    expect(nomes).toHaveLength(10);
    for (const nome of ESTIMATIVAS) expect(nomes).not.toContain(nome);
  });

  it("receita mínima combina com a fonte", () => {
    const f = { ...FILTROS_INICIAIS, fonte: "observados" as const, receitaMin: 5500 };
    expect(BAIRROS_CURADOS.filter((b) => passaFiltros(b, f)).map((b) => b.name).sort()).toEqual(["Itaim Bibi", "Jardim Paulista", "Pinheiros"]);
  });
});

describe("textos montados a partir da base", () => {
  it("nota das estimativas conta os bairros sem fonte pública", () => {
    expect(notaEstimativas(BAIRROS_CURADOS)).toBe("As três estimativas Bewild ficam acima da média e não têm fonte pública atualizada — leia com cautela.");
    expect(notaEstimativas(BAIRROS_CURADOS.filter((b) => naturezaBairro(b) === "observado"))).toBeNull();
  });

  it("Fontes e atualização citam coleta, períodos e as estimativas certas", () => {
    const t = textosFontes(reserva);
    expect(t.observado).toContain("Coleta de 13/10/2026");
    expect(t.observado).toContain("período jan–set/2026 (Liberdade e República: jan–jul/2026)");
    for (const nome of ESTIMATIVAS) expect(t.observado).not.toContain(nome);
    expect(t.estimativa).toContain("Brooklin, Consolação e Vila Olímpia usam valores Bewild anteriores, sem fonte pública atualizada.");
    expect(t.hipotese).toContain("não retorno garantido");
  });

  it("sem quartis, a estimativa mostra a faixa Bewild", () => {
    expect(textoSemQuartis(porNome("Brooklin"))).toBe("Sem quartis publicados. Estimativa Bewild de R$ 290 a R$ 430 por diária.");
  });

  it("escala comum dos quartis começa em R$ 450 e arredonda para R$ 50", () => {
    expect(fimEscalaQuartis(BAIRROS_CURADOS)).toBe(450);
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
    expect(pos.size).toBe(13);
    for (const { x, y } of pos.values()) {
      expect(x).toBeGreaterThanOrEqual(8);
      expect(x).toBeLessThanOrEqual(92);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(92);
    }
    expect(pos.get("Mooca")!.x).toBeCloseTo(92); // o bairro mais a leste
    expect(pos.get("Brooklin")!.y).toBeCloseTo(92); // o mais ao sul
  });

  it("bairro sem posição conhecida fica de fora", () => {
    expect(posicoesEsquema(["Pinheiros", "Bairro inexistente"]).has("Bairro inexistente")).toBe(false);
    expect(Object.keys(GEO_BAIRROS).sort()).toEqual(BAIRROS_CURADOS.map((b) => b.name).sort());
  });
});
