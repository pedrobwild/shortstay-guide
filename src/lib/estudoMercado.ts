/**
 * Contas de apresentação das telas Mercado (/mercado) e Bairro (/bairro/:bairro) do
 * redesign "Estudo aberto" (out/2026). Funções puras: nenhum número novo é criado
 * aqui. Tudo sai da base de bairros exibida (useBaseEstudo), do DRE do guia
 * (src/data/dreGuia.ts) ou das funções já testadas de src/lib/estudo.ts.
 */
import type { BairroCurado } from "@/data/bairrosCurados";
import { DESPESAS_EXEMPLO, DRE_LINHAS, liquidoDetalhado } from "@/data/dreGuia";
import { posicaoEntre, type ClasseHistograma } from "@/lib/estudo";
import { valorCriterio, type CriterioRanking } from "@/lib/radarUi";

/* ─── Mercado: título-achado do histograma ─── */

export interface FaixaConcentracao {
  /** Início da primeira classe da faixa (R$/mês). */
  inicio: number;
  /** Fim da última classe da faixa (R$/mês). */
  fim: number;
  /** Bairros dentro da faixa. */
  quantidade: number;
  /** Bairros no histograma. */
  total: number;
  /** Quantas classes de R$ 500 a faixa junta. */
  classes: number;
}

/**
 * Menor sequência de classes vizinhas que reúne mais da metade dos bairros ("a maioria").
 * Com duas sequências do mesmo tamanho, vale a que tem mais bairros; persistindo o
 * empate, a de menor receita. É a base do título "A maioria dos bairros fica entre
 * R$ X e R$ Y por mês" — calculado, nunca escrito à mão.
 */
export function faixaConcentracao<T>(classes: ClasseHistograma<T>[]): FaixaConcentracao | null {
  const total = classes.reduce((s, c) => s + c.itens.length, 0);
  if (!total) return null;
  for (let tamanho = 1; tamanho <= classes.length; tamanho++) {
    let melhor: FaixaConcentracao | null = null;
    for (let i = 0; i + tamanho <= classes.length; i++) {
      const janela = classes.slice(i, i + tamanho);
      const quantidade = janela.reduce((s, c) => s + c.itens.length, 0);
      if (quantidade * 2 > total && (!melhor || quantidade > melhor.quantidade)) {
        melhor = { inicio: janela[0].inicio, fim: janela[janela.length - 1].fim, quantidade, total, classes: tamanho };
      }
    }
    if (melhor) return melhor;
  }
  return null;
}

/* ─── Eixos dos gráficos ─── */

/** Domínio do eixo arredondado ao passo (para fora), cobrindo todos os valores. */
export function dominioEixo(valores: number[], passo: number): [number, number] {
  const min = Math.min(...valores), max = Math.max(...valores);
  const ini = Math.floor(min / passo) * passo;
  let fim = Math.ceil(max / passo) * passo;
  if (fim === ini) fim = ini + passo;
  return [ini, fim];
}

/** Marcas do eixo, do início ao fim do domínio, a cada `passo`. */
export function marcasEixo([ini, fim]: [number, number], passo: number): number[] {
  const marcas: number[] = [];
  for (let v = ini; v <= fim + 1e-9; v += passo) marcas.push(Math.round(v * 1000) / 1000);
  return marcas;
}

/** Posição de 0 a 1 de um valor no domínio. */
export function fracao(valor: number, [ini, fim]: [number, number]): number {
  return fim === ini ? 0.5 : (valor - ini) / (fim - ini);
}

/**
 * Enxame de pontos (strip plot): cada ponto fica na sua posição x (em pixels) e sobe ou
 * desce de nível só quando encostaria em outro já colocado (distância menor que
 * `distancia`). Níveis em ordem 0, +1, −1, +2, −2… Pontos em ordem de x e, no empate,
 * na ordem recebida — o resultado não depende de sorteio.
 */
export function empilharEnxame<T>(pontos: { item: T; x: number }[], distancia: number): { item: T; x: number; nivel: number }[] {
  const ordem = pontos.map((p, i) => ({ ...p, i })).sort((a, b) => a.x - b.x || a.i - b.i);
  const colocados: { x: number; nivel: number }[] = [];
  const saida: { item: T; x: number; nivel: number; i: number }[] = [];
  for (const p of ordem) {
    let nivel = 0;
    for (let k = 0; ; k++) {
      nivel = k === 0 ? 0 : k % 2 === 1 ? (k + 1) / 2 : -k / 2;
      const ocupado = colocados.some((c) => c.nivel === nivel && Math.abs(c.x - p.x) < distancia);
      if (!ocupado) break;
    }
    colocados.push({ x: p.x, nivel });
    saida.push({ item: p.item, x: p.x, nivel, i: p.i });
  }
  return saida.sort((a, b) => a.i - b.i).map(({ item, x, nivel }) => ({ item, x, nivel }));
}

/* ─── Bairro: resumo contra São Paulo e posição entre os bairros ─── */

/** "18% acima de São Paulo", "29% abaixo de São Paulo" ou "no nível de São Paulo". */
export function fraseContraSP(difPct: number): string {
  if (difPct > 0) return `${difPct}% acima de São Paulo`;
  if (difPct < 0) return `${Math.abs(difPct)}% abaixo de São Paulo`;
  return "no nível de São Paulo";
}

/**
 * Posição do bairro pelo critério (a mesma ordem do /ranking: maior primeiro, empate em
 * ordem alfabética) e, no empate, a faixa de posições que o valor ocupa (`primeira` a
 * `ultima`) e os bairros com o mesmo valor — a tela diz "2º a 5º (empate)" em vez de
 * inventar uma ordem que os números não têm.
 */
export function posicaoComEmpate<T extends BairroCurado>(bairros: T[], nome: string, criterio: CriterioRanking) {
  const pos = posicaoEntre(bairros, nome, criterio);
  const proprio = bairros.find((b) => b.name === nome);
  if (!pos || !proprio) return null;
  const valor = valorCriterio(proprio, criterio);
  const empatados = bairros.filter((b) => b.name !== nome && valorCriterio(b, criterio) === valor).map((b) => b.name);
  const primeira = 1 + bairros.filter((b) => valorCriterio(b, criterio) > valor).length;
  return { ...pos, primeira, ultima: primeira + empatados.length, empatados };
}

/** Para frases: "o 6º" ou, no empate, "entre o 2º e o 5º". */
export function frasePosicao(p: { primeira: number; ultima: number }): string {
  return p.primeira === p.ultima ? `o ${p.primeira}º` : `entre o ${p.primeira}º e o ${p.ultima}º`;
}

/** "6º" ou, no empate, "2º a 5º". */
export function textoPosicao(p: { primeira: number; ultima: number }): string {
  return p.primeira === p.ultima ? `${p.primeira}º` : `${p.primeira}º a ${p.ultima}º`;
}

/* ─── Bairro, Tab. 1: da receita de referência ao resultado líquido ─── */

export type BaseLinhaDre = { tipo: "pct"; pct: number } | { tipo: "reais"; valor: number };

export interface LinhaDre {
  chave: string;
  rotulo: string;
  nota: string;
  base: BaseLinhaDre;
  /** Valor da dedução em reais por mês (positivo; a tela mostra com sinal de menos). */
  valor: number;
}

/**
 * Linhas do DRE do guia para uma receita de referência: Airbnb, gestão, impostos e
 * manutenção em % da receita bruta (DRE_LINHAS) e condomínio + IPTU e contas em reais
 * (DESPESAS_EXEMPLO), com o resultado líquido de liquidoDetalhado — a mesma conta do
 * simulador. Nenhum percentual é escrito aqui.
 */
export function linhasDre(receita: number, despesas: { condominio: number; iptu?: number; contas: number } = DESPESAS_EXEMPLO) {
  const conta = liquidoDetalhado(receita, despesas);
  const linhas: LinhaDre[] = DRE_LINHAS.map((l) => {
    if (l.chave === "fixos") {
      const valor = despesas.condominio + (despesas.iptu ?? 0);
      return { chave: l.chave, rotulo: l.rotulo, nota: l.nota, base: { tipo: "reais", valor }, valor };
    }
    if (l.chave === "contas") {
      return { chave: l.chave, rotulo: l.rotulo, nota: l.nota, base: { tipo: "reais", valor: despesas.contas }, valor: despesas.contas };
    }
    const chave = l.chave as "airbnb" | "gestao" | "impostos" | "manutencao";
    return { chave: l.chave, rotulo: l.rotulo, nota: l.nota, base: { tipo: "pct", pct: l.pct }, valor: conta[chave] };
  });
  return { receita, linhas, liquido: conta.liquido };
}
