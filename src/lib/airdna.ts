import { supabase } from "@/integrations/supabase/client";
import { BAIRROS_AIRDNA } from "@/lib/radarColetas";

/**
 * Importação AirDNA (API Enterprise) para os bairros sem fonte pública.
 * A chave fica só no backend (segredo AIRDNA_API_KEY na edge function `airdna-importar`).
 * A função devolve uma PRÉVIA; nada é gravado até o admin confirmar, e a gravação
 * passa pela mesma RPC auditada das coletas GuestFavorites.
 */
export type BairroAirdna = (typeof BAIRROS_AIRDNA)[number];

export type PreviaAirdna = {
  bairro: BairroAirdna;
  /** Área da AirDNA que respondeu (submercado). O admin confere se corresponde ao bairro. */
  area: { id: string; nome: string; tipo: string };
  periodo_inicio: string;
  periodo_fim: string;
  /** Anúncios ativos no período (média mensal informada pela AirDNA). */
  amostra_n: number;
  indicadores: {
    adr_medio_brl: number;
    ocupacao_media_pct: number;
    receita_anual_brl?: number;
  };
  /** Meses com dado retornados pela API (para conferência). */
  meses: number;
  filtros: string;
  url_origem: string;
};

export const URL_ORIGEM_AIRDNA = "https://app.airdna.co/data/performance";

export async function buscarPreviaAirdna(bairro: BairroAirdna, periodoInicio: string, periodoFim: string): Promise<PreviaAirdna> {
  const { data, error } = await supabase.functions.invoke("airdna-importar", { body: { bairro, periodo_inicio: periodoInicio, periodo_fim: periodoFim } });
  if (error) {
    // A edge function responde { erro } com status 4xx/5xx; o supabase-js embrulha em FunctionsHttpError.
    const ctx = (error as { context?: Response }).context;
    const corpo = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    throw new Error(corpo?.erro ?? "Não foi possível consultar a AirDNA. Tente novamente.");
  }
  return data as PreviaAirdna;
}

/** Converte a prévia no formato da RPC admin_registrar_coleta_radar (validado por coletaSchema). */
export function coletaDaPrevia(p: PreviaAirdna, coletadoEm: string, observacao: string) {
  return {
    bairro: p.bairro,
    fonte_id: "airdna" as const,
    periodo_inicio: p.periodo_inicio,
    periodo_fim: p.periodo_fim,
    coletado_em: coletadoEm,
    publicado_em: "",
    amostra_n: Math.round(p.amostra_n),
    url_origem: p.url_origem,
    observacao: [`AirDNA API — área "${p.area.nome}" (${p.area.tipo} ${p.area.id}); ${p.filtros}; ${p.meses} meses.`, observacao.trim()].filter(Boolean).join(" ").slice(0, 4000),
    indicadores: p.indicadores,
  };
}
