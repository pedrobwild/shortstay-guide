import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { CIDADE, rotuloPeriodo } from "@/lib/radarBase";

/**
 * Histórico público da base de mercado (radar_observacoes guarda todas as coletas; só a
 * mais recente de cada bairro fica ativa). Daqui saem o registro de atualizações da
 * /metodologia e o histórico por bairro. Funções puras testáveis + leitura paginada
 * (ordem estável + id) com reserva offline montada a partir de bairrosCurados.ts.
 */
export type LinhaHistorico = {
  id: string;
  bairro: string;
  indicador: string;
  valor: number;
  amostra_n: number | null;
  coletado_em: string;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  fonte_id: string;
  ativo: boolean;
  url_origem: string | null;
  radar_fontes?: { nome: string; tipo: string } | null;
};

/** Uma coleta de um bairro (todos os indicadores daquela data/fonte). */
export type ColetaBairro = {
  bairro: string;
  coletadoEm: string;
  fonteId: string;
  fonteNome: string;
  fonteTipo: string;
  periodo: string | null;
  ativo: boolean;
  diaria: number | null;
  ocupacao: number | null;
  quartis: [number, number, number] | null;
  anuncios: number | null;
  url: string | null;
};

/** Um dia de atualização no registro público: quais bairros entraram ou foram atualizados. */
export type EntradaRegistro = {
  data: string;
  fonteId: string;
  fonteNome: string;
  fonteTipo: string;
  novos: string[];
  atualizados: string[];
};

const NOMES_FONTE: Record<string, string> = { guestfavorites: "GuestFavorites", aproximacao_itaim_bibi: "Aproximação pelo Itaim Bibi (GuestFavorites)", estimativa_bewild: "Estimativa Bewild", airdna: "AirDNA" };
/** Ids de fonte da reserva offline (ocupacaoFonte) → ids de radar_fontes. */
const FONTE_ID_RESERVA: Record<string, string> = { guestfavorites: "guestfavorites", aproximacao: "aproximacao_itaim_bibi", bewild: "estimativa_bewild", airdna: "airdna" };
const dia = (iso: string) => iso.slice(0, 10);
const num = (v: number | string | null | undefined) => (v === null || v === undefined ? null : Number(v));

/** Agrupa as linhas por bairro + data + fonte e devolve uma coleta por grupo, mais recente primeiro. */
export function montarColetas(linhas: LinhaHistorico[]): ColetaBairro[] {
  const grupos = new Map<string, LinhaHistorico[]>();
  for (const l of linhas) {
    const chave = `${l.bairro}|${dia(l.coletado_em)}|${l.fonte_id}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), l]);
  }
  const out: ColetaBairro[] = [];
  for (const [, g] of grupos) {
    const por = (k: string) => g.find((l) => l.indicador === k);
    const base = por("adr_medio_brl") ?? g[0];
    const p25 = num(por("adr_p25_brl")?.valor), med = num(por("adr_mediana_brl")?.valor), p75 = num(por("adr_p75_brl")?.valor);
    out.push({
      bairro: base.bairro, coletadoEm: dia(base.coletado_em), fonteId: base.fonte_id,
      fonteNome: base.radar_fontes?.nome ?? NOMES_FONTE[base.fonte_id] ?? base.fonte_id, fonteTipo: base.radar_fontes?.tipo ?? "",
      periodo: rotuloPeriodo(base.periodo_inicio, base.periodo_fim), ativo: g.some((l) => l.ativo),
      diaria: num(por("adr_medio_brl")?.valor), ocupacao: num(por("ocupacao_media_pct")?.valor),
      quartis: p25 !== null && med !== null && p75 !== null ? [p25, med, p75] : null,
      anuncios: num(por("anuncios_ativos")?.valor) ?? base.amostra_n ?? null, url: base.url_origem,
    });
  }
  return out.sort((a, b) => b.coletadoEm.localeCompare(a.coletadoEm) || a.bairro.localeCompare(b.bairro, "pt-BR"));
}

/** Registro de atualizações: por data e fonte, bairros novos (primeira coleta) e atualizados. A estimativa Bewild (referência extra) fica fora. */
export function montarRegistro(todas: ColetaBairro[]): EntradaRegistro[] {
  const coletas = todas.filter((c) => c.fonteId !== "estimativa_bewild");
  const primeira = new Map<string, string>();
  for (const c of coletas) {
    if (c.bairro === CIDADE) continue;
    const atual = primeira.get(c.bairro);
    if (!atual || c.coletadoEm < atual) primeira.set(c.bairro, c.coletadoEm);
  }
  const grupos = new Map<string, EntradaRegistro>();
  for (const c of coletas) {
    if (c.bairro === CIDADE) continue;
    const chave = `${c.coletadoEm}|${c.fonteId}`;
    const e = grupos.get(chave) ?? { data: c.coletadoEm, fonteId: c.fonteId, fonteNome: c.fonteNome, fonteTipo: c.fonteTipo, novos: [], atualizados: [] };
    (primeira.get(c.bairro) === c.coletadoEm ? e.novos : e.atualizados).push(c.bairro);
    grupos.set(chave, e);
  }
  const ordenar = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return [...grupos.values()].map((e) => ({ ...e, novos: ordenar(e.novos), atualizados: ordenar(e.atualizados) })).sort((a, b) => b.data.localeCompare(a.data) || a.fonteId.localeCompare(b.fonteId));
}

/** Reserva offline: uma coleta por bairro, a partir da base aprovada no código. */
export function coletasReserva(): ColetaBairro[] {
  return BAIRROS_CURADOS.map((b) => ({
    bairro: b.name, coletadoEm: b.coletadoEm ?? "2026-10-13", fonteId: FONTE_ID_RESERVA[b.ocupacaoFonte] ?? b.ocupacaoFonte,
    fonteNome: NOMES_FONTE[FONTE_ID_RESERVA[b.ocupacaoFonte] ?? b.ocupacaoFonte] ?? b.ocupacaoFonte,
    fonteTipo: b.ocupacaoFonte === "guestfavorites" ? "publica" : b.ocupacaoFonte === "aproximacao" ? "aproximacao" : "estimativa",
    periodo: b.period, ativo: true, diaria: b.dailyAvg, ocupacao: b.avgOccupancy, quartis: b.dailyQuartiles, anuncios: b.activeListings, url: b.sourceUrl,
  })).sort((a, b) => b.coletadoEm.localeCompare(a.coletadoEm) || a.bairro.localeCompare(b.bairro, "pt-BR"));
}

const CAMPOS = "id,bairro,indicador,valor,amostra_n,coletado_em,periodo_inicio,periodo_fim,fonte_id,ativo,url_origem,radar_fontes(nome,tipo)";

/** Lê o histórico (todos os bairros ou um só), paginado em 1.000 com ordem estável + id. */
export async function carregarHistorico(bairro?: string): Promise<{ coletas: ColetaBairro[]; offline: boolean }> {
  const linhas: LinhaHistorico[] = [];
  const PAGINA = 1000;
  try {
    for (let de = 0; ; de += PAGINA) {
      let q = supabase.from("radar_observacoes").select(CAMPOS).eq("cidade", CIDADE);
      if (bairro) q = q.eq("bairro", bairro);
      const { data, error } = await q.order("coletado_em", { ascending: false }).order("id", { ascending: true }).range(de, de + PAGINA - 1);
      if (error) throw error;
      linhas.push(...((data ?? []) as unknown as LinhaHistorico[]));
      if (!data || data.length < PAGINA) break;
    }
    return { coletas: montarColetas(linhas), offline: false };
  } catch {
    const reserva = coletasReserva();
    return { coletas: bairro ? reserva.filter((c) => c.bairro === bairro) : reserva, offline: true };
  }
}

export function useHistoricoRadar(bairro?: string) {
  return useQuery({ queryKey: ["radar_historico_publico", bairro ?? "*"], queryFn: () => carregarHistorico(bairro), staleTime: 10 * 60 * 1000, retry: 1 });
}
