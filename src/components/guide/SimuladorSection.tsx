import { trackSimulationShared, trackSimulationUsed } from "@/lib/marketingConsent";
import { lembrarSimulacao } from "@/lib/retomada";
import { criarProjetoDaSimulacao, savePendingProvision } from "@/lib/leadProvisioning";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { caminhoSimulacao, campoParaInteiro, lerPremissas, temPremissasAlemDoBairro, type ObjetivoSimulador } from "@/lib/simulacaoLink";
import { resultadoLiquidoMensal, rotuloDecoracao } from "@/lib/bairroAjustes";
import OrcamentoButton from "@/components/OrcamentoButton";
import { formatDecimal } from "@/lib/numberFormat";
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowUpRight, FileText, Copy, Check, Bookmark, Columns2, Trash2, Share2, MessageCircle, Info, FolderPlus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { useBairroData } from "@/hooks/useBairroData";
import SectionBlock from "./SectionBlock";
import { fmt, type SavedScenario, loadScenarios, persistScenarios } from "@/data/guide-data";
import { slugifyBairro } from "@/lib/seo";

type CellValue = string | number | null | undefined;

export default function SimuladorSection() {
  const { bairros } = useBairroData();
  const [simBairro, setSimBairro] = useState<string>(bairros[0]?.name ?? "");
  const [simMetragem, setSimMetragem] = useState(30);
  const [simOcupacao, setSimOcupacao] = useState([75]);
  const [simDiariaAtual, setSimDiariaAtual] = useState("");
  const [simObjetivo, setSimObjetivo] = useState("maximizar");
  const [simReformaBudget, setSimReformaBudget] = useState("");
  const [rateBoost, setRateBoost] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Começa vazio no SSR e carrega no navegador, para o HTML pré-renderizado e a hidratação coincidirem.
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  useEffect(() => { const salvos = loadScenarios(); if (salvos.length) setScenarios(salvos); }, []);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [recebida, setRecebida] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.bairro) setSimBairro(detail.bairro);
      if (detail.diaria) setSimDiariaAtual(detail.diaria);
      if (detail.ocupacao) setSimOcupacao([detail.ocupacao]);
      if (detail.boost !== undefined) setRateBoost(detail.boost);
    };
    window.addEventListener("populate-simulator", handler);
    return () => window.removeEventListener("populate-simulator", handler);
  }, []);

  // Premissas vindas da URL: página de bairro ("/?bairro=pinheiros#simulador") ou
  // link compartilhado (bairro, metragem, ocupação, diária, objetivo, boost, reforma).
  // Só lê a URL no navegador; aplica uma vez, quando a lista de bairros contém o slug pedido.
  const premissasAplicadas = useRef(false);
  useEffect(() => {
    if (premissasAplicadas.current || typeof window === "undefined") return;
    const p = lerPremissas(window.location.search);
    if (!p.bairro && !temPremissasAlemDoBairro(p)) { premissasAplicadas.current = true; return; }
    const alvo = p.bairro ? bairros.find((b) => slugifyBairro(b.name) === p.bairro) : undefined;
    if (p.bairro && !alvo) return; // lista ainda carregando (ou bairro fora da base): tenta de novo quando mudar
    if (alvo) setSimBairro(alvo.name);
    if (p.metragem !== undefined) setSimMetragem(p.metragem);
    if (p.ocupacao !== undefined) setSimOcupacao([p.ocupacao]);
    if (p.diaria !== undefined) setSimDiariaAtual(String(p.diaria));
    if (p.objetivo) setSimObjetivo(p.objetivo);
    if (p.boost !== undefined) setRateBoost(p.boost);
    if (p.reforma !== undefined) setSimReformaBudget(String(p.reforma));
    if (temPremissasAlemDoBairro(p)) setRecebida(true);
    premissasAplicadas.current = true;
  }, [bairros]);

  const selected = bairros.find((b) => b.name === simBairro) ?? bairros[0];

  const sim = useMemo(() => {
    const baseDaily = simDiariaAtual ? Number(simDiariaAtual) : selected.dailyAvg;
    let occMod = 0, dailyMod = 0;
    if (simObjetivo === "maximizar") { occMod = 5; } else if (simObjetivo === "estabilidade") { dailyMod = -10; } else if (simObjetivo === "premium") { occMod = -10; dailyMod = 20; }
    const adjustedDaily = baseDaily * (1 + dailyMod / 100);
    const adjustedOcc = Math.min(95, Math.max(30, simOcupacao[0] + occMod));
    const boostedDaily = adjustedDaily * (1 + rateBoost / 100);
    const nights = 30 * (adjustedOcc / 100);
    const receitaMensal = Math.round(boostedDaily * nights);
    const receitaAnual = receitaMensal * 12;
    const baseMensal = Math.round(baseDaily * (30 * (simOcupacao[0] / 100)));
    const delta = receitaMensal - baseMensal;
    const budget = Number(simReformaBudget) || 0;
    const paybackMonths = delta > 0 && budget > 0 ? Math.ceil(budget / delta) : null;
    return { baseDaily: Math.round(baseDaily), boostedDaily: Math.round(boostedDaily), receitaMensal, receitaAnual, baseMensal, delta, paybackMonths, adjustedOcc };
  }, [selected, simDiariaAtual, simOcupacao, rateBoost, simReformaBudget, simObjetivo]);

  const linkSimulacao = () => {
    const caminho = caminhoSimulacao({
      bairro: simBairro,
      metragem: simMetragem,
      ocupacao: simOcupacao[0],
      diaria: campoParaInteiro(simDiariaAtual),
      objetivo: simObjetivo as ObjetivoSimulador,
      boost: rateBoost,
      reforma: campoParaInteiro(simReformaBudget),
    });
    return typeof window === "undefined" ? caminho : `${window.location.origin}${caminho}`;
  };
  const summaryText = useMemo(() => {
    return `📊 Simulação de Receita — Short Stay\n\nBairro: ${simBairro}\nMetragem: ${simMetragem}m²\nOcupação: ${formatDecimal(simOcupacao[0], 0)}%\nDiária base: R$ ${fmt(sim.baseDaily)}\n` +
      (rateBoost > 0 ? `Diária c/ boost +${rateBoost}%: R$ ${fmt(sim.boostedDaily)}\n` : "") +
      `\nReceita mensal: R$ ${fmt(sim.receitaMensal)}\nReceita anual: R$ ${fmt(sim.receitaAnual)}\n` +
      (sim.paybackMonths ? `\nPayback da reforma: ~${sim.paybackMonths} meses\n` : "") +
      `\nAbrir esta simulação: ${linkSimulacao()}\nGerado no Radar Bewild · radarbewild.com.br`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simBairro, simMetragem, simOcupacao, sim, rateBoost, simDiariaAtual, simObjetivo, simReformaBudget]);

  // Guardar a simulação na conta: logado cria o projeto já; sem conta, guarda a intenção
  // (bairro e m²) e leva ao cadastro — o projeto é criado ao entrar (PostLoginProvision).
  const guardarNoPainel = async () => {
    const intent = { neighborhood: simBairro, area_sqm: String(simMetragem) };
    trackGlobal("cta_clicked", { cta_id: user ? "guardar_painel" : "criar_conta_simulacao", section: "simulador", bairro: simBairro });
    if (!user) {
      savePendingProvision(intent);
      navigate("/signup?origem=simulador");
      return;
    }
    setGuardando(true);
    const { projectId } = await criarProjetoDaSimulacao(user.id, intent);
    setGuardando(false);
    if (projectId) navigate(`/projeto/${projectId}`);
    else toast({ title: "Não foi possível guardar agora", description: "Tente de novo em instantes; o cenário continua salvo neste navegador.", variant: "destructive" });
  };

  const textoCompartilhar = `Simulação de studio em ${simBairro} no Radar Bewild: receita estimada de R$ ${fmt(sim.receitaMensal)}/mês com as premissas abaixo (hipóteses editáveis, não é garantia de resultado).`;
  const registrarCompartilhamento = (canal: string) => {
    trackSimulationShared(canal);
    trackGlobal("simulacao_compartilhada", { canal, bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0] });
  };
  const handleShare = async () => {
    const url = linkSimulacao();
    // No celular, abre o compartilhamento do sistema; no desktop (ou se falhar), mostra as opções.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && window.matchMedia?.("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: "Simulação no Radar Bewild", text: textoCompartilhar, url });
        registrarCompartilhamento("nativo");
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // a pessoa cancelou
      }
    }
    setLinkCopied(false);
    setShareOpen(true);
  };
  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(linkSimulacao()); setLinkCopied(true); registrarCompartilhamento("copiar_link"); setTimeout(() => setLinkCopied(false), 2000); }
    catch { toast({ title: "Não foi possível copiar", description: "Selecione o link e copie manualmente." }); }
  };
  const whatsappHref = () => `https://wa.me/?text=${encodeURIComponent(`${textoCompartilhar} ${linkSimulacao()}`)}`;

  const handleCopy = () => { navigator.clipboard.writeText(summaryText); setCopied(true); trackGlobal("export_simulation", { bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0], resultado: sim.receitaMensal }); setTimeout(() => setCopied(false), 2000); };

  const saveScenario = () => {
    if (scenarios.length >= 5) { toast({ title: "Limite atingido", description: "Remova um cenário antes de salvar outro.", variant: "destructive" }); return; }
    const ns: SavedScenario = { id: crypto.randomUUID(), name: `Cenário ${scenarios.length + 1} — ${simBairro} ${simMetragem}m²`, bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0], diariaAtual: simDiariaAtual, objetivo: simObjetivo, rateBoost, reformaBudget: simReformaBudget, boostedDaily: sim.boostedDaily, receitaMensal: sim.receitaMensal, receitaAnual: sim.receitaAnual, paybackMonths: sim.paybackMonths };
    const updated = [...scenarios, ns]; setScenarios(updated); persistScenarios(updated);
    toast({ title: "Cenário salvo!", description: `Você tem ${updated.length} de 5 cenários.` });
  };

  const removeScenario = (id: string) => { const u = scenarios.filter(s => s.id !== id); setScenarios(u); persistScenarios(u); };
  const loadScenarioIntoSim = (s: SavedScenario) => { setSimBairro(s.bairro); setSimMetragem(s.metragem); setSimOcupacao([s.ocupacao]); setSimDiariaAtual(s.diariaAtual); setSimObjetivo(s.objetivo); setRateBoost(s.rateBoost); setSimReformaBudget(s.reformaBudget); setCompareOpen(false); };

  // Lembra a última simulação (para o aviso de retomar), só depois que a pessoa mexeu no simulador.
  const interagiu = useRef(false);
  const marcarInteracao = () => { interagiu.current = true; };
  useEffect(() => {
    if (!interagiu.current) return;
    const t = setTimeout(() => {
      lembrarSimulacao(caminhoSimulacao({ bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0], diaria: campoParaInteiro(simDiariaAtual), objetivo: simObjetivo as ObjetivoSimulador, boost: rateBoost, reforma: campoParaInteiro(simReformaBudget) }), simBairro);
    }, 1500);
    return () => clearTimeout(t);
  }, [simBairro, simMetragem, simOcupacao, simDiariaAtual, simObjetivo, rateBoost, simReformaBudget]);

  const simTracked = useRef(false);
  useEffect(() => {
    if (simTracked.current) return;
    const t = setTimeout(() => { if (simDiariaAtual || rateBoost > 0 || simReformaBudget) { trackGlobal("simulator_used", { bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0], diaria: sim.boostedDaily, resultado: sim.receitaMensal, decoracao: rotuloDecoracao(rateBoost), resultado_liquido: resultadoLiquidoMensal(sim.receitaMensal) }); simTracked.current = true; } }, 2000);
    return () => clearTimeout(t);
  }, [sim.receitaMensal]);

  return (
    <SectionBlock id="simulador" title="Simulador de Receita" takeaway="Calcule sua rentabilidade estimada em menos de 1 minuto.">
      {scenarios.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {scenarios.map((s) => <Badge key={s.id} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5 text-xs" onClick={() => loadScenarioIntoSim(s)}>{s.name}</Badge>)}
        </div>
      )}
      <Card className="border-border">
        <CardContent className="p-6 space-y-5 font-body" onChangeCapture={() => { marcarInteracao(); trackSimulationUsed(); }} onPointerDownCapture={() => { marcarInteracao(); trackSimulationUsed(); }} onKeyDownCapture={() => { marcarInteracao(); trackSimulationUsed(); }}>
          {recebida && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-secondary/60 p-3" role="status">
              <Info size={18} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">Você abriu uma simulação compartilhada: as premissas abaixo são de quem enviou o link. Altere à vontade — nada é salvo para a outra pessoa.</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">Premissas editáveis: altere os campos e controles. Ajustes por objetivo e níveis de decoração são hipóteses, não ganhos observados.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Bairro</label><Select value={simBairro} onValueChange={setSimBairro}><SelectTrigger className="min-h-[48px] text-base"><SelectValue /></SelectTrigger><SelectContent>{bairros.map((b) => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Metragem (m²)</label><Input type="number" min={15} max={80} value={simMetragem} onChange={(e) => setSimMetragem(Number(e.target.value) || 30)} className="min-h-[48px] text-base" /></div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-2 block">Ocupação estimada: <span className="font-bold text-primary">{formatDecimal(simOcupacao[0], 0)}%</span></label><Slider value={simOcupacao} onValueChange={setSimOcupacao} min={50} max={90} step={1} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Diária atual (opcional, R$)</label><Input type="number" placeholder={`Média do bairro: R$ ${fmt(selected.dailyAvg)}`} value={simDiariaAtual} onChange={(e) => setSimDiariaAtual(e.target.value)} className="min-h-[48px] text-base" /></div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Objetivo</label><Select value={simObjetivo} onValueChange={setSimObjetivo}><SelectTrigger className="min-h-[48px] text-base"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="maximizar">Maximizar receita</SelectItem><SelectItem value="estabilidade">Estabilidade de ocupação</SelectItem><SelectItem value="premium">Posicionamento premium</SelectItem></SelectContent></Select></div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-2 block">Impacto de aumento na diária — hipótese</label><div className="flex gap-2 flex-wrap">{[0, 10, 20, 30].map((v) => <Button key={v} size="sm" variant={rateBoost === v ? "default" : "outline"} onClick={() => setRateBoost(v)} className={`min-h-[44px] min-w-[48px] ${rateBoost === v ? "bg-primary text-primary-foreground" : ""}`}>{v === 0 ? "Base" : `+${v}%`}</Button>)}</div></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Orçamento de reforma (opcional, R$)</label><Input type="number" placeholder="Ex: 72.000" value={simReformaBudget} onChange={(e) => setSimReformaBudget(e.target.value)} className="min-h-[48px] text-base" /></div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.boostedDaily)}</p><p className="text-xs text-muted-foreground">Diária {rateBoost > 0 ? `(+${rateBoost}%)` : "base"}</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaMensal)}</p><p className="text-xs text-muted-foreground">Receita / mês</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaAnual)}</p><p className="text-xs text-muted-foreground">Receita / ano</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">{sim.paybackMonths ? `${sim.paybackMonths} meses` : "—"}</p><p className="text-xs text-muted-foreground">Payback reforma</p></div>
          </div>
          {rateBoost > 0 && sim.delta > 0 && (
            <div className="bg-gold-light/50 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
              <ArrowUpRight className="text-gold mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-muted-foreground">Com +{rateBoost}% na diária, você ganha <span className="font-bold text-foreground">R$ {fmt(sim.delta)}/mês</span> a mais em relação ao cenário base.</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1 min-h-[44px]" onClick={() => void handleShare()}><Share2 size={16} className="mr-2" />Compartilhar simulação</Button>
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={saveScenario}><Bookmark size={16} className="mr-2" />Salvar cenário</Button>
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild><Button variant="outline" className="flex-1 min-h-[44px]"><FileText size={16} className="mr-2" />Exportar simulação</Button></DialogTrigger>
              <DialogContent className="font-body"><DialogHeader><DialogTitle className="font-display">Resumo da Simulação</DialogTitle></DialogHeader><pre className="bg-muted rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto">{summaryText}</pre><Button onClick={handleCopy} className="w-full bg-primary text-primary-foreground">{copied ? <><Check size={16} className="mr-2" /> Copiado!</> : <><Copy size={16} className="mr-2" /> Copiar texto</>}</Button></DialogContent>
            </Dialog>
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogContent className="font-body">
                <DialogHeader><DialogTitle className="font-display">Compartilhar simulação</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">Quem abrir o link vê esta mesma conta, com as mesmas fontes, e pode mudar as premissas.</p>
                <Input readOnly value={linkSimulacao()} onFocus={(e) => e.currentTarget.select()} className="min-h-[48px] text-base" aria-label="Link da simulação" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => void copiarLink()} className="flex-1 min-h-[44px]">{linkCopied ? <><Check size={16} className="mr-2" />Link copiado</> : <><Copy size={16} className="mr-2" />Copiar link</>}</Button>
                  <Button asChild variant="outline" className="flex-1 min-h-[44px]">
                    <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" onClick={() => registrarCompartilhamento("whatsapp")}><MessageCircle size={16} className="mr-2" />Enviar no WhatsApp</a>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {user
                ? <>Guarde esta simulação de <strong className="text-foreground">{simBairro}</strong> como projeto no Painel para refinar a projeção depois.</>
                : <>Cenários salvos ficam só neste navegador. Com uma conta, a simulação de <strong className="text-foreground">{simBairro}</strong> vira um projeto no Painel, acessível de qualquer aparelho.</>}
            </p>
            <Button variant="outline" className="min-h-[44px] shrink-0" onClick={() => void guardarNoPainel()} disabled={guardando}>
              {guardando ? <Loader2 size={16} className="mr-2 animate-spin" /> : <FolderPlus size={16} className="mr-2" />}
              {user ? "Guardar no Painel" : "Criar conta e guardar"}
            </Button>
          </div>

          {scenarios.length >= 2 && (
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
              <DialogTrigger asChild><Button variant="secondary" className="w-full"><Columns2 size={16} className="mr-2" />Comparar cenários ({scenarios.length})</Button></DialogTrigger>
              <DialogContent className="font-body max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-display">Comparação de Cenários</DialogTitle></DialogHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border"><th className="text-left py-2 px-2 text-muted-foreground font-medium">Métrica</th>{scenarios.map(s => <th key={s.id} className="text-center py-2 px-2 font-medium text-foreground min-w-[120px]"><div className="text-xs">{s.name}</div></th>)}</tr></thead>
                    <tbody>
                      {([
                        { label: "Bairro", key: "bairro", fmt: (v: CellValue) => v, best: null },
                        { label: "Metragem", key: "metragem", fmt: (v: CellValue) => `${v}m²`, best: null },
                        { label: "Ocupação", key: "ocupacao", fmt: (v: CellValue) => `${formatDecimal(Number(v), 0)}%`, best: "max" },
                        { label: "Diária", key: "boostedDaily", fmt: (v: CellValue) => `R$ ${fmt(Number(v))}`, best: "max" },
                        { label: "Rate boost", key: "rateBoost", fmt: (v: CellValue) => v === 0 ? "Base" : `+${v}%`, best: null },
                        { label: "Receita/mês", key: "receitaMensal", fmt: (v: CellValue) => `R$ ${fmt(Number(v))}`, best: "max" },
                        { label: "Receita/ano", key: "receitaAnual", fmt: (v: CellValue) => `R$ ${fmt(Number(v))}`, best: "max" },
                        { label: "Payback", key: "paybackMonths", fmt: (v: CellValue) => v ? `${v} meses` : "—", best: "min" },
                      ] as const).map(row => {
                        const values = scenarios.map(s => (s as unknown as Record<string, CellValue>)[row.key]);
                        const numericValues = values.filter((v): v is number => typeof v === "number" && v > 0);
                        const bestVal = row.best === "max" ? Math.max(...numericValues) : row.best === "min" ? Math.min(...numericValues) : null;
                        return (
                          <tr key={row.key} className="border-b border-border/50">
                            <td className="py-2 px-2 text-muted-foreground">{row.label}</td>
                            {scenarios.map(s => { const v = (s as unknown as Record<string, CellValue>)[row.key]; const isBest = bestVal !== null && v === bestVal && numericValues.length > 1; return <td key={s.id} className={`text-center py-2 px-2 ${isBest ? "text-primary font-bold bg-primary/5" : "text-foreground"}`}>{row.fmt(v)}</td>; })}
                          </tr>
                        );
                      })}
                      <tr><td className="py-2 px-2 text-muted-foreground">Ações</td>{scenarios.map(s => <td key={s.id} className="text-center py-2 px-2"><div className="flex flex-col gap-1"><Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => loadScenarioIntoSim(s)}>Usar no simulador</Button><Button size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => removeScenario(s.id)}><Trash2 size={12} className="mr-1" /> Remover</Button></div></td>)}</tr>
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
      <Accordion type="multiple" className="mt-4 font-body">
         <AccordionItem value="rateboost"><AccordionTrigger className="text-primary font-semibold min-h-[48px]">Como funciona o rate boost</AccordionTrigger><AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">O cenário Base usa a diária média do bairro (ou sua diária atual, se informada). <strong className="text-foreground">+10%</strong> = decoração básica melhorada (pintura, iluminação, enxoval novo). <strong className="text-foreground">+20%</strong> = decoração premium com fotos profissionais e mobília planejada. <strong className="text-foreground">+30%</strong> = studio de alto padrão com design autoral, fotos de catálogo e operação otimizada. Os percentuais são hipóteses de simulação, não resultados comprovados.</p></AccordionContent></AccordionItem>
        <AccordionItem value="payback"><AccordionTrigger className="text-primary font-semibold min-h-[48px]">O que o payback considera</AccordionTrigger><AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">O cálculo de payback é simplificado: <strong className="text-foreground">Payback = Orçamento de reforma ÷ Receita incremental mensal</strong> (diferença entre cenário boosted e cenário base). Não inclui custos operacionais como limpeza (~R$ 80-120/virada), taxa da plataforma (~15%), condomínio, IPTU ou imposto de renda. Taxas e custos mencionados são hipóteses do exemplo. Para planejar a reforma, peça seu orçamento.</p></AccordionContent></AccordionItem>
      </Accordion>
      <OrcamentoButton local="meio" className="mt-4 min-h-[44px]" />
    </SectionBlock>
  );
}
