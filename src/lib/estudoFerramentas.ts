/**
 * Contas das telas /ferramentas e /projecao no redesign "Estudo aberto" (out/2026).
 * Funções puras: nenhum número novo nasce aqui. Reforma e prazo vêm do estudo Bewild
 * (provasBewild.ts, via estudo.ts), financiamento do motor de financiamento.ts e as
 * deduções do resultado do simulador (simuladorReceita.ts, que lê o DRE de dreGuia.ts).
 * O que está aqui é só apresentação: agrupar, escalar e posicionar.
 */
import { MARCENARIA_DIAS_FABRICA, MARCENARIA_DIAS_MONTAGEM } from "@/data/provasBewild";
import { simulate, type AmortSystem } from "@/lib/financiamento";
import { estimativaReforma, prazoContrato } from "@/lib/estudo";
import type { Resultado } from "@/lib/simuladorReceita";

/* ─── 02 · Reformar: estimativa por área ─── */

/** Faixa de área aceita na ferramenta: o estudo cobre studios e apartamentos de até 50 m². */
export const AREA_MIN_M2 = 15;
export const AREA_MAX_M2 = 50;

/** Área digitada → número dentro da faixa do estudo (null quando vazia ou ilegível). */
export function limitarArea(area: number | null): number | null {
  if (area == null || !Number.isFinite(area) || area <= 0) return null;
  return Math.min(AREA_MAX_M2, Math.max(AREA_MIN_M2, Math.round(area * 10) / 10));
}

/**
 * Estimativa de reforma a partir do estudo (P25, mediana e P75 do R$/m² × área, com o
 * piso de R$ 55 mil), prazo em contrato pela metragem e sacada e a marcenaria, que corre
 * em paralelo com a obra (não soma ao prazo).
 */
export function estimativaReformaCompleta(areaM2: number, comSacada: boolean) {
  const faixa = estimativaReforma(areaM2);
  return {
    ...faixa,
    algumNoPiso: faixa.p25.noPiso || faixa.mediana.noPiso || faixa.p75.noPiso,
    prazoDiasUteis: prazoContrato(areaM2, comSacada),
    /** Acima de 40 m² o estudo usa o maior prazo da tabela. */
    acimaDe40: areaM2 > 40,
    marcenaria: {
      fabrica: MARCENARIA_DIAS_FABRICA,
      montagem: MARCENARIA_DIAS_MONTAGEM,
      total: MARCENARIA_DIAS_FABRICA + MARCENARIA_DIAS_MONTAGEM,
    },
  };
}

/* ─── 01 · Comprar: resumo do financiamento ─── */

export interface PremissasFinanciamento {
  valor: number;
  entrada: number;
  prazoMeses: number;
  /** Juros ao ano, em % (ex.: 11,19). */
  jurosAA: number;
  tipoTaxa?: "efetiva" | "nominal";
  /** Idade de quem compra (seguro MIP); sem ela, o motor usa o padrão dele. */
  idade?: number;
  sistema?: AmortSystem;
}

/**
 * Resumo do financiamento no padrão do direcionamento: entrada, valor financiado,
 * 1ª e última parcela (com seguros e tarifa, como no demonstrativo) e juros no prazo.
 * Null enquanto faltar valor, prazo ou juros, ou se a entrada cobrir o imóvel.
 */
export function resumoFinanciamento(p: PremissasFinanciamento) {
  if (!(p.valor > 0) || !(p.jurosAA > 0) || !(p.prazoMeses >= 12) || p.entrada < 0 || p.entrada >= p.valor) return null;
  const sistema = p.sistema ?? "SAC";
  const r = simulate(sistema, {
    propertyValue: p.valor,
    downPayment: p.entrada,
    termMonths: Math.round(p.prazoMeses),
    annualRate: p.jurosAA,
    annualRateType: p.tipoTaxa ?? "efetiva",
    buyerAgeYears: p.idade && p.idade >= 18 ? p.idade : undefined,
  });
  return {
    sistema,
    entrada: p.entrada,
    entradaPct: (p.entrada / p.valor) * 100,
    valorFinanciado: r.financedAmount,
    primeiraParcela: r.firstInstallment,
    ultimaParcela: r.lastInstallment,
    jurosNoPrazo: r.totalInterest,
    totalPago: r.totalPaid,
    seguros: r.totalInsurance,
  };
}

/* ─── Simular: barra empilhada da receita (Fig. 1 da /projecao) ─── */

/** Tons neutros das linhas de custo, do mais escuro ao mais claro (tokens do estudo). */
export const TONS_CUSTO = ["--neutro-700", "--neutro-600", "--neutro-500", "--neutro-400", "--neutro-300"] as const;

export interface SegmentoReceita {
  chave: string;
  rotulo: string;
  /** Como o valor foi obtido ("15% da receita bruta", "valor mensal informado"). */
  base: string;
  valor: number;
  /** Posição na barra, em fração da escala (0–1). */
  inicio: number;
  fim: number;
  /** Variável CSS do tom (ex.: "--neutro-600", "--ciano", "--magenta"). */
  tom: string;
}

/**
 * Reparte a receita bruta do mês entre as deduções percentuais (na ordem do DRE), os
 * fixos agrupados (condomínio, IPTU e contas) e o resultado líquido. A escala é a maior
 * entre a receita e os custos: com resultado negativo, o trecho dos custos além da
 * receita aparece como déficit (magenta).
 */
export function segmentosReceita(r: Resultado): { escala: number; custos: SegmentoReceita[]; liquido: SegmentoReceita | null; deficit: SegmentoReceita | null } {
  const percentuais = r.deducoes.filter((d) => d.tipo === "percentual");
  const fixos = r.deducoes.filter((d) => d.tipo === "fixo");
  const grupos = [
    ...percentuais.map((d) => ({ chave: d.chave, rotulo: d.rotulo, base: d.base, valor: d.valor })),
    ...(fixos.length
      ? [{
          chave: "fixos",
          rotulo: fixos.length === 1 ? fixos[0].rotulo : `Fixos (${listaPt(fixos.map((f) => rotuloCurtoFixo(f.chave, f.rotulo)))})`,
          base: fixos.length === 1 ? fixos[0].base : "valores mensais informados",
          valor: fixos.reduce((s, f) => s + f.valor, 0),
        }]
      : []),
  ];
  const escala = Math.max(1, r.receitaBruta, r.totalDeducoes);
  let acumulado = 0;
  const custos = grupos.map((g, i) => {
    const inicio = acumulado / escala;
    acumulado += g.valor;
    return { ...g, inicio, fim: acumulado / escala, tom: TONS_CUSTO[Math.min(i, TONS_CUSTO.length - 1)] };
  });
  const liquido = r.liquido > 0
    ? { chave: "liquido", rotulo: "Resultado líquido", base: "o que sobra no mês", valor: r.liquido, inicio: acumulado / escala, fim: (acumulado + r.liquido) / escala, tom: "--ciano" }
    : null;
  const deficit = r.liquido < 0
    ? { chave: "deficit", rotulo: "Custos acima da receita", base: "resultado líquido negativo", valor: -r.liquido, inicio: r.receitaBruta / escala, fim: 1, tom: "--magenta" }
    : null;
  return { escala, custos, liquido, deficit };
}

function rotuloCurtoFixo(chave: string, rotulo: string) {
  if (chave === "condominio") return "condomínio";
  if (chave === "iptu") return "IPTU";
  if (chave === "contas") return "contas";
  return rotulo.toLowerCase();
}

/** "a", "a e b", "a, b e c". */
export function listaPt(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/* ─── Réguas e eixos ─── */

/**
 * Domínio de uma régua em reais com folga dos dois lados, arredondado ao passo
 * (R$ 50 por padrão), nunca abaixo de zero.
 */
export function dominioRegua(valores: number[], passo = 50): [number, number] {
  const v = valores.filter((x) => Number.isFinite(x));
  if (!v.length) return [0, passo];
  const min = Math.min(...v), max = Math.max(...v);
  const folga = Math.max((max - min) * 0.12, passo);
  const ini = Math.max(0, Math.floor((min - folga) / passo) * passo);
  const fim = Math.ceil((max + folga) / passo) * passo;
  return [ini, fim > ini ? fim : ini + passo];
}

/** Marcas "redondas" de um eixo (passo 1, 2 ou 5 × 10^k), com no máximo ~`alvo` marcas. */
export function marcasEixo([ini, fim]: [number, number], alvo = 5): number[] {
  const bruto = (fim - ini) / Math.max(1, alvo);
  if (!(bruto > 0)) return [ini];
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 5, 10].map((m) => m * mag).find((p) => p >= bruto) ?? 10 * mag;
  const marcas: number[] = [];
  for (let m = Math.ceil(ini / passo) * passo; m <= fim + 1e-9; m += passo) marcas.push(Math.round(m * 1e6) / 1e6);
  return marcas;
}

/** Posição de um valor no domínio, em fração (0–1), presa às bordas. */
export function fracaoNoDominio(valor: number, [ini, fim]: [number, number]): number {
  if (fim <= ini) return 0;
  return Math.min(1, Math.max(0, (valor - ini) / (fim - ini)));
}

/** Amostra até `maxPontos` pontos de uma série longa (sempre com o primeiro e o último). */
export function amostrarSerie<T>(itens: T[], maxPontos = 60): T[] {
  if (itens.length <= maxPontos) return itens;
  const passo = Math.ceil(itens.length / maxPontos);
  return itens.filter((_, i) => i % passo === 0 || i === itens.length - 1);
}
