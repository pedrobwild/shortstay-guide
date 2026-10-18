import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Clock3, RefreshCw } from "lucide-react";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { carregarResumoGuestFavorites, resumirColetasGuestFavorites } from "@/lib/resumoColetasGuestFavorites";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRadarRealtime } from "@/hooks/useRadarRealtime";

const dataBR = (v: string | null) => v ? v.split("-").reverse().join("/") : "Não informado";
export default function HistoricoGuestFavorites() {
  useRadarRealtime();
  const [bairro, setBairro] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [pagina, setPagina] = useState(0);
  const consulta = useQuery({ queryKey: ["radar_historico", "guestfavorites_resumo"], queryFn: carregarResumoGuestFavorites });
  const resumo = resumirColetasGuestFavorites(consulta.data ?? [], [...BAIRROS_CURADOS.map((b) => b.name), "São Paulo"]);
  const faltantes = resumo.cobertura.filter((r) => r.status !== "ativa");
  const filtradas = resumo.coletas.filter((r) => (bairro === "todos" || r.bairro === bairro) && (status === "todos" || (status === "ativa" ? r.ativa : !r.ativa)));
  const paginas = Math.max(1, Math.ceil(filtradas.length / 20));
  const atual = Math.min(pagina, paginas - 1);
  return <section className="space-y-4 border-t border-border pt-5" aria-labelledby="historico-guestfavorites">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="historico-guestfavorites" className="font-display text-xl font-semibold">Histórico GuestFavorites</h2>
      <Button variant="outline" className="min-h-[44px]" disabled={consulta.isFetching} onClick={() => consulta.refetch()}><RefreshCw className={consulta.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden /> Atualizar histórico</Button>
    </div>
    {consulta.isLoading ? <p role="status">Carregando histórico GuestFavorites…</p> : consulta.isError ? <p role="alert" className="text-destructive">Não foi possível consultar o histórico. <Button variant="link" onClick={() => consulta.refetch()}>Tentar novamente</Button></p> : <>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm tabular-nums"><p><strong>{resumo.coletas.length}</strong> coletas registradas</p><p><strong>{resumo.cobertura.filter((r) => r.status === "ativa").length}</strong> referências com coleta ativa</p><p><strong>{faltantes.length}</strong> referências sem coleta ativa</p></div>
      <details className="border-b border-border pb-4" open={faltantes.length > 0}>
        <summary className="min-h-[44px] cursor-pointer py-3 font-medium">O que falta — {faltantes.length} referências sem coleta GuestFavorites ativa</summary>
        {faltantes.length === 0 ? <p className="text-sm text-muted-foreground">Todas as referências têm uma coleta GuestFavorites ativa.</p> : <ul className="space-y-2 text-sm">{faltantes.map((r) => <li key={r.bairro} className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><span><strong>{r.bairro}</strong> · {r.status === "sem_coleta" ? "Sem coleta direta GuestFavorites registrada" : "Sem coleta ativa"}{r.ultima && <> · última coleta: {dataBR(r.ultima.coletado_em)}</>}</span></li>)}</ul>}
      </details>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0 space-y-1 text-sm"><span>Bairro no histórico</span><Select value={bairro} onValueChange={(v) => { setBairro(v); setPagina(0); }}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os bairros</SelectItem>{resumo.cobertura.map((r) => <SelectItem key={r.bairro} value={r.bairro}>{r.bairro}</SelectItem>)}</SelectContent></Select></label>
        <label className="min-w-0 space-y-1 text-sm"><span>Status no histórico</span><Select value={status} onValueChange={(v) => { setStatus(v); setPagina(0); }}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="ativa">Ativa</SelectItem><SelectItem value="inativa">Inativa ou incompleta</SelectItem></SelectContent></Select></label>
      </div>
      {filtradas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma coleta GuestFavorites encontrada para estes filtros.</p>}
      <ul className="space-y-3">{filtradas.slice(atual * 20, atual * 20 + 20).map((r) => <li key={r.id} className="space-y-2 rounded-md border border-border p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{r.bairro}</h3><span className="inline-flex items-center gap-1 text-muted-foreground">{r.ativa ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Clock3 className="h-4 w-4" aria-hidden />}{!r.completa ? "Incompleta" : r.ativa ? "Ativa" : "Inativa"}</span></div>
        <p>Fonte: {r.radar_fontes?.nome ?? "GuestFavorites"}</p><p className="tabular-nums text-muted-foreground">Período: {dataBR(r.periodo_inicio)} — {dataBR(r.periodo_fim)}</p><p className="tabular-nums text-muted-foreground">Coletado em: {dataBR(r.coletado_em)}</p>
        {r.url_origem && <a href={r.url_origem} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-2">Conferir fonte</a>}
      </li>)}</ul>
      {filtradas.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" className="min-h-[44px]" disabled={atual === 0} onClick={() => setPagina(atual - 1)}>Anterior</Button><span className="text-sm tabular-nums">Página {atual + 1} de {paginas}</span><Button variant="outline" className="min-h-[44px]" disabled={atual + 1 >= paginas} onClick={() => setPagina(atual + 1)}>Próxima</Button></div>}
    </>}
  </section>;
}