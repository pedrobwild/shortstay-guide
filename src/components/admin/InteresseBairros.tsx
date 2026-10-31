import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { carregarInteresseBairros } from "@/lib/bairrosInteresse";
import { bairroPath, SEO_BAIRROS } from "@/lib/seo";

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const numero = (n: number) => n.toLocaleString("pt-BR");

export default function InteresseBairros() {
  const [dias, setDias] = useState("30");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("visitas");
  const query = useQuery({ queryKey: ["admin_bairros_interesse", dias], queryFn: () => carregarInteresseBairros(Number(dias)), refetchInterval: 60000 });
  const linhas = (query.data ?? []).filter(l => normalizar(l.bairro).includes(normalizar(busca))).sort((a, b) =>
    ordem === "nome" ? a.bairro.localeCompare(b.bairro, "pt-BR") : ordem === "publicados" ? b.publicados - a.publicados || b.visitas - a.visitas || a.bairro.localeCompare(b.bairro, "pt-BR") : b.visitas - a.visitas || b.publicados - a.publicados || a.bairro.localeCompare(b.bairro, "pt-BR"));
  return <section aria-label="Imóveis e visitas por bairro" className="space-y-4 border-b border-border pb-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1"><h2 className="font-display text-2xl font-bold">Imóveis e visitas por bairro</h2><p className="text-sm text-muted-foreground">Imóveis publicados agora · visitas às páginas dos bairros no período</p></div>
      <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Atualizar bairros" title="Atualizar bairros" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /></Button>
    </header>
    <div className="grid gap-3 sm:grid-cols-3">
      <Input aria-label="Buscar bairro no relatório" placeholder="Buscar bairro" className="min-h-11 text-base" value={busca} onChange={e => setBusca(e.target.value)} />
      <Select value={dias} onValueChange={setDias}><SelectTrigger aria-label="Período de visitas por bairro" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>{[7, 30, 90].map(d => <SelectItem key={d} value={String(d)}>Últimos {d} dias</SelectItem>)}</SelectContent></Select>
      <Select value={ordem} onValueChange={setOrdem}><SelectTrigger aria-label="Ordenar bairros" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="visitas">Mais visitados</SelectItem><SelectItem value="publicados">Mais imóveis publicados</SelectItem><SelectItem value="nome">Nome do bairro</SelectItem></SelectContent></Select>
    </div>
    <p className="text-sm text-muted-foreground">Cobertura parcial: só visitas de quem aceitou cookies. Registros antigos sem bairro não entram na contagem. Visitas são visualizações, não pessoas únicas nem buscas no Google.</p>
    {query.isPending ? <p role="status" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Carregando bairros…</p> : query.isError ? <div role="alert" className="space-y-2 text-sm"><p>Não foi possível carregar imóveis e visitas.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div> : <>
      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4">{[["Imóveis publicados", (query.data ?? []).reduce((n, l) => n + l.publicados, 0)], ["Visitas registradas", (query.data ?? []).reduce((n, l) => n + l.visitas, 0)]].map(([label, total]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-display text-2xl tabular-nums">{numero(Number(total))}</dd></div>)}</dl>
      {!(query.data ?? []).some(l => l.visitas) && <p className="text-sm text-muted-foreground">Ainda não há visitas identificadas por bairro neste período.</p>}
      {!linhas.length ? <p className="text-sm text-muted-foreground">Nenhum bairro encontrado.</p> : <ul className="divide-y divide-border">{linhas.map(l => <li key={l.bairro} className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 py-3"><div className="min-w-0 space-y-1"><h3 className="font-display font-semibold break-words">{l.bairro}</h3><div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground"><span><strong className="text-foreground tabular-nums">{numero(l.publicados)}</strong> imóveis publicados</span><span><strong className="text-foreground tabular-nums">{numero(l.visitas)}</strong> visitas</span></div></div>{SEO_BAIRROS.includes(l.bairro) && <Button variant="ghost" size="icon" className="h-11 w-11" asChild><Link to={bairroPath(l.bairro)} aria-label={`Ver dados de ${l.bairro}`} title={`Ver dados de ${l.bairro}`}><ArrowUpRight className="h-4 w-4" /></Link></Button>}</li>)}</ul>}
      <p className="text-xs text-muted-foreground">Última consulta: {new Date(query.dataUpdatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · atualização a cada minuto</p>
    </>}
  </section>;
}