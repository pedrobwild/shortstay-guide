import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRadarBase, rotuloPeriodo } from "@/lib/radarBase";
import { formatBRL, formatPercent, formatDecimal } from "@/lib/numberFormat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compararIndicadores } from "@/../supabase/functions/_shared/comparacaoMetricas";

type Previa = { indicadores: { adr_medio_brl: number; ocupacao_media_pct: number }; periodo_inicio: string; periodo_fim: string; coletado_em: string; amostra_n: number | null; metodologia?: string; filtros?: string; url_origem?: string };
type Estado = { loading?: boolean; erro?: string; dados?: Previa };
export default function ComparacaoFontes() {
  const radar = useRadarBase();
  const [bairro, setBairro] = useState("Mooca");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [fontes, setFontes] = useState<Record<string, Estado>>({});
  const base = useQuery({ queryKey: ["radar_historico", "comparacao", bairro], queryFn: async () => {
    const { data, error } = await supabase.from("radar_observacoes").select("indicador,valor,periodo_inicio,periodo_fim,coletado_em,amostra_n,url_origem").eq("bairro", bairro).eq("cidade", "São Paulo").eq("fonte_id", "guestfavorites").eq("ativo", true).in("indicador", ["adr_medio_brl", "ocupacao_media_pct"]);
    if (error) throw error;
    const adr = data?.find((r) => r.indicador === "adr_medio_brl"), occ = data?.find((r) => r.indicador === "ocupacao_media_pct");
    if (!adr || !occ || !adr.periodo_inicio || !adr.periodo_fim || adr.periodo_inicio !== occ.periodo_inicio || adr.periodo_fim !== occ.periodo_fim || adr.coletado_em !== occ.coletado_em) return null;
    return { indicadores: { adr_medio_brl: Number(adr.valor), ocupacao_media_pct: Number(occ.valor) }, periodo_inicio: adr.periodo_inicio, periodo_fim: adr.periodo_fim, coletado_em: adr.coletado_em, amostra_n: adr.amostra_n, url_origem: adr.url_origem ?? undefined } satisfies Previa;
  } });
  const limpar = () => setFontes({});
  const consultar = async (fonte: string) => {
    const periodo_inicio = inicio || base.data?.periodo_inicio;
    const periodo_fim = fim || base.data?.periodo_fim;
    if (!periodo_inicio || !periodo_fim) { setFontes((s) => ({ ...s, [fonte]: { erro: "Informe o início e o fim do período." } })); return; }
    setFontes((s) => ({ ...s, [fonte]: { loading: true } }));
    try {
      const { data, error } = await supabase.functions.invoke(`coletar-${fonte}`, { body: { bairro, periodo_inicio, periodo_fim } });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null);
          const detalhe = typeof body?.details === "string" ? body.details : "";
          throw new Error(`${body?.error ?? "Não foi possível consultar a fonte."}${body?.provider_status ? ` (provedor: ${body.provider_status})` : ""}${detalhe ? ` · ${detalhe}` : ""}`);
        }
        throw error;
      }
      if (!data?.indicadores) throw new Error(data?.error ?? "Fonte sem diária e ocupação completas.");
      setFontes((s) => ({ ...s, [fonte]: { dados: data } }));
    } catch (e) { setFontes((s) => ({ ...s, [fonte]: { erro: e instanceof Error ? e.message : "Não foi possível consultar a fonte." } })); }
  };
  const metricas = (d: Previa) => <dl className="space-y-2 text-sm"><div><dt className="text-muted-foreground">Diária média</dt><dd className="text-xl tabular-nums font-semibold">{formatBRL(d.indicadores.adr_medio_brl)}</dd></div><div><dt className="text-muted-foreground">Ocupação</dt><dd className="text-xl tabular-nums font-semibold">{formatPercent(d.indicadores.ocupacao_media_pct)}</dd></div><div><dt>Período</dt><dd>{rotuloPeriodo(d.periodo_inicio, d.periodo_fim)}</dd></div><div><dt>Coleta</dt><dd>{d.coletado_em.slice(0, 10).split("-").reverse().join("/")}</dd></div><div><dt>Amostra</dt><dd>{d.amostra_n == null ? "Não informada" : `${formatDecimal(d.amostra_n, 0)} anúncios`}</dd></div>{d.url_origem && <div><a className="text-primary underline" href={d.url_origem} target="_blank" rel="noopener noreferrer">Conferir fonte</a></div>}</dl>;
  return <section aria-labelledby="comparacao-fontes" className="space-y-4 border-t border-border pt-5">
    <h2 id="comparacao-fontes" className="font-display text-xl font-semibold">Comparar fontes de mercado</h2>
    <p className="text-sm text-muted-foreground">Prévias sem alterar a base pública. Diferenças só para o mesmo período; o recorte e a metodologia podem variar.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="space-y-1 text-sm"><span>Bairro</span><Select value={bairro} onValueChange={(v) => { setBairro(v); setInicio(""); setFim(""); limpar(); }}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{[...new Set([...(radar.data?.bairros.map((b) => b.name) ?? ["Mooca"]), "São Paulo"])].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-1 text-sm"><span>Início do período</span><Input className="text-base min-h-[44px]" type="date" value={inicio || base.data?.periodo_inicio || ""} onChange={(e) => { setInicio(e.target.value); limpar(); }} /></label>
      <label className="space-y-1 text-sm"><span>Fim do período</span><Input className="text-base min-h-[44px]" type="date" value={fim || base.data?.periodo_fim || ""} onChange={(e) => { setFim(e.target.value); limpar(); }} /></label>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <article className="min-w-0 rounded-md border border-border p-4 space-y-3"><h3 className="font-semibold">GuestFavorites · base aprovada</h3>{base.isLoading ? <p role="status">Consultando referência…</p> : base.isError ? <p role="alert">Não foi possível ler a referência. <Button variant="link" onClick={() => base.refetch()}>Tentar novamente</Button></p> : base.data ? metricas(base.data) : <p className="text-sm text-muted-foreground">Sem coleta GuestFavorites direta completa para este bairro.</p>}</article>
      {([['airdna', 'AirDNA'], ['airbnb', 'Airbnb']] as const).map(([id, nome]) => {
        const estado = fontes[id];
        const d = estado?.dados;
        const comparacao = d ? compararIndicadores(d.indicadores, base.data ? { ...base.data.indicadores, periodo_inicio: base.data.periodo_inicio, periodo_fim: base.data.periodo_fim } : null, d.periodo_inicio, d.periodo_fim) : null;
        return <article key={id} className="min-w-0 rounded-md border border-border p-4 space-y-3 break-words"><h3 className="font-semibold">{nome} · prévia</h3><Button variant="outline" className="min-h-[44px]" disabled={estado?.loading || base.isLoading || Object.values(fontes).some((s) => s.loading)} onClick={() => consultar(id)}>{estado?.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Consultar {nome}</Button>{estado?.loading && <p role="status">Consultando {nome}…</p>}{estado?.erro && <p role="alert" className="text-sm text-destructive">{estado.erro}</p>}{!estado && <p className="text-sm text-muted-foreground">{id === "airbnb" ? "Requer acesso autorizado a dados de mercado; bloqueios de calendário não são ocupação observada." : "Requer credencial Enterprise válida e métricas contratadas."}</p>}{d && <>{metricas(d)}<p className="text-sm text-muted-foreground">{d.filtros} {d.metodologia}</p>{comparacao?.diferencas && <p className="text-sm tabular-nums">Diferença vs. GuestFavorites: {formatBRL(comparacao.diferencas.diaria_brl)} · {formatDecimal(comparacao.diferencas.ocupacao_pp)} pontos percentuais</p>}<p className="text-sm text-muted-foreground">{comparacao?.motivo}</p></>}</article>;
      })}
    </div>
  </section>;
}