import { supabase } from "@/integrations/supabase/client";

export type ObservacaoGuestFavorites = {
  id: string; bairro: string; indicador: string; coletado_em: string;
  periodo_inicio: string | null; periodo_fim: string | null; ativo: boolean;
  fonte_id: string; url_origem: string | null; radar_fontes: { nome: string } | null;
};
export function resumirColetasGuestFavorites(linhas: ObservacaoGuestFavorites[], bairros: string[]) {
  const grupos = new Map<string, ObservacaoGuestFavorites[]>();
  for (const r of linhas) {
    if (r.fonte_id !== "guestfavorites") continue;
    const chave = JSON.stringify([r.bairro, r.coletado_em, r.periodo_inicio, r.periodo_fim]);
    grupos.set(chave, [...(grupos.get(chave) ?? []), r]);
  }
  const coletas = [...grupos.entries()].map(([id, g]) => {
    const base = g.find((r) => r.indicador === "adr_medio_brl") ?? g[0];
    const completa = ["adr_medio_brl", "ocupacao_media_pct"].every((k) => g.some((r) => r.indicador === k));
    const ativa = completa && ["adr_medio_brl", "ocupacao_media_pct"].every((k) => g.some((r) => r.indicador === k && r.ativo));
    return { ...base, id, completa, ativa };
  }).sort((a, b) => b.coletado_em.localeCompare(a.coletado_em) || a.bairro.localeCompare(b.bairro, "pt-BR") || a.id.localeCompare(b.id));
  const cobertura = [...new Set([...bairros, ...coletas.map((r) => r.bairro)])].sort((a, b) => a.localeCompare(b, "pt-BR")).map((bairro) => {
    const registros = coletas.filter((r) => r.bairro === bairro);
    const atual = registros.find((r) => r.ativa);
    return { bairro, atual, ultima: registros[0], status: atual ? "ativa" : registros.length ? "sem_ativa" : "sem_coleta" };
  });
  return { coletas, cobertura };
}
export async function carregarResumoGuestFavorites() {
  const linhas: ObservacaoGuestFavorites[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase.from("radar_observacoes")
      .select("id,bairro,indicador,coletado_em,periodo_inicio,periodo_fim,ativo,fonte_id,url_origem,radar_fontes(nome)")
      .eq("cidade", "São Paulo").eq("fonte_id", "guestfavorites")
      .in("indicador", ["adr_medio_brl", "ocupacao_media_pct"])
      .order("coletado_em", { ascending: false }).order("id").range(de, de + 999);
    if (error) throw error;
    linhas.push(...(data ?? []));
    if (!data || data.length < 1000) return linhas;
  }
}