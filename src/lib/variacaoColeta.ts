import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CIDADE, rotuloPeriodo } from "@/lib/radarBase";

/**
 * "O que mudou nesta coleta": compara a observação ativa de cada bairro com a
 * coleta anterior da MESMA fonte (radar_observacoes guarda o histórico; leitura
 * pública). Sem coleta anterior, ou com fonte diferente, não há comparação —
 * nunca misturamos fontes nem estimamos valores intermediários.
 */
export const INDICADORES_VARIACAO = ["adr_medio_brl", "ocupacao_media_pct"] as const;
type Indicador = (typeof INDICADORES_VARIACAO)[number];

export interface LinhaObservacao {
  id: string;
  bairro: string;
  indicador: string;
  valor: number;
  coletado_em: string;
  ativo: boolean;
  fonte_id: string;
  periodo_inicio: string | null;
  periodo_fim: string | null;
}

export interface Ponto { valor: number; coletadoEm: string; periodo: string | null }
export interface VariacaoIndicador { atual: Ponto; anterior: Ponto; diferenca: number; percentual: number | null }
export interface VariacaoBairro { bairro: string; adr?: VariacaoIndicador; ocupacao?: VariacaoIndicador }

const ponto = (l: LinhaObservacao): Ponto => ({ valor: Number(l.valor), coletadoEm: l.coletado_em, periodo: rotuloPeriodo(l.periodo_inicio, l.periodo_fim) });
const dia = (iso: string) => iso.slice(0, 10);

/** Função pura: agrupa por bairro/indicador e compara a ativa com a coleta anterior da mesma fonte. */
export function calcularVariacoes(linhas: LinhaObservacao[]): VariacaoBairro[] {
  const grupos = new Map<string, LinhaObservacao[]>();
  for (const l of linhas) {
    if (!(INDICADORES_VARIACAO as readonly string[]).includes(l.indicador)) continue;
    const chave = `${l.bairro}|${l.indicador}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(l);
  }
  const porBairro = new Map<string, VariacaoBairro>();
  for (const [chave, lista] of grupos) {
    const [bairro, indicador] = chave.split("|") as [string, Indicador];
    const ordenadas = [...lista].sort((a, b) => b.coletado_em.localeCompare(a.coletado_em) || a.id.localeCompare(b.id));
    const atual = ordenadas.find((l) => l.ativo);
    if (!atual) continue;
    // Anterior = coleta mais recente de um DIA anterior e da mesma fonte (dia igual = mesma coleta).
    const anterior = ordenadas.find((l) => l.id !== atual.id && dia(l.coletado_em) < dia(atual.coletado_em) && l.fonte_id === atual.fonte_id);
    if (!anterior) continue;
    const a = Number(atual.valor), p = Number(anterior.valor);
    const v: VariacaoIndicador = { atual: ponto(atual), anterior: ponto(anterior), diferenca: a - p, percentual: p !== 0 ? ((a - p) / p) * 100 : null };
    const item = porBairro.get(bairro) ?? { bairro };
    if (indicador === "adr_medio_brl") item.adr = v; else item.ocupacao = v;
    porBairro.set(bairro, item);
  }
  return [...porBairro.values()].filter((v) => v.adr || v.ocupacao);
}

/** Lê o histórico paginado (ordem estável + id) e devolve as variações por bairro. */
export async function carregarVariacoes(): Promise<VariacaoBairro[]> {
  const linhas: LinhaObservacao[] = [];
  const PAGINA = 1000;
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await supabase
      .from("radar_observacoes")
      .select("id,bairro,indicador,valor,coletado_em,ativo,fonte_id,periodo_inicio,periodo_fim")
      .eq("cidade", CIDADE)
      .in("indicador", [...INDICADORES_VARIACAO])
      .order("coletado_em", { ascending: false })
      .order("id", { ascending: true })
      .range(de, de + PAGINA - 1);
    if (error) throw error;
    linhas.push(...((data ?? []) as unknown as LinhaObservacao[]));
    if (!data || data.length < PAGINA) break;
  }
  return calcularVariacoes(linhas);
}

export function useVariacoesColeta() {
  return useQuery({ queryKey: ["radar_variacoes"], queryFn: carregarVariacoes, staleTime: 10 * 60 * 1000, retry: 1 });
}
