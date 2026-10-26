import { BAIRROS_CURADOS, SAO_PAULO_REFERENCIA, getBairroCurado, receitaMensalReferencia, type BairroCurado } from "@/data/bairrosCurados";
import { IMOVEL_PADRAO, SHORT_STAY_PADRAO, resultadoShortStay, type Resultado } from "@/lib/simuladorReceita";

/**
 * Contas dos artigos da área exclusiva. Tudo parte da base aprovada (reserva offline,
 * igual ao banco na coleta de 18/10/2026) e do simulador com as premissas padrão, para
 * os artigos mostrarem os mesmos números do resto do Radar. Os artigos são análises
 * datadas: ajustes manuais do admin (bairro_ajustes) não entram aqui.
 */

/** Bairros com dado público próprio (GuestFavorites); a aproximação fica de fora. */
export const bairrosObservados = (): BairroCurado[] => BAIRROS_CURADOS.filter((b) => b.ocupacaoFonte === "guestfavorites");

export function bairroDaBase(nome: string): BairroCurado {
  const b = getBairroCurado(nome);
  if (!b) throw new Error(`Bairro fora da base: ${nome}`);
  return b;
}

export interface LinhaReceita { bairro: BairroCurado; receita: number }

/** Receita mensal de referência dos bairros com dado próprio, da maior para a menor. */
export function rankingReceita(): LinhaReceita[] {
  return bairrosObservados()
    .map((bairro) => ({ bairro, receita: receitaMensalReferencia(bairro) }))
    .sort((a, b) => b.receita - a.receita || a.bairro.name.localeCompare(b.bairro.name, "pt-BR"));
}

/** Posição (1 = maior) do bairro no ranking de receita. */
export function posicaoReceita(nome: string): number {
  return rankingReceita().findIndex((l) => l.bairro.name === nome) + 1;
}

export const receitaSaoPaulo = () => receitaMensalReferencia(SAO_PAULO_REFERENCIA);

/** Receita de referência para uma diária e uma ocupação quaisquer (mesma regra do Radar). */
export const receitaCom = (diaria: number, ocupacaoPct: number) => receitaMensalReferencia({ dailyAvg: diaria, avgOccupancy: ocupacaoPct });

/** Resultado do simulador com as premissas padrão (DRE do guia + condomínio e contas de exemplo). */
export const cenario = (diaria: number, ocupacaoPct: number): Resultado =>
  resultadoShortStay({ diaria, ocupacaoPct }, IMOVEL_PADRAO, SHORT_STAY_PADRAO);

/** Diferença entre a diária média e a mediana (quanto a cauda cara puxa a média). */
export const distanciaMediaMediana = (b: BairroCurado) => (b.dailyQuartiles ? b.dailyAvg - b.dailyQuartiles[1] : 0);

/** Bairros com dado próprio ordenados pela distância média − mediana (maior primeiro). */
export function rankingDistanciaMediana(): BairroCurado[] {
  return [...bairrosObservados()].sort((a, b) => distanciaMediaMediana(b) - distanciaMediaMediana(a) || a.name.localeCompare(b.name, "pt-BR"));
}

/** Faixa de ocupação observada entre os bairros com dado próprio. */
export function faixaOcupacao(): { min: BairroCurado; max: BairroCurado } {
  const lista = bairrosObservados();
  const min = lista.reduce((a, b) => (b.avgOccupancy < a.avgOccupancy ? b : a));
  const max = lista.reduce((a, b) => (b.avgOccupancy > a.avgOccupancy ? b : a));
  return { min, max };
}

/** Participação dos anúncios do bairro no total de São Paulo (%). */
export const participacaoAnuncios = (b: BairroCurado) => ((b.activeListings ?? 0) / SAO_PAULO_REFERENCIA.activeListings) * 100;

/** Lista em português: "A, B e C". */
export function listaPt(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** Ordinais por extenso (índice = posição): "a quarta maior receita", "o quinto maior número". */
export const ORDINAL = ["", "primeira", "segunda", "terceira", "quarta", "quinta", "sexta", "sétima", "oitava"];
export const ORDINAL_M = ["", "primeiro", "segundo", "terceiro", "quarto", "quinto", "sexto", "sétimo", "oitavo"];
