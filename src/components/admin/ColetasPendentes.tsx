import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { aprovarColetaPendente, descartarColetaPendente, diferencasColeta, dispararColetaGuestFavorites, listarColetasPendentes, periodoColeta, type ColetaPendente, type ResumoColeta } from "@/lib/coletasPendentes";

const dataBR = (v: string | null) => (v ? v.slice(0, 10).split("-").reverse().join("/") : "—");
const CHAVES_INVALIDAR = [["radar_bairro_atual"], ["radar_historico"], ["bairro_airbnb_sp"], ["coletas_pendentes"]];

/**
 * Propostas lidas das páginas públicas da GuestFavorites. O admin vê "antes → depois" por
 * indicador e decide; aprovar roda admin_aprovar_coleta_pendente (mesma RPC das coletas
 * manuais, histórico preservado). Nada é aplicado automaticamente.
 */
export default function ColetasPendentes() {
  const qc = useQueryClient();
  const [resumo, setResumo] = useState<ResumoColeta | null>(null);
  const [aprovando, setAprovando] = useState<ColetaPendente | null>(null);
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const pendentes = useQuery({ queryKey: ["coletas_pendentes"], queryFn: listarColetasPendentes });
  const invalidar = () => Promise.all(CHAVES_INVALIDAR.map((queryKey) => qc.invalidateQueries({ queryKey })));

  const ler = useMutation({
    mutationFn: dispararColetaGuestFavorites,
    onSuccess: async (r) => { setResumo(r); await qc.invalidateQueries({ queryKey: ["coletas_pendentes"] }); },
    onError: (e) => toast({ title: "Leitura não concluída", description: e instanceof Error ? e.message : "Tente novamente.", variant: "destructive" }),
  });
  const aprovar = useMutation({
    mutationFn: (p: ColetaPendente) => aprovarColetaPendente(p.id),
    onSuccess: async (_, p) => { await invalidar(); toast({ title: `Coleta de ${p.bairro} aprovada`, description: "A anterior foi desativada e o histórico foi preservado." }); },
    onError: (e) => toast({ title: "Não foi possível aprovar", description: e instanceof Error ? e.message : "Tente novamente.", variant: "destructive" }),
    onSettled: () => setAprovando(null),
  });
  const descartar = useMutation({
    mutationFn: (p: ColetaPendente) => descartarColetaPendente(p.id, motivo[p.id]?.trim() ?? ""),
    onSuccess: async (_, p) => { await qc.invalidateQueries({ queryKey: ["coletas_pendentes"] }); toast({ title: `Proposta de ${p.bairro} descartada` }); },
    onError: (e) => toast({ title: "Não foi possível descartar", description: e instanceof Error ? e.message : "Tente novamente.", variant: "destructive" }),
  });
  const ocupado = aprovar.isPending || descartar.isPending;

  return <section className="space-y-4 border-t border-border pt-5" aria-labelledby="coleta-assistida">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 id="coleta-assistida" className="font-display text-xl font-semibold">Coleta assistida GuestFavorites</h2>
        <p className="text-sm text-muted-foreground">Lê as páginas públicas dos bairros da base e de São Paulo e propõe o que mudou. Nada entra na base sem a sua aprovação.</p>
      </div>
      <Button type="button" className="min-h-[44px]" disabled={ler.isPending} onClick={() => ler.mutate()}>
        {ler.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />} {ler.isPending ? "Lendo páginas…" : "Ler páginas agora"}
      </Button>
    </div>
    {resumo && <p role="status" className="rounded-md border border-border bg-muted/40 p-3 text-sm tabular-nums">
      {resumo.lidos} páginas lidas · {resumo.propostas} propostas · {resumo.semMudanca} sem mudança{resumo.erros.length > 0 && <> · {resumo.erros.length} com erro: <span className="break-words">{resumo.erros.join("; ")}</span></>}
    </p>}
    {pendentes.isLoading && <p role="status" className="text-sm">Carregando propostas…</p>}
    {pendentes.isError && <p role="alert" className="text-sm">Não foi possível carregar as propostas. <Button variant="link" className="h-auto p-0" onClick={() => pendentes.refetch()}>Tentar novamente</Button></p>}
    {pendentes.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma proposta aguardando decisão.</p>}
    <ul className="space-y-3">{pendentes.data?.map((p) => {
      const linhas = diferencasColeta(p);
      const periodo = periodoColeta(p);
      return <li key={p.id} className="space-y-3 rounded-md border border-border p-3 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">{p.bairro}{p.status === "erro" && <span className="ml-2 rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">leitura com erro</span>}</p>
          <p className="text-xs text-muted-foreground tabular-nums">lida em {dataBR(p.coletado_em)}{p.publicado_em && <> · página atualizada em {dataBR(p.publicado_em)}</>}</p>
        </div>
        <p className="text-muted-foreground tabular-nums">Período: {periodo.antes && periodo.mudou && <><s>{periodo.antes}</s> → </>}{periodo.depois}{!p.atual && <> · <strong>bairro sem coleta ativa</strong></>}</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[280px] text-left tabular-nums">
          <thead><tr className="text-xs text-muted-foreground"><th className="py-1 pr-2 font-medium">Indicador</th><th className="py-1 pr-2 font-medium">Atual</th><th className="py-1 font-medium">Proposta</th></tr></thead>
          <tbody>{linhas.map((l) => <tr key={l.chave} className={l.mudou ? "font-semibold" : "text-muted-foreground"}><td className="py-1 pr-2 font-normal">{l.label}</td><td className="py-1 pr-2">{l.antes ?? "—"}</td><td className="py-1">{l.depois ?? "—"}{l.mudou && <span className="sr-only"> (mudou)</span>}</td></tr>)}</tbody>
        </table></div>
        <a href={p.url_origem} target="_blank" rel="noopener noreferrer" className="break-all text-xs underline underline-offset-2">Conferir a página de origem</a>
        {p.motivo && <p className="break-words text-muted-foreground">{p.motivo}</p>}
        {p.status === "pendente" && <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 space-y-1 text-xs"><span>Motivo (opcional, fica no registro)</span><Input className="min-h-[44px] text-base" maxLength={500} value={motivo[p.id] ?? ""} onChange={(e) => setMotivo((m) => ({ ...m, [p.id]: e.target.value }))} /></label>
          <Button type="button" variant="outline" className="min-h-[44px]" disabled={ocupado} onClick={() => descartar.mutate(p)}><X className="h-4 w-4" aria-hidden /> Descartar</Button>
          <Button type="button" className="min-h-[44px]" disabled={ocupado} onClick={() => setAprovando(p)}><Check className="h-4 w-4" aria-hidden /> Aprovar</Button>
        </div>}
      </li>;
    })}</ul>
    <AlertDialog open={!!aprovando} onOpenChange={(o) => { if (!o) setAprovando(null); }}><AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>Aprovar a coleta de {aprovando?.bairro}?</AlertDialogTitle><AlertDialogDescription>Os números propostos passam a valer na base compartilhada (site e chat). As observações ativas anteriores deste bairro serão desativadas, sem apagar o histórico. A reserva offline (bairrosCurados.ts) precisa ser atualizada no código para ficar igual.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel disabled={aprovar.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={aprovar.isPending} onClick={(e) => { e.preventDefault(); if (aprovando) aprovar.mutate(aprovando); }}>{aprovar.isPending ? "Aprovando…" : "Confirmar aprovação"}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </section>;
}
