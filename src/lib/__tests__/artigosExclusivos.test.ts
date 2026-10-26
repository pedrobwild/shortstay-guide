import { describe, expect, it } from "vitest";
import { ARTIGOS_EXCLUSIVOS, artigoExclusivoPorSlug } from "@/data/artigosExclusivos";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import {
  bairroDaBase, bairrosObservados, cenario, distanciaMediaMediana, faixaOcupacao, posicaoReceita,
  rankingDistanciaMediana, rankingReceita, receitaCom, receitaSaoPaulo,
} from "@/lib/artigosExclusivos";
import { usaEstudo } from "@/components/EscopoVisual";
import { isPrivatePath } from "@/lib/seo";

/**
 * Os artigos da área exclusiva calculam os números a partir da base, mas o texto afirma
 * coisas que dependem deles ("quarta maior receita", "ninguém passa de 65%"). Se uma
 * coleta nova mudar algum destes fatos, o teste falha e o texto precisa de revisão.
 */
describe("artigos exclusivos: afirmações sobre a base de 18/10/2026", () => {
  const pin = bairroDaBase("Pinheiros");

  it("usa os 26 bairros com dado próprio e deixa a aproximação de fora", () => {
    expect(bairrosObservados()).toHaveLength(26);
    expect(bairrosObservados().map((b) => b.name)).not.toContain("Brooklin");
    expect(bairrosObservados().map((b) => b.name)).not.toContain("Vila Olímpia");
  });

  it("Pinheiros: quarta maior receita, atrás de Morumbi, Itaim Bibi e Jardim Paulista, 18% acima de SP", () => {
    expect(posicaoReceita("Pinheiros")).toBe(4);
    expect(rankingReceita().slice(0, 3).map((l) => l.bairro.name)).toEqual(["Morumbi", "Itaim Bibi", "Jardim Paulista"]);
    expect(receitaMensalReferencia(pin)).toBe(5651);
    expect(receitaSaoPaulo()).toBe(4770);
    expect(Math.round((5651 / 4770 - 1) * 100)).toBe(18);
  });

  it("Pinheiros: os bairros de diária mais alta ocupam menos, e Jardim Paulista ocupa 1 ponto a menos", () => {
    const maisCaros = bairrosObservados().filter((b) => b.dailyAvg > pin.dailyAvg);
    expect(maisCaros.map((b) => b.name).sort()).toEqual(["Itaim Bibi", "Jardim Paulista", "Morumbi"]);
    for (const b of maisCaros) expect(b.avgOccupancy).toBeLessThan(pin.avgOccupancy);
    expect(pin.avgOccupancy - bairroDaBase("Jardim Paulista").avgOccupancy).toBe(1);
    // "a 2 pontos do maior valor": o texto usa "pontos" no plural.
    expect(faixaOcupacao().max.avgOccupancy - pin.avgOccupancy).toBeGreaterThan(1);
  });

  it("Pinheiros: média encosta nos 25% mais caros e a distância média−mediana está entre as cinco maiores", () => {
    expect(pin.dailyQuartiles![2] - pin.dailyAvg).toBeLessThanOrEqual(5);
    expect(rankingDistanciaMediana().slice(0, 5).map((b) => b.name)).toContain("Pinheiros");
    expect(distanciaMediaMediana(pin)).toBe(67);
  });

  it("Pinheiros: o exemplo pela média é o do simulador (R$ 2.164) e a mediana fica abaixo", () => {
    expect(cenario(pin.dailyAvg, pin.avgOccupancy).liquido).toBe(2164);
    expect(cenario(pin.dailyQuartiles![1], pin.avgOccupancy).liquido).toBe(1456);
  });

  it("Brooklin: aproximação pelo Itaim Bibi, estimativa antiga acima de qualquer bairro medido", () => {
    const bro = bairroDaBase("Brooklin");
    const itaim = bairroDaBase("Itaim Bibi");
    expect(bro.ocupacaoFonte).toBe("aproximacao");
    expect([bro.avgOccupancy, bro.dailyAvg, bro.dailyQuartiles]).toEqual([itaim.avgOccupancy, itaim.dailyAvg, itaim.dailyQuartiles]);
    const { min, max } = faixaOcupacao();
    expect([min.avgOccupancy, max.avgOccupancy, max.name]).toEqual([54, 65, "Brás"]);
    expect(bro.referenciaBewild!.avgOccupancy).toBeGreaterThan(max.avgOccupancy);
    expect(receitaCom(bro.referenciaBewild!.dailyAvg, bro.referenciaBewild!.avgOccupancy)).toBe(8100);
    expect(rankingDistanciaMediana()[1].name).toBe("Itaim Bibi");
  });

  it("Brooklin: a faixa da aproximação contém os bairros próximos usados como régua", () => {
    const bro = bairroDaBase("Brooklin");
    const [q25, , q75] = bro.dailyQuartiles!;
    const piso = receitaCom(q25, bro.avgOccupancy), teto = receitaCom(q75, bro.avgOccupancy);
    for (const nome of ["Moema", "Santo Amaro", "Campo Belo"]) {
      const r = receitaMensalReferencia(bairroDaBase(nome));
      expect(r).toBeGreaterThan(piso);
      expect(r).toBeLessThan(teto);
    }
  });
});

describe("área exclusiva", () => {
  it("é privada (fora de indexação e medição) mas usa o visual de leitura", () => {
    for (const a of ARTIGOS_EXCLUSIVOS) {
      expect(isPrivatePath(`/area-exclusiva/${a.slug}`)).toBe(true);
      expect(usaEstudo(`/area-exclusiva/${a.slug}`)).toBe(true);
    }
    expect(isPrivatePath("/area-exclusiva")).toBe(true);
    expect(usaEstudo("/admin")).toBe(false);
  });

  it("encontra só os artigos cadastrados", () => {
    expect(artigoExclusivoPorSlug("pinheiros")?.bairro).toBe("Pinheiros");
    expect(artigoExclusivoPorSlug("brooklin")?.bairro).toBe("Brooklin");
    expect(artigoExclusivoPorSlug("moema")).toBeUndefined();
  });
});
