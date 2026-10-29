import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { agruparOrigens, carregarAcessos, carregarContatos, contasNoPeriodo, resumirAcessos } from "@/lib/analyticsAcessos";
import { exportarUsuarios } from "@/lib/categoriasRadar";
import { Link } from "react-router-dom";

const numero = (n: number) => n.toLocaleString("pt-BR");
const rotulos: Record<string, string> = { page_view: "Visualização", simulator_used: "Uso do simulador", mobile: "Celular", tablet: "Tablet", desktop: "Computador" };
function Lista({ titulo, linhas }: { titulo: string; linhas: { nome: string; total: number }[] }) {
  return <section className="min-w-0 space-y-3"><h2 className="font-display text-lg font-semibold">{titulo}</h2><ul className="divide-y divide-border">{linhas.map(l => <li key={l.nome} className="flex justify-between gap-4 py-3 text-sm"><span className="min-w-0 break-words">{rotulos[l.nome] ?? l.nome}</span><span className="tabular-nums shrink-0">{numero(l.total)}</span></li>)}</ul>{!linhas.length && <p className="text-sm text-muted-foreground">Nenhum registro no período.</p>}</section>;
}

export default function AdminAnalytics() {
  const [dias, setDias] = useState("30");
  const query = useQuery({ queryKey: ["admin_analytics", dias], queryFn: () => carregarAcessos(Number(dias)), refetchInterval: 60000 });
  const resumo = query.data ? resumirAcessos(query.data) : null;
  const origens = query.data ? agruparOrigens(query.data) : [];
  const contatos = useQuery({ queryKey: ["admin_analytics_contatos", dias], queryFn: () => carregarContatos(Number(dias)), refetchInterval: 60000 });
  const contas = useQuery({ queryKey: ["admin_analytics_contas"], queryFn: () => exportarUsuarios("todos", ""), refetchInterval: 300000 });
  const resumoContas = contas.data ? contasNoPeriodo(contas.data.usuarios, Number(dias)) : null;
  return <div className="min-h-screen bg-background text-foreground"><AppNavbar /><main id="conteudo" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <AdminTabs />
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3"><BarChart3 className="h-7 w-7 shrink-0 text-primary" />Relatório do Radar</h1><p className="text-sm text-muted-foreground">Registros do Radar · visitantes que aceitaram cookies · horário de São Paulo</p></div><div className="flex items-center gap-2"><Select value={dias} onValueChange={setDias}><SelectTrigger aria-label="Período de acessos" className="w-44 min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{[7, 30, 90].map(d => <SelectItem key={d} value={String(d)}>Últimos {d} dias</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon" className="h-11 w-11" title="Atualizar acessos" aria-label="Atualizar acessos" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /></Button></div></header>
    <p className="border-l-2 border-primary pl-4 text-sm text-muted-foreground">Cobertura parcial: a medição existente registra a abertura do guia e interações com ferramentas, não todos os acessos ao site. Sessões registradas não representam pessoas únicas. Estes números não são relatórios do Google Analytics nem do Lovable.</p>
    {query.isLoading && <p role="status" className="flex gap-2 items-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando acessos…</p>}
    {query.isError && <div role="alert" className="border border-destructive rounded-lg p-4 space-y-2"><p>Não foi possível carregar os acessos.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>}
    {resumo && !query.isError && <>
      <dl className="grid gap-4 sm:grid-cols-3">{[["Visualizações registradas", resumo.visualizacoes], ["Sessões com visualização", resumo.sessoes], ["Interações registradas", resumo.interacoes]].map(([label, value]) => <div key={label} className="border border-border bg-card rounded-lg p-5"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-display text-3xl tabular-nums mt-2">{numero(Number(value))}</dd></div>)}</dl>
      {!query.data?.length ? <p className="py-10 text-center text-muted-foreground">Nenhum acesso consentido registrado neste período.</p> : <><section className="space-y-4"><h2 className="font-display text-lg font-semibold">Visualizações por dia</h2><div className="h-64 w-full overflow-hidden" aria-label="Visualizações registradas por dia"><ResponsiveContainer width="100%" height="100%"><BarChart data={resumo.porDia} margin={{ left: 0, right: 8 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="nome" tickFormatter={v => String(v).slice(5).split("-").reverse().join("/")} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} /><YAxis allowDecimals={false} width={40} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} /><Tooltip labelFormatter={v => String(v).split("-").reverse().join("/")} formatter={v => [numero(Number(v)), "Visualizações"]} contentStyle={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} /><Bar isAnimationActive={false} dataKey="total" fill="hsl(var(--primary))" maxBarSize={40} /></BarChart></ResponsiveContainer></div></section><div className="grid gap-8 md:grid-cols-2"><Lista titulo="Aparelhos · visualizações" linhas={resumo.aparelhos} /><Lista titulo="Páginas registradas" linhas={resumo.paginas} /><Lista titulo="Origens das visitas" linhas={origens} /><Lista titulo="Eventos registrados" linhas={resumo.eventos} /></div></>}
      <p className="text-xs text-muted-foreground">Última consulta: {new Date(query.dataUpdatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · atualização a cada minuto</p>
    </>}
    <section className="grid gap-4 sm:grid-cols-2" aria-label="Contatos e contas">
      <div className="border border-border bg-card rounded-lg p-5 space-y-2 min-w-0"><h2 className="font-display text-lg font-semibold">Contatos recebidos</h2>
        {contatos.isLoading ? <p role="status" className="text-sm text-muted-foreground">Carregando contatos…</p> : contatos.isError ? <div role="alert" className="text-sm space-y-2"><p>Não foi possível carregar os contatos.</p><Button variant="outline" onClick={() => contatos.refetch()}>Tentar novamente</Button></div> : <>
          <p className="font-display text-3xl tabular-nums">{numero(contatos.data?.length ?? 0)}</p><p className="text-sm text-muted-foreground">no período escolhido</p>
          {contatos.data?.length ? <ul className="divide-y divide-border text-sm">{contatos.data.slice(0, 5).map(c => <li key={c.id} className="flex justify-between gap-3 py-2"><span className="min-w-0 break-words">{c.neighborhood || c.objective || "Sem bairro informado"}</span><span className="shrink-0 tabular-nums text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum contato no período.</p>}
          <Button variant="outline" asChild className="min-h-[44px]"><Link to="/admin/leads">Ver contatos</Link></Button></>}
      </div>
      <div className="border border-border bg-card rounded-lg p-5 space-y-2 min-w-0"><h2 className="font-display text-lg font-semibold">Contas cadastradas</h2>
        {contas.isLoading ? <p role="status" className="text-sm text-muted-foreground">Carregando contas…</p> : contas.isError ? <div role="alert" className="text-sm space-y-2"><p>Não foi possível carregar as contas.</p><Button variant="outline" onClick={() => contas.refetch()}>Tentar novamente</Button></div> : resumoContas && <>
          <p className="font-display text-3xl tabular-nums">{numero(resumoContas.total)}</p><p className="text-sm text-muted-foreground">contas no total · {numero(resumoContas.novas)} criadas no período ({numero(resumoContas.novosClientes)} de visitantes)</p>
          <Button variant="outline" asChild className="min-h-[44px]"><Link to="/admin/usuarios">Ver contas</Link></Button></>}
      </div>
    </section>
    <footer className="border-t border-border pt-5 space-y-3"><p className="text-sm text-muted-foreground">Este relatório usa só os registros do próprio Radar, sem depender do GA4. O Search Console mede buscas no Google, não o total de visitas.</p><div className="flex flex-wrap gap-3"><Button variant="outline" asChild><a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Google Analytics<ExternalLink className="h-4 w-4 ml-2" /></a></Button><Button variant="outline" asChild><a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Search Console<ExternalLink className="h-4 w-4 ml-2" /></a></Button></div></footer>
  </main></div>;
}