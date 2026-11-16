import { describe, expect, it } from "vitest";
import {
  edicaoDeReferencia, eventosFuturos, lerAcrescimo, noitesDoEvento, periodoDoEvento, receitaDasNoites, separarEfeitos,
  type EfeitoEvento, type EventoRadar,
} from "@/lib/eventosRadar";

const ev = (id: string, nome: string, inicio: string, fim: string, extra: Partial<EventoRadar> = {}): EventoRadar => ({
  id, nome, categoria: "festival", local: "Autódromo de Interlagos", inicio, fim, data_confirmada: true, fonte_titulo: "Fonte", fonte_url: "https://exemplo.com", ...extra,
});
const lolla26 = ev("a", "Lollapalooza Brasil", "2026-03-20", "2026-03-22");
const lolla27 = ev("b", "Lollapalooza Brasil", "2027-03-19", "2027-03-21");
const bts = ev("c", "BTS no MorumBIS", "2026-10-28", "2026-10-31", { categoria: "show_estadio", local: "Estádio do MorumBIS" });
const u2 = ev("d", "U2 no MorumBIS", "2027-03-10", "2027-03-12", { categoria: "show_estadio", local: "Estádio do MorumBIS" });
const town = ev("e", "The Town", "2027-09-04", "2027-09-12");
const todos = [lolla26, lolla27, bts, u2, town];

describe("eventos do Radar", () => {
  it("conta as noites com as duas pontas e escreve o período em pt-BR", () => {
    expect(noitesDoEvento(lolla27)).toBe(3);
    expect(noitesDoEvento(town)).toBe(9);
    expect(noitesDoEvento({ inicio: "2027-03-20", fim: "2027-03-20" })).toBe(1);
    expect(periodoDoEvento(lolla27)).toBe("19 a 21/03/2027");
    expect(periodoDoEvento({ inicio: "2027-02-28", fim: "2027-03-02" })).toBe("28/02 a 02/03/2027");
    expect(periodoDoEvento({ inicio: "2027-03-20", fim: "2027-03-20" })).toBe("20/03/2027");
  });

  it("lista só o que ainda não terminou, em ordem de data", () => {
    expect(eventosFuturos(todos, "2026-11-16").map((e) => e.id)).toEqual(["d", "b", "e"]);
    expect(eventosFuturos(todos, "2027-03-21").map((e) => e.id)).toEqual(["b", "e"]);
  });

  it("a referência é a edição anterior do mesmo evento; sem ela, o mesmo tipo no mesmo local", () => {
    const comEfeito = new Set(["a", "c"]);
    expect(edicaoDeReferencia(lolla27, todos, comEfeito)).toEqual({ evento: lolla26, tipo: "mesma" });
    expect(edicaoDeReferencia(u2, todos, comEfeito)).toEqual({ evento: bts, tipo: "mesmo_local" });
  });

  it("não inventa referência: outro festival no mesmo autódromo não serve para quem tem nome próprio sem edição medida", () => {
    // The Town é festival em Interlagos, como o Lollapalooza; a regra aceita mesmo tipo e mesmo local.
    expect(edicaoDeReferencia(town, todos, new Set(["a", "c"]))?.tipo).toBe("mesmo_local");
    // Sem efeito gravado, não há referência.
    expect(edicaoDeReferencia(town, todos, new Set())).toBeNull();
    // Edição futura nunca é referência.
    expect(edicaoDeReferencia(lolla26, todos, new Set(["b"]))).toBeNull();
  });

  it("separa efeito medido (p < 1%) de sinal fraco (p < 5%) e ignora queda e p ausente", () => {
    const f = (bairro: string, efeito: number, p: number | null): EfeitoEvento => ({ evento_id: "a", bairro, efeito_diaria_pct: efeito, p_placebo: p, noites: 3 });
    const r = separarEfeitos([f("Moema", 8.1, 0.02), f("Campo Belo", 11.2, 0.0068), f("Mooca", -2, 0.9), f("Sé", 5, null), f("Lapa", 1, 0.4), f("Pinheiros", 20, 0.003)]);
    expect(r.medidos.map((e) => e.bairro)).toEqual(["Pinheiros", "Campo Belo"]);
    expect(r.fracos.map((e) => e.bairro)).toEqual(["Moema"]);
  });

  it("calcula a receita das noites com e sem o acréscimo", () => {
    const r = receitaDasNoites(233, 3, 11);
    expect(r.sem).toBe(699);
    expect(Math.round(r.com)).toBe(776);
    expect(Math.round(r.diferenca)).toBe(77);
    expect(Math.round(r.diariaComAcrescimo)).toBe(259);
    expect(receitaDasNoites(233, 3, 0).diferenca).toBe(0);
    expect(receitaDasNoites(-5, -2, 10)).toEqual({ sem: 0, com: 0, diferenca: 0, diariaComAcrescimo: 0 });
  });

  it("lê o acréscimo digitado com vírgula e recusa texto inválido ou fora do limite", () => {
    expect(lerAcrescimo("11")).toBe(11);
    expect(lerAcrescimo(" 11,5 ")).toBe(11.5);
    expect(lerAcrescimo("-10")).toBe(-10);
    expect(lerAcrescimo("")).toBeNull();
    expect(lerAcrescimo("abc")).toBeNull();
    expect(lerAcrescimo("5000")).toBeNull();
    expect(lerAcrescimo("-101")).toBeNull();
  });
});
