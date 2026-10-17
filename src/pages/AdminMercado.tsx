import { useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ArrowLeft, ArrowRight, ExternalLink, RefreshCw, Plus } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import FonteBairro from "@/components/guide/FonteBairro";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useRadarBase, rotuloPeriodo } from "@/lib/radarBase";
import { CONFIANCAS, NOMES_CONFIANCA, montarGraficoColetas, resumirConfianca, statusColetaBase, TAMANHO_HISTORICO, useHistoricoMercado, useUltimaColetaBase } from "@/lib/radarMonitoramento";
import { formatDecimal, formatPercent } from "@/lib/numberFormat";
import ColetaAuditoria from "@/components/admin/ColetaAuditoria";

const config = {
  alta: { label: "Alta", color: "hsl(var(--primary))" },
  media: { label: "Média", color: "hsl(var(--accent))" },
  baixa: { label: "Baixa", color: "hsl(var(--muted-foreground))" },
  quantidade: { label: "Bairros" },
  diaria: { label: "Diária média", color: "hsl(var(--primary))" },
};
const dataBR = (data: string | null) => data ? data.slice(0, 10).split("-").reverse().join("/") : "Não informada";
const horarioBR = (data: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(data));

export default function AdminMercado() {
  const radar = useRadarBase();
  const ultima = useUltimaColetaBase();
  const [confianca, setConfianca] = useState("todas");
  const [bairro, setBairro] = useState("todos");
  const [pagina, setPagina] = useState(0);
  const historico = useHistoricoMercado(bairro, pagina);
  const bairros = radar.data?.offline ? [] : radar.data?.bairros ?? [];
  const resumo = resumirConfianca(bairros);
  const filtrados = bairros.filter((b) => (confianca === "todas" || b.confianca === confianca) && (bairro === "todos" || b.name === bairro));
  const totalPaginas = Math.max(1, Math.ceil((historico.data?.total ?? 0) / TAMANHO_HISTORICO));
  const coletasGrafico = montarGraficoColetas(historico.data?.linhas ?? []);
  return <div className="min-h-screen bg-background"><AppNavbar /><main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
    <AdminTabs />
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-2xl font-bold">Acompanhamento do mercado</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={radar.isFetching || historico.isFetching || ultima.isFetching} onClick={() => { void radar.refetch(); void historico.refetch(); void ultima.refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
        <Button asChild><Link to="/admin/coletas"><Plus className="mr-2 h-4 w-4" />Nova coleta</Link></Button>
      </div>
    </header>
    <section className="space-y-4 border-b border-border pb-6" aria-labelledby="base-titulo">
      <h2 id="base-titulo" className="font-display text-xl font-semibold">Atualização da base compartilhada</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <h3 className="font-semibold">Radar Bewild · última coleta registrada</h3>
          {ultima.isLoading ? <p role="status">Consultando última atualização…</p> : ultima.isError ? <p role="alert" className="text-destructive">Última atualização indisponível. <Button variant="link" onClick={() => ultima.refetch()}>Tentar novamente</Button></p> : ultima.data ? <>
            <p>{ultima.data.bairro} · coleta {dataBR(ultima.data.coletado_em)}</p>
            <p className="text-sm tabular-nums">Registro na base: {horarioBR(ultima.data.created_at)} (Brasília)</p>
            <p className="text-sm">{statusColetaBase(ultima.data.ativo).base === "ativa" ? "Ativa na base" : "Preservada no histórico"}</p>
            <ColetaAuditoria auditoria={ultima.data.radar_coleta_auditoria} />
          </> : <p className="text-muted-foreground">Nenhuma coleta registrada.</p>}
        </div>
        <div className="min-w-0 space-y-2">
          <h3 className="font-semibold">Site Bewild · conexão não verificada</h3>
          <p className="text-sm text-muted-foreground">Última leitura pelo site: não confirmada. Os registros abaixo pertencem à base; não comprovam envio ou recebimento entre os sites.</p>
          <p className="text-sm text-muted-foreground">Origem do site não registrada; UTMs indicam o acesso, não a origem da gravação.</p>
        </div>
      </div>
    </section>
    <section className="space-y-4" aria-labelledby="confianca-titulo">
      <h2 id="confianca-titulo" className="font-display text-xl font-semibold">Bairros por confiança</h2>
      {radar.isLoading ? <p role="status">Carregando dados de mercado…</p> : radar.isError || radar.data?.offline ? <p role="alert" className="text-destructive">Dados de mercado indisponíveis. <Button variant="link" onClick={() => radar.refetch()}>Tentar novamente</Button></p> : bairros.length === 0 ? <p className="text-muted-foreground">Nenhum bairro disponível.</p> : <>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">{resumo.map((r) => <p key={r.confianca}><span className="font-semibold tabular-nums">{r.quantidade}</span> · confiança {r.nome.toLowerCase()}</p>)}</div>
        <ChartContainer config={config} className="h-56 w-full aspect-auto" aria-label="Distribuição de bairros por confiança">
          <BarChart data={resumo} accessibilityLayer margin={{ left: -20, right: 12, top: 12 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="nome" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="quantidade" maxBarSize={100} radius={[4, 4, 0, 0]} isAnimationActive={false}>{resumo.map((r) => <Cell key={r.confianca} fill={`var(--color-${r.confianca})`} />)}</Bar>
          </BarChart>
        </ChartContainer>
      </>}
    </section>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm"><span>Bairro / referência</span><Select value={bairro} onValueChange={(v) => { setBairro(v); setPagina(0); }}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{[...bairros.map((b) => b.name), "São Paulo"].map((nome) => <SelectItem key={nome} value={nome}>{nome}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-2 text-sm"><span>Confiança atual dos bairros</span><Select value={confianca} onValueChange={setConfianca}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{CONFIANCAS.map((c) => <SelectItem key={c} value={c}>{NOMES_CONFIANCA[c]}</SelectItem>)}</SelectContent></Select></label>
    </div>
    {!radar.isLoading && !radar.data?.offline && <section className="space-y-4" aria-labelledby="bairros-titulo"><h2 id="bairros-titulo" className="font-display text-xl font-semibold">Dados atuais por bairro</h2>
      {filtrados.length === 0 && <p className="text-muted-foreground">Nenhum bairro neste filtro.</p>}
      <ul className="divide-y divide-border">{filtrados.map((b) => <li key={b.name} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-2"><h3 className="font-semibold">{b.name} <span className="text-sm font-normal text-muted-foreground">· confiança {b.confianca ? NOMES_CONFIANCA[b.confianca].toLowerCase() : "não informada"}</span></h3><FonteBairro nome={b.name} /></div>
        <p className="text-sm tabular-nums sm:text-right">Diária média <strong>R$ {formatDecimal(b.dailyAvg, 2)}</strong><br />Ocupação <strong>{formatPercent(b.avgOccupancy)}</strong></p>
      </li>)}</ul>
    </section>}
    <section className="space-y-4 border-t border-border pt-6" aria-labelledby="historico-titulo">
      <h2 id="historico-titulo" className="font-display text-xl font-semibold">Histórico de coletas{bairro !== "todos" ? ` — ${bairro}` : ""}</h2>
      {historico.isLoading && <p role="status">Carregando histórico…</p>}
      {historico.isError && <p role="alert" className="text-destructive">Não foi possível carregar o histórico. <Button variant="link" onClick={() => historico.refetch()}>Tentar novamente</Button></p>}
      {historico.data?.total === 0 && <p className="text-muted-foreground">Nenhuma coleta registrada.</p>}
      {!historico.isLoading && !historico.isError && coletasGrafico.length > 0 && <div className="space-y-3">
        <h3 className="font-semibold">Diária média das coletas · página {pagina + 1}</h3>
        <ChartContainer config={config} className="w-full aspect-auto" style={{ height: Math.max(240, coletasGrafico.length * 48) }} aria-label="Diária média por coleta registrada">
          <BarChart data={coletasGrafico} layout="vertical" accessibilityLayer margin={{ left: 0, right: 20 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${formatDecimal(Number(v), 0)}`} />
            <YAxis type="category" dataKey="rotulo" width={115} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={({ active, payload }) => {
              const coleta = payload?.[0]?.payload as typeof coletasGrafico[number] | undefined;
              if (!active || !coleta) return null;
              return <div className="max-w-[240px] space-y-2 rounded-md border border-border bg-background p-3 text-sm shadow-md">
                <p className="font-semibold">{coleta.rotulo}</p>
                <p className="tabular-nums">R$ {formatDecimal(coleta.diaria, 2)} · {coleta.ativo ? "Ativa" : "Inativa"}</p>
                <ColetaAuditoria auditoria={coleta.radar_coleta_auditoria} />
              </div>;
            }} />
            <Bar dataKey="diaria" fill="var(--color-diaria)" maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </div>}
      <ul className="divide-y divide-border">{historico.data?.linhas.map((r) => <li key={r.id} className="space-y-2 py-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{r.bairro} · {dataBR(r.coletado_em)}</h3><span className="rounded border border-border px-2 py-1">{r.ativo ? "Ativa" : "Inativa"}</span></div>
        <p>{r.radar_fontes?.nome ?? r.fonte_id} · {rotuloPeriodo(r.periodo_inicio, r.periodo_fim) ?? "Sem período informado"}</p>
        <p className="tabular-nums">Diária média R$ {formatDecimal(Number(r.valor), 2)} · {r.amostra_n == null ? "Amostra não informada" : `n=${formatDecimal(r.amostra_n, 0)} anúncios`}</p>
        {r.publicado_em && <p className="text-muted-foreground">Publicação da fonte: {dataBR(r.publicado_em)}</p>}
        <ColetaAuditoria auditoria={r.radar_coleta_auditoria} />
        <p className="text-muted-foreground">Site Bewild: {statusColetaBase(r.ativo).bewild === "nao_verificada" ? "leitura não confirmada" : ""} · origem do registro não informada</p>
        {r.observacao && <p className="break-words text-muted-foreground">{r.observacao}</p>}
        {r.url_origem && <Button asChild variant="link" className="h-auto min-h-[44px] px-0"><a href={r.url_origem} target="_blank" rel="noopener noreferrer">Ver fonte<ExternalLink className="ml-2 h-4 w-4" /></a></Button>}
      </li>)}</ul>
      {!!historico.data?.total && <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="tabular-nums">{historico.data.total} coletas · página {pagina + 1} de {totalPaginas}</p><div className="flex gap-2"><Button variant="outline" aria-label="Página anterior" disabled={pagina === 0 || historico.isFetching} onClick={() => setPagina((p) => p - 1)}><ArrowLeft className="h-4 w-4" /></Button><Button variant="outline" aria-label="Próxima página" disabled={pagina + 1 >= totalPaginas || historico.isFetching} onClick={() => setPagina((p) => p + 1)}><ArrowRight className="h-4 w-4" /></Button></div></div>}
    </section>
  </main></div>;
}