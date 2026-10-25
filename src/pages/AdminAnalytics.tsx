import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { carregarAcessos, resumirAcessos } from "@/lib/analyticsAcessos";

const numero = (n: number) => n.toLocaleString("pt-BR");
const rotulos: Record<string, string> = { page_view: "Visualização", simulator_used: "Uso do simulador", mobile: "Celular", tablet: "Tablet", desktop: "Computador" };
function Lista({ titulo, linhas }: { titulo: string; linhas: { nome: string; total: number }[] }) {
  return <section className="min-w-0 space-y-3"><h2 className="font-display text-lg font-semibold">{titulo}</h2><ul className="divide-y divide-border">{linhas.map(l => <li key={l.nome} className="flex justify-between gap-4 py-3 text-sm"><span className="min-w-0 break-words">{rotulos[l.nome] ?? l.nome}</span><span className="tabular-nums shrink-0">{numero(l.total)}</span></li>)}</ul>{!linhas.length && <p className="text-sm text-muted-foreground">Nenhum registro no período.</p>}</section>;
}

export default function AdminAnalytics() {
  const [dias, setDias] = useState("30");
  const query = useQuery({ queryKey: ["admin_analytics", dias], queryFn: () => carregarAcessos(Number(dias)), refetchInterval: 60000 });
  const resumo = query.data ? resumirAcessos(query.data) : null;
  return <div className="min-h-screen bg-background text-foreground"><AppNavbar /><main id="conteudo" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <AdminTabs />
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3"><BarChart3 className="h-7 w-7 shrink-0 text-primary" />Analytics de acessos</h1><p className="text-sm text-muted-foreground">Registros do Radar · visitantes que aceitaram cookies · horário de São Paulo</p></div><div className="flex items-center gap-2"><Select value={dias} onValueChange={setDias}><SelectTrigger aria-label="Período de acessos" className="w-44 min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{[7, 30, 90].map(d => <SelectItem key={d} value={String(d)}>Últimos {d} dias</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon" className="h-11 w-11" title="Atualizar acessos" aria-label="Atualizar acessos" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /></Button></div></header>
    <p className="border-l-2 border-primary pl-4 text-sm text-muted-foreground">Cobertura parcial: a medição existente registra a abertura do guia e interações com ferramentas, não todos os acessos ao site. Sessões registradas não representam pessoas únicas. Estes números não são relatórios do Google Analytics nem do Lovable.</p>
    {query.isLoading && <p role="status" className="flex gap-2 items-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando acessos…</p>}
    {query.isError && <div role="alert" className="border border-destructive rounded-lg p-4 space-y-2"><p>Não foi possível carregar os acessos.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>}
    {resumo && !query.isError && <>
      <dl className="grid gap-4 sm:grid-cols-3">{[["Visualizações registradas", resumo.visualizacoes], ["Sessões com visualização", resumo.sessoes], ["Interações registradas", resumo.interacoes]].map(([label, value]) => <div key={label} className="border border-border bg-card rounded-lg p-5"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-display text-3xl tabular-nums mt-2">{numero(Number(value))}</dd></div>)}</dl>
      {!query.data?.length ? <p className="py-10 text-center text-muted-foreground">Nenhum acesso consentido registrado neste período.</p> : <><section className="space-y-4"><h2 className="font-display text-lg font-semibold">Visualizações por dia</h2><div className="h-64 w-full overflow-hidden" aria-label="Visualizações registradas por dia"><ResponsiveContainer width="100%" height="100%"><BarChart data={resumo.porDia} margin={{ left: 0, right: 8 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="nome" tickFormatter={v => String(v).slice(5).split("-").reverse().join("/")} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} /><YAxis allowDecimals={false} width={40} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} /><Tooltip labelFormatter={v => String(v).split("-").reverse().join("/")} formatter={v => [numero(Number(v)), "Visualizações"]} contentStyle={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} /><Bar isAnimationActive={false} dataKey="total" fill="hsl(var(--primary))" maxBarSize={40} /></BarChart></ResponsiveContainer></div></section><div className="grid gap-8 md:grid-cols-2"><Lista titulo="Aparelhos · visualizações" linhas={resumo.aparelhos} /><Lista titulo="Páginas registradas" linhas={resumo.paginas} /><Lista titulo="Eventos registrados" linhas={resumo.eventos} /></div></>}
      <p className="text-xs text-muted-foreground">Última consulta: {new Date(query.dataUpdatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · atualização a cada minuto</p>
    </>}
    <footer className="border-t border-border pt-5 space-y-3"><p className="text-sm text-muted-foreground">Relatórios GA4 não conectados ao painel. O Search Console mede buscas no Google, não o total de visitas.</p><div className="flex flex-wrap gap-3"><Button variant="outline" asChild><a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Google Analytics<ExternalLink className="h-4 w-4 ml-2" /></a></Button><Button variant="outline" asChild><a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Search Console<ExternalLink className="h-4 w-4 ml-2" /></a></Button></div></footer>
  </main></div>;
}