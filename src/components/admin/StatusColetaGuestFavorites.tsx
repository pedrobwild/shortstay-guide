import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const rotulos: Record<string, string> = { executando: "Leitura em andamento", concluida: "Leitura concluída", parcial: "Leitura concluída com erros", erro: "Leitura não concluída" };
export default function StatusColetaGuestFavorites() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["guestfavorites_execucao"], queryFn: async () => {
    const { data, error } = await supabase.from("radar_coleta_execucoes").select("id,status,origem,iniciado_em,finalizado_em,lidos,propostas,sem_mudanca,erros").order("iniciado_em", { ascending: false }).order("id").limit(1).maybeSingle();
    if (error) throw error;
    if (data && data.status !== "executando") void qc.invalidateQueries({ queryKey: ["coletas_pendentes"] });
    return data;
  }, refetchInterval: (q) => q.state.data?.status === "executando" ? 5000 : 60000 });
  const r = status.data;
  const expirou = r?.status === "executando" && Date.now() - Date.parse(r.iniciado_em) > 10 * 60 * 1000;
  return <div className="space-y-2 border-l-2 border-border pl-3 text-sm" aria-live="polite">
    {status.isLoading ? <p>Consultando última leitura…</p> : status.isError ? <p role="alert">Não foi possível consultar o status. <Button variant="link" onClick={() => status.refetch()}>Tentar novamente</Button></p> : !r ? <p className="text-muted-foreground">Nenhuma execução registrada.</p> : <>
      <p className="font-medium">{expirou ? "Leitura interrompida ou sem resposta" : rotulos[r.status]} · {r.origem === "externa" ? "agendador externo" : "manual"}</p>
      <p className="tabular-nums text-muted-foreground">Início: {new Date(r.iniciado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)</p>
      {r.finalizado_em && <p className="tabular-nums">{r.lidos} páginas lidas · {r.propostas} propostas · {r.sem_mudanca} sem mudança</p>}
      {Array.isArray(r.erros) && r.erros.length > 0 && <details><summary className="min-h-[44px] cursor-pointer py-3">Erros da leitura ({r.erros.length})</summary><ul className="space-y-1">{r.erros.map((e, i) => <li key={i} className="break-words text-muted-foreground">{String(e)}</li>)}</ul></details>}
    </>}
    <p className="text-muted-foreground">Agendamento externo: aguardando configuração e confirmação da primeira execução automática.</p>
  </div>;
}