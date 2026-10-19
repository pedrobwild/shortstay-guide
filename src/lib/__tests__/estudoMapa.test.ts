import { describe, expect, it } from "vitest";
import { bairrosReserva } from "@/lib/radarBase";
import { GEO_BAIRROS } from "@/data/bairrosGeo";
import { receitaDe } from "@/lib/estudo";
import {
  EIXO_DIARIA, LAT0, LNG0, PX_POR_KM, achadoComparacao, centroSP, contagemClasses, direcaoDaClasse, distanciaKm, latDeY,
  limitesIndicador, linhasGrade, lngDeX, marcasEixo, passoGrade, pontosMapa, posicaoEixo, posicionarRotulos, projetar,
  faixaMaisLarga, raioAmostra, rotuloGrau, textoDirecao, trocarNaComparacao, valorIndicador, vizinhosMaisProximos,
} from "@/lib/estudoMapa";

const base = bairrosReserva();

describe("projeção equirretangular a 23,6° S, 40 px/km", () => {
  it("o centro da projeção cai na origem e a inversa devolve o ponto", () => {
    expect(projetar(LAT0, LNG0)).toEqual({ x: 0, y: 0 });
    const p = projetar(-23.5613, -46.6917);
    expect(latDeY(p.y)).toBeCloseTo(-23.5613, 8);
    expect(lngDeX(p.x)).toBeCloseTo(-46.6917, 8);
  });

  it("um grau de latitude vale 110,57 km e um de longitude, 111,32 × cos(23,6°) km", () => {
    expect(projetar(LAT0 - 1, LNG0).y).toBeCloseTo(110.57 * PX_POR_KM, 6);
    expect(projetar(LAT0, LNG0 + 1).x).toBeCloseTo(111.32 * Math.cos((23.6 * Math.PI) / 180) * PX_POR_KM, 6);
  });

  it("norte para cima e leste para a direita: Santana acima de Jabaquara, Tatuapé à direita de Pinheiros", () => {
    const santana = projetar(GEO_BAIRROS.Santana.lat, GEO_BAIRROS.Santana.lng);
    const jabaquara = projetar(GEO_BAIRROS.Jabaquara.lat, GEO_BAIRROS.Jabaquara.lng);
    expect(santana.y).toBeLessThan(jabaquara.y);
    const tatuape = projetar(GEO_BAIRROS["Tatuapé"].lat, GEO_BAIRROS["Tatuapé"].lng);
    const pinheiros = projetar(GEO_BAIRROS.Pinheiros.lat, GEO_BAIRROS.Pinheiros.lng);
    expect(tatuape.x).toBeGreaterThan(pinheiros.x);
    // Pinheiros–Tatuapé: cerca de 11,8 km em linha reta.
    expect(distanciaKm(pinheiros, tatuape)).toBeGreaterThan(11);
    expect(distanciaKm(pinheiros, tatuape)).toBeLessThan(12.5);
  });
});

describe("grade de latitude e longitude", () => {
  it("linhas múltiplas do passo, sem erro de ponto flutuante", () => {
    expect(linhasGrade(-23.66, -23.49, 0.05)).toEqual([-23.65, -23.6, -23.55, -23.5]);
    expect(linhasGrade(-46.72, -46.65, 0.02)).toEqual([-46.72, -46.7, -46.68, -46.66]);
  });
  it("passo de 0,02° só quando as linhas ficam afastadas na tela", () => {
    expect(passoGrade(4000)).toBe(0.02);
    expect(passoGrade(2000)).toBe(0.05);
  });
  it("rótulos em graus com hemisfério, em pt-BR", () => {
    expect(rotuloGrau(-23.55, "lat")).toBe("23,55° S");
    expect(rotuloGrau(-46.7, "lng")).toBe("46,70° O");
  });
});

describe("círculos: cor por quartil e área pela amostra", () => {
  it("todos os 28 bairros têm posição no mapa", () => {
    const { pontos, semPosicao } = pontosMapa(base, "receita");
    expect(semPosicao).toEqual([]);
    expect(pontos).toHaveLength(28);
  });

  it("área proporcional à amostra: 4× a amostra = 2× o raio", () => {
    expect(raioAmostra(1000, 4000, 20, 1)! / raioAmostra(250, 4000, 20, 1)!).toBeCloseTo(2, 6);
    expect(raioAmostra(null, 4000)).toBeNull();
    expect(raioAmostra(1, 4000, 20, 4)).toBe(4);
  });

  it("aproximações (Brooklin, Vila Olímpia) têm raio fixo e ficam marcadas; o maior círculo é o Itaim Bibi", () => {
    const { pontos, nMax } = pontosMapa(base, "receita", { raioAproximacao: 9 });
    const aprox = pontos.filter((p) => p.aproximacao).map((p) => p.bairro.name).sort();
    expect(aprox).toEqual(["Brooklin", "Vila Olímpia"]);
    expect(pontos.filter((p) => p.aproximacao).every((p) => p.r === 9)).toBe(true);
    expect(nMax).toBe(3880);
    expect(pontos[0].bairro.name).toBe("Itaim Bibi");
  });

  it("limites por quartil saem só dos 26 bairros com dado próprio", () => {
    const limites = limitesIndicador(base, "receita");
    const proprios = base.filter((b) => b.ocupacaoFonte !== "aproximacao").map(receitaDe).sort((a, b) => a - b);
    expect(limites[1]).toBe((proprios[12] + proprios[13]) / 2);
    const contagem = contagemClasses(base, "receita", limites);
    expect(contagem.reduce((s, n) => s + n, 0)).toBe(28);
    // Morumbi (R$ 8.294) está na classe mais alta; Bom Retiro (R$ 3.402), na mais baixa.
    const { pontos } = pontosMapa(base, "receita");
    expect(pontos.find((p) => p.bairro.name === "Morumbi")?.classe).toBe(4);
    expect(pontos.find((p) => p.bairro.name === "Bom Retiro")?.classe).toBe(1);
  });

  it("o valor do indicador é o da base: diária, ocupação e receita = d × 30 × o", () => {
    const pinheiros = base.find((b) => b.name === "Pinheiros")!;
    expect(valorIndicador(pinheiros, "diaria")).toBe(299);
    expect(valorIndicador(pinheiros, "ocupacao")).toBe(63);
    expect(valorIndicador(pinheiros, "receita")).toBe(5651);
  });

  it("a classe mais alta de receita fica a sudoeste do centro", () => {
    const { pontos } = pontosMapa(base, "receita");
    const d = direcaoDaClasse(pontos, 4, centroSP());
    expect(d.direcao).toBe("sudoeste");
    expect(textoDirecao(d.direcao)).toBe("a sudoeste do centro");
    expect(textoDirecao(null)).toBe("perto do centro");
  });
});

describe("rótulos sem sobreposição", () => {
  it("dois rótulos que se cobririam: o de menor prioridade muda de lado ou sai", () => {
    const itens = [
      { id: "a", x: 100, y: 100, r: 5, texto: "Bairro A", lado: "direita" as const, prioridade: 10 },
      { id: "b", x: 104, y: 102, r: 5, texto: "Bairro B", lado: "direita" as const, prioridade: 1 },
    ];
    const r = posicionarRotulos(itens, 12, { x: 0, y: 0, w: 400, h: 400 });
    const a = r.get("a")!, b = r.get("b");
    expect(a).toBeDefined();
    if (b) {
      const sobrepoe = a.caixa.x < b.caixa.x + b.caixa.w && b.caixa.x < a.caixa.x + a.caixa.w && a.caixa.y < b.caixa.y + b.caixa.h && b.caixa.y < a.caixa.y + a.caixa.h;
      expect(sobrepoe).toBe(false);
    }
  });
  it("prioridade ≥ 1000 (bairro selecionado) sempre ganha rótulo", () => {
    const r = posicionarRotulos([{ id: "s", x: 2, y: 2, r: 5, texto: "Selecionado", lado: "esquerda", prioridade: 2000 }], 12, { x: 0, y: 0, w: 20, h: 20 });
    expect(r.has("s")).toBe(true);
  });
});

describe("comparar: achado e eixo das faixas de diária", () => {
  it("quem tem a maior receita e quanto fica acima do menor", () => {
    expect(achadoComparacao([{ nome: "Pinheiros", valor: 5651 }, { nome: "Mooca", valor: 4228 }])).toEqual({
      tipo: "maior", maiores: ["Pinheiros"], valor: 5651, menor: "Mooca", diferenca: 1423,
    });
    expect(achadoComparacao([{ nome: "Brooklin", valor: 6462 }, { nome: "Itaim Bibi", valor: 6462 }])).toEqual({ tipo: "empate", nomes: ["Brooklin", "Itaim Bibi"], valor: 6462 });
    expect(achadoComparacao([])).toEqual({ tipo: "vazio" });
  });
  it("eixo de R$ 0 a 600 com marcas a cada R$ 100; valores além ficam presos na ponta", () => {
    expect(EIXO_DIARIA).toEqual({ min: 0, max: 600, passo: 100 });
    expect(marcasEixo()).toEqual([0, 100, 200, 300, 400, 500, 600]);
    expect(posicaoEixo(300)).toEqual({ pct: 50, fora: false });
    expect(posicaoEixo(900)).toEqual({ pct: 100, fora: true });
  });
  it("vizinhos mais próximos de Pinheiros, sem aproximações", () => {
    const v = vizinhosMaisProximos(base, "Pinheiros", 2).map((b) => b.name);
    expect(v).toHaveLength(2);
    expect(v).not.toContain("Brooklin");
    expect(v).not.toContain("Vila Olímpia");
    expect(v).not.toContain("Pinheiros");
  });
});

describe("comparar: faixa mais larga e troca de vagas", () => {
  it("Mooca tem a faixa central de diária mais larga entre Pinheiros, Brooklin e Mooca (R$ 27 a R$ 268)", () => {
    const sel = ["Pinheiros", "Brooklin", "Mooca"].map((n) => base.find((b) => b.name === n)!);
    const f = faixaMaisLarga(sel);
    expect(f?.bairro.name).toBe("Mooca");
    expect([f?.p25, f?.p75]).toEqual([27, 268]);
    expect(faixaMaisLarga([])).toBeNull();
  });
  it("trocar um bairro de vaga: substitui, troca de lugar se já está em outra vaga, ou entra no fim", () => {
    expect(trocarNaComparacao(["a", "b", "c"], 1, "d")).toEqual(["a", "d", "c"]);
    expect(trocarNaComparacao(["a", "b", "c"], 0, "c")).toEqual(["c", "b", "a"]);
    expect(trocarNaComparacao(["a"], 2, "b")).toEqual(["a", "b"]);
    expect(trocarNaComparacao(["a", "b"], 2, "a")).toEqual(["a", "b"]);
  });
});
