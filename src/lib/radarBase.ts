import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRadarRealtime } from "@/hooks/useRadarRealtime";
import { BAIRROS_CURADOS, SAO_PAULO_REFERENCIA, type BairroCurado } from "@/data/bairrosCurados";

/**
 * Base única de dados de mercado: a view `radar_bairro_atual` (banco) é a fonte
 * de verdade. Aqui ela é convertida para o formato BairroCurado que o app já usa.
 * `bairrosCurados.ts` só entra como reserva quando a consulta falha.
 */
export type Confianca = "alta" | "media" | "baixa";
export type LinhaRadar = {
  indicador: string; bairro: string; valor: number; amostra_n: number | null;
  periodo_inicio: string | null; periodo_fim: string | null; fonte_id: string; fonte_nome: string;
  fonte_tipo: string; url_origem: string | null; coletado_em: string; confianca: Confianca; idade_dias?: number;
};
export type BairroRadar = BairroCurado & {
  fonteNome: string; fonteTipo: string; coletadoEm: string | null; idadeDias: number | null; amostraN: number | null; confianca: Confianca | null; estimativa: boolean;
};

/** Fonte com dado observado: pública (GuestFavorites) ou licenciada (AirDNA, API paga). */
export const fonteObservada = (tipo: string) => tipo === "publica" || tipo === "licenciada";

/** Qualidade da amostra e idade não mudam o tipo da fonte nem a confiança da view. */
export function alertasFonteRadar(b: BairroRadar) {
  return {
    estimativa: b.fonteTipo === "estimativa",
    amostraPequena: fonteObservada(b.fonteTipo) && b.confianca === "baixa" && b.amostraN != null && b.amostraN < 200,
    desatualizado: fonteObservada(b.fonteTipo) && b.idadeDias != null && b.idadeDias > 240,
  };
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export function rotuloPeriodo(ini: string | null, fim: string | null): string | null {
  if (!ini || !fim) return null;
  const [a1, m1] = ini.split("-").map(Number);
  const [a2, m2] = fim.split("-").map(Number);
  return a1 === a2 ? `${MESES[m1 - 1]}–${MESES[m2 - 1]}/${a2}` : `${MESES[m1 - 1]}/${a1}–${MESES[m2 - 1]}/${a2}`;
}
const fmtData = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };

const ORDEM = new Map(BAIRROS_CURADOS.map((b, i) => [b.name, i]));
export const CIDADE = "São Paulo";

/** Agrupa as linhas da view por bairro e monta BairroCurado (sem a referência da cidade). */
export function montarBairros(linhas: LinhaRadar[]): BairroRadar[] {
  const grupos = new Map<string, Map<string, LinhaRadar>>();
  for (const l of linhas) {
    if (!grupos.has(l.bairro)) grupos.set(l.bairro, new Map());
    grupos.get(l.bairro)?.set(l.indicador, l);
  }
  const out: BairroRadar[] = [];
  for (const [name, g] of grupos) {
    if (name === CIDADE) continue;
    const occ = g.get("ocupacao_media_pct"), adr = g.get("adr_medio_brl");
    if (!occ || !adr) continue;
    const v = (k: string) => { const linha = g.get(k); return linha ? Number(linha.valor) : null; };
    const estimativa = adr.fonte_tipo === "estimativa";
    const aproximacao = adr.fonte_id === "aproximacao_itaim_bibi";
    const p25 = v("adr_p25_brl"), med = v("adr_mediana_brl"), p75 = v("adr_p75_brl");
    const dailyAvg = Number(adr.valor);
    const ordem: Confianca[] = ["baixa", "media", "alta"];
    const confianca = ordem[Math.min(ordem.indexOf(occ.confianca), ordem.indexOf(adr.confianca))];
    out.push({
      name, dailyAvg, avgOccupancy: Number(occ.valor),
      dailyMin: p25 ?? dailyAvg, dailyMax: p75 ?? dailyAvg,
      dailyQuartiles: (!estimativa || aproximacao) && p25 != null && med != null && p75 != null ? [p25, med, p75] : null,
      activeListings: v("anuncios_ativos"),
      ocupacaoFonte: aproximacao ? "aproximacao" : estimativa ? "bewild" : adr.fonte_id === "airdna" ? "airdna" : "guestfavorites",
      period: rotuloPeriodo(adr.periodo_inicio, adr.periodo_fim),
      sourceUrl: adr.url_origem,
      fonteNome: adr.fonte_nome, fonteTipo: adr.fonte_tipo, coletadoEm: adr.coletado_em, idadeDias: adr.idade_dias ?? null, amostraN: adr.amostra_n,
      confianca, estimativa,
    });
  }
  return out.sort((a, b) => (ORDEM.get(a.name) ?? 99) - (ORDEM.get(b.name) ?? 99) || a.name.localeCompare(b.name, "pt-BR"));
}

/** Reserva offline: a base aprovada no código, sem selo de confiança calculado. */
export function bairrosReserva(): BairroRadar[] {
  return BAIRROS_CURADOS.map((b) => ({
    ...b, fonteNome: b.ocupacaoFonte === "guestfavorites" ? "GuestFavorites" : b.ocupacaoFonte === "aproximacao" ? "GuestFavorites (aproximação pelo Itaim Bibi)" : "Estimativa Bewild",
    fonteTipo: b.ocupacaoFonte === "guestfavorites" ? "publica" : "estimativa",
    coletadoEm: b.coletadoEm ?? "2026-10-13", idadeDias: null, amostraN: b.activeListings, confianca: null, estimativa: b.ocupacaoFonte === "bewild" || b.ocupacaoFonte === "aproximacao",
  }));
}

/** "GuestFavorites, jan–set/2026 · coleta 13/10/2026 · n=2.424 · confiança alta" */
export function rotuloFonteRadar(b: BairroRadar): string {
  const partes = [b.period ? `${b.fonteNome}, ${b.period}` : b.fonteNome];
  if (b.coletadoEm) partes.push(`coleta ${fmtData(b.coletadoEm)}`);
  if (b.amostraN != null) partes.push(`n=${new Intl.NumberFormat("pt-BR").format(b.amostraN)}`);
  if (b.confianca) partes.push(`confiança ${b.confianca === "media" ? "média" : b.confianca}`);
  return partes.join(" · ");
}

export async function carregarRadar(): Promise<{ bairros: BairroRadar[]; cidade: typeof SAO_PAULO_REFERENCIA; offline: boolean }> {
  const { data, error } = await supabase.from("radar_bairro_atual").select("*").eq("cidade", CIDADE);
  if (error || !data?.length) return { bairros: bairrosReserva(), cidade: SAO_PAULO_REFERENCIA, offline: true };
  const linhas = data as unknown as LinhaRadar[];
  let bairros = montarBairros(linhas);
  const aprox = bairros.filter((b) => b.ocupacaoFonte === "aproximacao").map((b) => b.name);
  if (aprox.length) {
    const ref = await supabase.from("radar_observacoes").select("bairro, indicador, valor")
      .eq("fonte_id", "estimativa_bewild").eq("ativo", true).eq("cidade", CIDADE).in("bairro", aprox);
    if (!ref.error && ref.data) bairros = anexarReferencias(bairros, ref.data as LinhaRef[]);
  }
  const sp = linhas.filter((l) => l.bairro === CIDADE);
  const val = (k: string) => sp.find((l) => l.indicador === k);
  const occ = val("ocupacao_media_pct"), adr = val("adr_medio_brl"), n = val("anuncios_ativos");
  const cidade = occ && adr && n
    ? { avgOccupancy: Number(occ.valor), dailyAvg: Number(adr.valor), activeListings: Number(n.valor), period: rotuloPeriodo(adr.periodo_inicio, adr.periodo_fim) ?? "" }
    : SAO_PAULO_REFERENCIA;
  return { bairros: bairros.length ? bairros : bairrosReserva(), cidade, offline: !bairros.length };
}

export function useRadarBase() {
  useRadarRealtime();
  return useQuery({ queryKey: ["radar_bairro_atual"], queryFn: carregarRadar, staleTime: 60 * 60 * 1000 });
}

/** "Estimativa Bewild: diária R$ 415 · ocupação 79% (dados anteriores da Bewild, sem fonte pública)" */
export function rotuloReferenciaBewild(r: NonNullable<BairroCurado["referenciaBewild"]>): string {
  const n = new Intl.NumberFormat("pt-BR");
  return `Estimativa Bewild: diária R$ ${n.format(r.dailyAvg)} · ocupação ${n.format(r.avgOccupancy)}% (dados anteriores da Bewild, sem fonte pública)`;
}

type LinhaRef = { bairro: string; indicador: string; valor: number };
/** Anexa a estimativa Bewild ativa como referência extra só aos bairros cuja principal é a aproximação. */
export function anexarReferencias(bairros: BairroRadar[], linhas: LinhaRef[]): BairroRadar[] {
  return bairros.map((b) => {
    if (b.ocupacaoFonte !== "aproximacao") return b;
    const v = (k: string) => { const l = linhas.find((x) => x.bairro === b.name && x.indicador === k); return l ? Number(l.valor) : null; };
    const adr = v("adr_medio_brl"), occ = v("ocupacao_media_pct");
    if (adr == null || occ == null) return b;
    return { ...b, referenciaBewild: { dailyAvg: adr, avgOccupancy: occ, dailyMin: v("adr_p25_brl") ?? adr, dailyMax: v("adr_p75_brl") ?? adr } };
  });
}

const juntar = (nomes: string[]) => nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
/**
 * Nota dos bairros fora da GuestFavorites, montada a partir da base exibida:
 * "Brooklin: AirDNA (dado licenciado), jan–set/2026. Consolação e Vila Olímpia: estimativa Bewild (sem fonte pública atualizada)."
 */
export function notaFontesComplementares(bairros: Pick<BairroCurado, "name" | "ocupacaoFonte" | "period">[]): string {
  const airdna = bairros.filter((b) => b.ocupacaoFonte === "airdna");
  const estimativa = bairros.filter((b) => b.ocupacaoFonte === "bewild").map((b) => b.name);
  const partes: string[] = [];
  const periodos = new Map<string, string[]>();
  for (const b of airdna) { const k = b.period ?? ""; periodos.set(k, [...(periodos.get(k) ?? []), b.name]); }
  for (const [periodo, nomes] of periodos) partes.push(`${juntar(nomes)}: AirDNA (dado licenciado)${periodo ? `, ${periodo}` : ""}.`);
  const aprox = bairros.filter((b) => b.ocupacaoFonte === "aproximacao").map((b) => b.name);
  if (aprox.length) partes.push(`${juntar(aprox)}: aproximação pelo Itaim Bibi, distrito que inclui a Vila Olímpia e parte do Brooklin (sem dado público por bairro). A estimativa Bewild (dados anteriores, sem fonte pública) aparece como referência extra.`);
  if (estimativa.length) partes.push(`${juntar(estimativa)}: estimativa Bewild (sem fonte pública atualizada).`);
  return partes.join(" ");
}
