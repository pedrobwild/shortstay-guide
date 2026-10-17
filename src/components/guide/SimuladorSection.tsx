import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Check, Columns2, Copy, FileText, FolderPlus, Info, Loader2, MessageCircle, Share2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import OrcamentoButton from "@/components/OrcamentoButton";
import SimuladorReceitaLiquida from "@/components/guide/SimuladorReceitaLiquida";
import SectionBlock from "./SectionBlock";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { useSimuladorReceita } from "@/hooks/useSimuladorReceita";
import { criarProjetoDaSimulacao, savePendingProvision } from "@/lib/leadProvisioning";
import { trackSimulationShared, trackSimulationUsed } from "@/lib/marketingConsent";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { lembrarSimulacao } from "@/lib/retomada";
import { MAX_CENARIOS, armazenamentoLocal, lerCenarios, salvarCenarios, type CenarioSalvo } from "@/lib/simuladorReceita";

const rotuloModo = (modo: string) => (modo === "tradicional" ? "Locação tradicional" : "Short stay");

/**
 * Seção #simulador da home: o simulador de receita líquida (o mesmo da /projecao)
 * mais o que a pessoa faz com a simulação: compartilhar por link, salvar e comparar
 * cenários neste navegador, exportar o resumo e guardar como projeto no Painel.
 */
export default function SimuladorSection() {
  const sim = useSimuladorReceita();
  const { p, bairro, resultado, query, recebidaPorLink, carregar } = sim;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cenarios, setCenarios] = useState<CenarioSalvo[]>([]);
  // Começa vazio no SSR e carrega no navegador, para o HTML pré-renderizado e a hidratação coincidirem.
  useEffect(() => { const salvos = lerCenarios(armazenamentoLocal()); if (salvos.length) setCenarios(salvos); }, []);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const caminho = `/${query ? `?${query}` : ""}#simulador`;
  const link = () => (typeof window === "undefined" ? caminho : `${window.location.origin}${caminho}`);
  const nomeBairro = bairro?.name ?? "";

  const resumo = useMemo(() => {
    if (!resultado) return "";
    const linhas = [
      `📊 Simulação de receita líquida — ${rotuloModo(p.modo)}`,
      "",
      `Bairro: ${nomeBairro}`,
      `Faixa de área: ${p.area}`,
      p.modo === "short_stay" ? `Diária média: ${formatBRL(sim.diaria)} · ocupação ${formatPercent(sim.ocupacao, 0)}` : `Aluguel mensal: ${formatBRL(sim.aluguel)} · ${p.tradicional.vacanciaMeses} ${p.tradicional.vacanciaMeses === 1 ? "mês vago" : "meses vagos"} por ano`,
      "",
      `Receita bruta: ${formatBRL(resultado.receitaBruta)}/mês`,
      ...resultado.deducoes.map((d) => `− ${d.rotulo}: ${formatBRL(d.valor)} (${d.base})`),
      `= Resultado líquido: ${formatBRL(resultado.liquido)}/mês · ${formatBRL(resultado.liquidoAnual)}/ano`,
      sim.indicadores ? `Rentabilidade líquida: ${formatDecimal(sim.indicadores.rentabilidadeAA, 1)}% a.a.${sim.indicadores.paybackAnos != null ? ` · prazo de retorno ${formatDecimal(sim.indicadores.paybackAnos, 1)} anos` : ""}` : "",
      "",
      "Hipótese de simulação, não retorno garantido.",
      `Abrir esta simulação: ${link()}`,
      "Gerado no Radar Bewild · radarbewild.com.br",
    ];
    return linhas.filter((l) => l !== null).join("\n");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado, p, nomeBairro, sim.diaria, sim.ocupacao, sim.aluguel, sim.indicadores, caminho]);

  const textoCompartilhar = resultado
    ? `Simulação de studio em ${nomeBairro} no Radar Bewild: resultado líquido estimado de ${formatBRL(resultado.liquido)}/mês no ${rotuloModo(p.modo).toLowerCase()} (hipóteses editáveis, não é garantia de resultado).`
    : "";
  const registrarCompartilhamento = (canal: string) => {
    trackSimulationShared(canal);
    trackGlobal("simulacao_compartilhada", { canal, bairro: nomeBairro, modo: p.modo, area: p.area });
  };
  const compartilhar = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && window.matchMedia?.("(pointer: coarse)").matches) {
      try { await navigator.share({ title: "Simulação no Radar Bewild", text: textoCompartilhar, url: link() }); registrarCompartilhamento("nativo"); return; }
      catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; }
    }
    setLinkCopied(false);
    setShareOpen(true);
  };
  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(link()); setLinkCopied(true); registrarCompartilhamento("copiar_link"); setTimeout(() => setLinkCopied(false), 2000); }
    catch { toast({ title: "Não foi possível copiar", description: "Selecione o link e copie manualmente." }); }
  };
  const copiarResumo = () => {
    navigator.clipboard.writeText(resumo);
    setCopied(true);
    trackGlobal("export_simulation", { bairro: nomeBairro, modo: p.modo, area: p.area, resultado: resultado?.liquido ?? 0 });
    setTimeout(() => setCopied(false), 2000);
  };

  const salvarCenario = () => {
    if (!resultado) return;
    if (cenarios.length >= MAX_CENARIOS) { toast({ title: "Limite atingido", description: "Remova um cenário antes de salvar outro.", variant: "destructive" }); return; }
    const novo: CenarioSalvo = { id: crypto.randomUUID(), nome: `Cenário ${cenarios.length + 1} — ${nomeBairro} · ${rotuloModo(p.modo)}`, premissas: p, receitaBruta: resultado.receitaBruta, liquido: resultado.liquido, criadoEm: Date.now() };
    const lista = [...cenarios, novo];
    setCenarios(lista); salvarCenarios(lista, armazenamentoLocal());
    toast({ title: "Cenário salvo", description: `Você tem ${lista.length} de ${MAX_CENARIOS} cenários neste navegador.` });
  };
  const removerCenario = (id: string) => { const lista = cenarios.filter((c) => c.id !== id); setCenarios(lista); salvarCenarios(lista, armazenamentoLocal()); };
  const usarCenario = (c: CenarioSalvo) => { carregar(c.premissas); setCompareOpen(false); };

  // Guardar na conta: logado cria o projeto já; sem conta, guarda a intenção e leva ao cadastro.
  const guardarNoPainel = async () => {
    const intent = { neighborhood: nomeBairro, area_sqm: p.area };
    trackGlobal("cta_clicked", { cta_id: user ? "guardar_painel" : "criar_conta_simulacao", section: "simulador", bairro: nomeBairro });
    if (!user) { savePendingProvision(intent); navigate("/signup?origem=simulador"); return; }
    setGuardando(true);
    const { projectId } = await criarProjetoDaSimulacao(user.id, intent);
    setGuardando(false);
    if (projectId) navigate(`/projeto/${projectId}`);
    else toast({ title: "Não foi possível guardar agora", description: "Tente de novo em instantes; o cenário continua salvo neste navegador.", variant: "destructive" });
  };

  // Lembra a última simulação (aviso de retomar), só depois que a pessoa mexeu.
  const interagiu = useRef(false);
  const marcarInteracao = () => { interagiu.current = true; trackSimulationUsed(); };
  useEffect(() => {
    if (!interagiu.current) return;
    const t = setTimeout(() => lembrarSimulacao(caminho, nomeBairro), 1500);
    return () => clearTimeout(t);
  }, [caminho, nomeBairro]);

  const simTracked = useRef(false);
  useEffect(() => {
    if (simTracked.current || !interagiu.current || !resultado) return;
    const t = setTimeout(() => {
      trackGlobal("simulator_used", { bairro: nomeBairro, modo: p.modo, area: p.area, diaria: sim.diaria, ocupacao: sim.ocupacao, resultado: resultado.receitaBruta, resultado_liquido: resultado.liquido, decoracao: p.decoracao });
      simTracked.current = true;
    }, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado?.liquido]);

  const acoes = (
    <div className="mt-6 grid gap-3 border-t border-border pt-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="min-h-[44px] flex-1" onClick={() => void compartilhar()}><Share2 className="mr-2 h-4 w-4" aria-hidden="true" />Compartilhar simulação</Button>
        <Button variant="outline" className="min-h-[44px] flex-1" onClick={salvarCenario}><Bookmark className="mr-2 h-4 w-4" aria-hidden="true" />Salvar cenário</Button>
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogTrigger asChild><Button variant="outline" className="min-h-[44px] flex-1"><FileText className="mr-2 h-4 w-4" aria-hidden="true" />Exportar resumo</Button></DialogTrigger>
          <DialogContent className="font-body">
            <DialogHeader><DialogTitle className="font-display">Resumo da simulação</DialogTitle><DialogDescription>Texto para colar numa mensagem ou numa anotação.</DialogDescription></DialogHeader>
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-foreground">{resumo}</pre>
            <Button onClick={copiarResumo} className="min-h-[44px] w-full">{copied ? <><Check className="mr-2 h-4 w-4" aria-hidden="true" />Copiado</> : <><Copy className="mr-2 h-4 w-4" aria-hidden="true" />Copiar texto</>}</Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {user
            ? <>Guarde esta simulação de <strong className="text-foreground">{nomeBairro}</strong> como projeto no Painel para refinar a projeção depois.</>
            : <>Cenários salvos ficam só neste navegador. Com uma conta, a simulação de <strong className="text-foreground">{nomeBairro}</strong> vira um projeto no Painel, acessível de qualquer aparelho.</>}
        </p>
        <Button variant="outline" className="min-h-[44px] shrink-0" onClick={() => void guardarNoPainel()} disabled={guardando}>
          {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <FolderPlus className="mr-2 h-4 w-4" aria-hidden="true" />}
          {user ? "Guardar no Painel" : "Criar conta e guardar"}
        </Button>
      </div>
      {cenarios.length >= 2 && (
        <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
          <DialogTrigger asChild><Button variant="secondary" className="min-h-[44px] w-full"><Columns2 className="mr-2 h-4 w-4" aria-hidden="true" />Comparar cenários ({cenarios.length})</Button></DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto font-body">
            <DialogHeader><DialogTitle className="font-display">Comparação de cenários</DialogTitle><DialogDescription>Resultado líquido de cada cenário no momento em que foi salvo.</DialogDescription></DialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border"><th className="px-2 py-2 text-left font-medium text-muted-foreground">Cenário</th><th className="px-2 py-2 text-left font-medium text-muted-foreground">Modelo</th><th className="px-2 py-2 text-right font-medium text-muted-foreground">Bruta/mês</th><th className="px-2 py-2 text-right font-medium text-muted-foreground">Líquido/mês</th><th className="px-2 py-2 text-right font-medium text-muted-foreground"><span className="sr-only">Ações</span></th></tr></thead>
                <tbody>
                  {cenarios.map((c) => {
                    const maior = Math.max(...cenarios.map((x) => x.liquido));
                    return (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="px-2 py-2 text-foreground">{c.nome}</td>
                        <td className="px-2 py-2 text-muted-foreground">{rotuloModo(c.premissas.modo)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{formatBRL(c.receitaBruta)}</td>
                        <td className={`px-2 py-2 text-right tabular-nums ${c.liquido === maior && cenarios.length > 1 ? "font-bold text-primary" : "text-foreground"}`}>{formatBRL(c.liquido)}</td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="min-h-[44px] text-xs" onClick={() => usarCenario(c)}>Usar</Button>
                            <Button size="sm" variant="ghost" className="min-h-[44px] text-xs text-destructive hover:text-destructive" onClick={() => removerCenario(c.id)}><Trash2 className="mr-1 h-3 w-3" aria-hidden="true" />Remover</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="font-body">
          <DialogHeader><DialogTitle className="font-display">Compartilhar simulação</DialogTitle><DialogDescription>Quem abrir o link vê esta mesma conta, com as mesmas fontes, e pode mudar as premissas.</DialogDescription></DialogHeader>
          <Input readOnly value={shareOpen ? link() : ""} onFocus={(e) => e.currentTarget.select()} className="min-h-[48px] text-base" aria-label="Link da simulação" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void copiarLink()} className="min-h-[44px] flex-1">{linkCopied ? <><Check className="mr-2 h-4 w-4" aria-hidden="true" />Link copiado</> : <><Copy className="mr-2 h-4 w-4" aria-hidden="true" />Copiar link</>}</Button>
            <Button asChild variant="outline" className="min-h-[44px] flex-1">
              <a href={shareOpen ? `https://wa.me/?text=${encodeURIComponent(`${textoCompartilhar} ${link()}`)}` : "#"} target="_blank" rel="noopener noreferrer" onClick={() => registrarCompartilhamento("whatsapp")}><MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />Enviar no WhatsApp</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <SectionBlock id="simulador" title="Simulador de receita líquida" takeaway="Da diária do bairro ao que sobra por mês, no short stay e na locação tradicional.">
      {cenarios.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {cenarios.map((c) => <Badge key={c.id} variant="outline" className="cursor-pointer px-3 py-1.5 text-xs transition-colors hover:bg-primary/10" onClick={() => usarCenario(c)}>{c.nome}</Badge>)}
        </div>
      )}
      {recebidaPorLink && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-secondary/60 p-3" role="status">
          <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground">Você abriu uma simulação compartilhada: as premissas são de quem enviou o link. Altere à vontade — nada é salvo para a outra pessoa.</p>
        </div>
      )}
      <div onChangeCapture={marcarInteracao} onPointerDownCapture={marcarInteracao} onKeyDownCapture={marcarInteracao}>
        <SimuladorReceitaLiquida sim={sim} rodape={acoes} />
      </div>
      <Accordion type="multiple" className="mt-4 font-body">
        <AccordionItem value="decoracao"><AccordionTrigger className="min-h-[48px] font-semibold text-primary">Como funciona o nível de decoração</AccordionTrigger><AccordionContent><p className="text-sm leading-relaxed text-muted-foreground">O nível Básico usa a diária média do bairro. <strong className="text-foreground">Premium</strong> (1,2×) representa decoração profissional com fotos e mobília planejada; <strong className="text-foreground">Alto padrão</strong> (1,45×) representa design autoral, fotos de catálogo e operação otimizada. Os multiplicadores são hipóteses de simulação, não resultados comprovados. Você também pode digitar a sua própria diária.</p></AccordionContent></AccordionItem>
        <AccordionItem value="conta"><AccordionTrigger className="min-h-[48px] font-semibold text-primary">O que a conta considera</AccordionTrigger><AccordionContent><p className="text-sm leading-relaxed text-muted-foreground">No short stay: receita bruta = diária × 30 × ocupação; dela saem taxa do Airbnb, gestão, impostos e manutenção (percentuais do DRE padrão do guia) e as despesas fixas que você informa (condomínio, IPTU, contas). Na locação tradicional: aluguel × meses alugados, menos administração, imposto de renda, reparos e os encargos dos meses vagos. O prazo de retorno divide o investimento (imóvel + reforma, se informada) pelo resultado líquido anual. Tudo é hipótese editável; para planejar a reforma, peça seu orçamento.</p></AccordionContent></AccordionItem>
      </Accordion>
      <OrcamentoButton local="meio" className="mt-4 min-h-[44px]" />
    </SectionBlock>
  );
}
