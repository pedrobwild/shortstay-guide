import { supabase } from "@/integrations/supabase/client";
import { indicadoresColeta } from "@/lib/radarColetas";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";

/**
 * Coleta assistida: a Edge Function `coletar-guestfavorites` lê as páginas públicas e grava
 * propostas em radar_coletas_pendentes; aqui ficam a leitura dessas propostas, a comparação
 * com os números ativos e as decisões (aprovar/descartar via RPC). Nada entra na base sem a
 * aprovação explícita do admin — a aprovação roda a mesma RPC das coletas manuais.
 *
 * A tabela e as RPCs ainda não estão em types.ts (arquivo gerado); o cliente é usado de
 * forma solta, como em useLeadScores, até a próxima geração dos tipos.
 */
export type ColetaPendente = {
  id: string;
  bairro: string;
  periodo_inicio: string;
  periodo_fim: string;
  coletado_em: string;
  publicado_em: string | null;
  amostra_n: number;
  url_origem: string;
  indicadores: Record<string, number>;
  /** Observação ativa no momento da leitura (números + periodo_inicio/fim + coletado_em); null = bairro sem coleta ativa. */
  atual: Record<string, number | string | null> | null;
  status: "pendente" | "aprovada" | "descartada" | "erro";
  motivo: string | null;
  criado_em: string;
};

export type ResumoColeta = {
  lidos: number;
  propostas: number;
  semMudanca: number;
  erros: string[];
  bairros: { bairro: string; status: string }[];
};

type ClienteSolto = {
  from: (t: string) => {
    select: (c: string) => {
      in: (col: string, v: string[]) => { order: (col: string, o: { ascending: boolean }) => { order: (col: string) => { limit: (n: number) => Promise<{ data: unknown; error: { message: string } | null }> } } };
    };
  };
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};
const solto = () => supabase as unknown as ClienteSolto;

export async function listarColetasPendentes(): Promise<ColetaPendente[]> {
  const { data, error } = await solto().from("radar_coletas_pendentes").select("*").in("status", ["pendente", "erro"]).order("criado_em", { ascending: false }).order("id").limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as ColetaPendente[];
}

export async function aprovarColetaPendente(id: string): Promise<void> {
  const { error } = await solto().rpc("admin_aprovar_coleta_pendente", { p_id: id });
  if (error) throw new Error(error.message);
}

export async function descartarColetaPendente(id: string, motivo: string): Promise<void> {
  const { error } = await solto().rpc("admin_descartar_coleta_pendente", { p_id: id, p_motivo: motivo || null });
  if (error) throw new Error(error.message);
}

/** Dispara a leitura das páginas (Edge Function, só admin). Devolve o resumo da rodada. */
export async function dispararColetaGuestFavorites(bairro?: string): Promise<ResumoColeta> {
  const { data, error } = await supabase.functions.invoke("coletar-guestfavorites", { body: bairro ? { bairro } : {} });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const corpo = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    throw new Error(corpo?.error ?? "Não foi possível ler as páginas da GuestFavorites. Tente novamente.");
  }
  return data as ResumoColeta;
}

export type LinhaDiferenca = { chave: string; label: string; antes: string | null; depois: string | null; mudou: boolean };

const ROTULOS: Record<string, string> = Object.fromEntries(indicadoresColeta.map(([k, l]) => [k, l.replace(/ \((R\$|%)\)$/, "")]));
ROTULOS.anuncios_ativos = "Anúncios ativos";

function formatar(chave: string, v: number | string | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (chave === "ocupacao_media_pct") return `${formatDecimal(n, 0)}%`;
  if (chave === "anuncios_ativos") return formatDecimal(n, 0);
  return formatBRL(n);
}

/** Linhas "antes → depois" para o admin decidir; só o que a proposta traz (sem inventar indicador). */
export function diferencasColeta(p: ColetaPendente): LinhaDiferenca[] {
  const chaves = ["ocupacao_media_pct", "adr_medio_brl", "adr_p25_brl", "adr_mediana_brl", "adr_p75_brl", "anuncios_ativos"];
  const novo: Record<string, number> = { ...p.indicadores, anuncios_ativos: p.amostra_n };
  return chaves.flatMap((chave) => {
    const depoisN = novo[chave];
    const antesN = p.atual?.[chave];
    if (depoisN === undefined && (antesN === undefined || antesN === null)) return [];
    const antes = formatar(chave, antesN as number | null | undefined);
    const depois = formatar(chave, depoisN);
    return [{ chave, label: ROTULOS[chave] ?? chave, antes, depois, mudou: antes !== depois }];
  });
}

const dataBR = (v: string | null | undefined) => (v ? String(v).split("-").reverse().join("/") : "—");

/** "jan–set/2026" não é derivável sem tabela de meses; mostramos datas completas para não ambiguar. */
export function periodoColeta(p: ColetaPendente): { depois: string; antes: string | null; mudou: boolean } {
  const depois = `${dataBR(p.periodo_inicio)} — ${dataBR(p.periodo_fim)}`;
  const antes = p.atual?.periodo_inicio ? `${dataBR(String(p.atual.periodo_inicio))} — ${dataBR(String(p.atual.periodo_fim))}` : null;
  return { depois, antes, mudou: antes !== null && antes !== depois };
}
