import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play } from "lucide-react";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { carregarResumoGuestFavorites } from "@/lib/resumoColetasGuestFavorites";
import { planejarGuestFavorites } from "@/lib/planejamentoGuestFavorites";
import { dispararColetaGuestFavorites, type ResumoColeta } from "@/lib/coletasPendentes";
import { useRadarRealtime } from "@/hooks/useRadarRealtime";
import { Button } from "@/components/ui/button";

const dataBR = (s: string) => s.split("-").reverse().join("/");
export default function BairrosSemGuestFavorites() {
  useRadarRealtime();
  const qc = useQueryClient();
  const [resultado, setResultado] = useState<{ bairro: string; resumo: ResumoColeta } | null>(null);
  const consulta = useQuery({ queryKey: ["radar_historico", "guestfavorites_resumo"], queryFn: carregarResumoGuestFavorites });
  const faltantes = planejarGuestFavorites(consulta.data ?? [], BAIRROS_CURADOS.map((b) => b.name), new Date().toISOString().slice(0, 10));
  const ler = useMutation({
    mutationFn: (bairro: string) => dispararColetaGuestFavorites(bairro),
    onMutate: () => setResultado(null),
    onSuccess: (resumo, bairro) => setResultado({ bairro, resumo }),
    onSettled: async () => {
      for (const chave of ["coletas_pendentes", "guestfavorites_execucao", "radar_historico"]) await qc.invalidateQueries({ queryKey: [chave] });
    },
  });
  return <section aria-labelledby="bairros-sem-coleta" className="space-y-4 border-b border-border pb-6">
    <h2 id="bairros-sem-coleta" className="font-display text-xl font-semibold">Bairros sem coleta GuestFavorites</h2>
    {consulta.isLoading ? <p role="status">Carregando cobertura…</p> : consulta.isError ? <p role="alert">Não foi possível carregar a cobertura. <Button variant="link" onClick={() => consulta.refetch()}>Tentar novamente</Button></p> : <>
      <p className="text-sm text-muted-foreground">{faltantes.length} bairros sem coleta direta ativa. Período sugerido até o último mês encerrado; a leitura usa o período publicado pela fonte.</p>
      {faltantes.length === 0 && <p>Todos os bairros têm coleta GuestFavorites completa e ativa.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">{faltantes.map((b) => <li key={b.bairro} className="min-w-0 rounded-md border border-border p-4 space-y-2">
        <h3 className="font-semibold">{b.bairro}</h3>
        <p className="text-sm text-muted-foreground">{b.status === "sem_coleta" ? "Sem coleta direta registrada" : "Coleta inativa ou incompleta"}</p>
        <p className="text-sm tabular-nums">Período sugerido: {dataBR(b.periodoInicio)} — {dataBR(b.periodoFim)}</p>
        <Button className="min-h-[44px]" disabled={ler.isPending} onClick={() => ler.mutate(b.bairro)}>
          {ler.isPending && ler.variables === b.bairro ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {ler.isPending && ler.variables === b.bairro ? "Lendo fonte…" : "Coletar este bairro"}
        </Button>
      </li>)}</ul>
    </>}
    {ler.isError && <p role="alert" className="text-sm text-destructive">{ler.error instanceof Error ? ler.error.message : "Leitura não concluída. Tente novamente."}</p>}
    {resultado && <div role="status" className="space-y-2 text-sm break-words">
      <p><strong>{resultado.bairro}</strong>: {resultado.resumo.lidos} página lida · {resultado.resumo.propostas} propostas · {resultado.resumo.semMudanca} sem mudança.</p>
      {resultado.resumo.erros.map((erro) => <p key={erro} className="text-destructive">{erro}</p>)}
      {resultado.resumo.erros.length > 0 && <p className="text-muted-foreground">Nenhum dado foi inventado. A fonte pode não ter uma página completa para este bairro.</p>}
    </div>}
    <Button variant="link" className="min-h-[44px] px-0" asChild><Link to="/admin/coletas">Ver andamento e aprovar propostas em Coletas</Link></Button>
  </section>;
}
