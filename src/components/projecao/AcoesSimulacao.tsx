import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import type { SimuladorReceita } from "@/hooks/useSimuladorReceita";
import { criarProjetoDaSimulacao, savePendingProvision } from "@/lib/leadProvisioning";
import { trackSimulationShared } from "@/lib/marketingConsent";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { avisoAmostraBairro, descricaoNatureza } from "@/lib/radarUi";
import {
  MAX_CENARIOS, armazenamentoLocal, lerCenarios, recalcularCenario, salvarCenarios, type CenarioSalvo, type Resultado,
} from "@/lib/simuladorReceita";
import { cn } from "@/lib/utils";

const rotuloModo = (modo: string) => (modo === "tradicional" ? "Locação tradicional" : "Short stay");

/**
 * O que a pessoa faz com a simulação da /projecao: compartilhar por link (as premissas
 * vão na URL, sem dado pessoal), salvar e comparar até 5 cenários neste navegador,
 * copiar o resumo e guardar como projeto no Painel. Mesmas chaves de armazenamento do
 * simulador anterior da home (os cenários salvos lá continuam aparecendo aqui).
 */
export default function AcoesSimulacao({ sim, resultado, indicadores }: {
  sim: SimuladorReceita;
  /** Resultado exibido na tela (short stay). */
  resultado: Resultado;
  indicadores: { rentabilidadeAA: number; paybackAnos: number | null } | null;
}) {
  const { p, bairro, bairros, query, carregar } = sim;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cenarios, setCenarios] = useState<CenarioSalvo[]>([]);
  // Lidos no navegador, depois da montagem.
  useEffect(() => { const salvos = lerCenarios(armazenamentoLocal()); if (salvos.length) setCenarios(salvos); }, []);
  const exibidos = useMemo(() => cenarios.map((c) => recalcularCenario(c, bairros)), [cenarios, bairros]);
  const [compartilharAberto, setCompartilharAberto] = useState(false);
  const [resumoAberto, setResumoAberto] = useState(false);
  const [copiado, setCopiado] = useState<"link" | "resumo" | null>(null);
  const [guardando, setGuardando] = useState(false);

  const nomeBairro = bairro?.name ?? "";
  const caminho = `/projecao${query ? `?${query}` : ""}`;
  const link = () => (typeof window === "undefined" ? caminho : `${window.location.origin}${caminho}`);

  const resumo = [
    `Simulação de resultado líquido — ${rotuloModo("short_stay")}`,
    "",
    `Bairro: ${nomeBairro}${bairro ? descricaoNatureza(bairro) : ""}${bairro && avisoAmostraBairro(bairro) ? ` · ${avisoAmostraBairro(bairro)}` : ""}`,
    `Diária média: ${formatBRL(sim.diaria)} · ocupação ${formatPercent(sim.ocupacao, 0)}`,
    "",
    `Receita bruta: ${formatBRL(resultado.receitaBruta)}/mês`,
    ...resultado.deducoes.map((d) => `− ${d.rotulo}: ${formatBRL(d.valor)} (${d.base})`),
    `= Resultado líquido: ${formatBRL(resultado.liquido)}/mês · ${formatBRL(resultado.liquidoAnual)}/ano`,
    ...(indicadores ? [`Rentabilidade anual: ${formatDecimal(indicadores.rentabilidadeAA, 1)}%${indicadores.paybackAnos != null ? ` · prazo estimado de retorno ${formatDecimal(indicadores.paybackAnos, 1)} anos` : ""}`] : []),
    "",
    "Hipótese de simulação, não garantia de resultado.",
    `Abrir esta simulação: ${link()}`,
    "Gerado no Radar Bewild · radarbewild.com.br",
  ].join("\n");
  const textoCompartilhar = `Simulação de studio em ${nomeBairro}${bairro ? descricaoNatureza(bairro) : ""} no Radar Bewild: resultado líquido estimado de ${formatBRL(resultado.liquido)}/mês no short stay (hipóteses editáveis, não é garantia de resultado).`;

  const registrar = (canal: string) => {
    trackSimulationShared(canal);
    trackGlobal("simulacao_compartilhada", { canal, bairro: nomeBairro, modo: p.modo, area: p.area, origem: "projecao" });
  };
  const copiar = async (texto: string, tipo: "link" | "resumo") => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      if (tipo === "link") registrar("copiar_link");
      else trackGlobal("export_simulation", { bairro: nomeBairro, modo: p.modo, area: p.area, resultado: resultado.liquido });
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", description: "Selecione o texto e copie manualmente." });
    }
  };
  const compartilhar = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && window.matchMedia?.("(pointer: coarse)").matches) {
      try { await navigator.share({ title: "Simulação no Radar Bewild", text: textoCompartilhar, url: link() }); registrar("nativo"); return; }
      catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; }
    }
    setCompartilharAberto(true);
  };

  const salvarCenario = () => {
    if (cenarios.length >= MAX_CENARIOS) { toast({ title: "Limite atingido", description: "Remova um cenário antes de salvar outro.", variant: "destructive" }); return; }
    const novo: CenarioSalvo = { id: crypto.randomUUID(), nome: `Cenário ${cenarios.length + 1} — ${nomeBairro}`, premissas: p, receitaBruta: resultado.receitaBruta, liquido: resultado.liquido, criadoEm: Date.now() };
    const lista = [...cenarios, novo];
    setCenarios(lista); salvarCenarios(lista, armazenamentoLocal());
    toast({ title: "Cenário salvo", description: `Você tem ${lista.length} de ${MAX_CENARIOS} cenários neste navegador.` });
  };
  const remover = (id: string) => { const lista = cenarios.filter((c) => c.id !== id); setCenarios(lista); salvarCenarios(lista, armazenamentoLocal()); };

  const guardarNoPainel = async () => {
    const intent = { neighborhood: nomeBairro, area_sqm: p.area };
    trackGlobal("cta_clicked", { cta_id: user ? "guardar_painel" : "criar_conta_simulacao", section: "projecao", bairro: nomeBairro });
    if (!user) { savePendingProvision(intent); navigate("/signup?origem=simulador"); return; }
    setGuardando(true);
    const { projectId } = await criarProjetoDaSimulacao(user.id, intent);
    setGuardando(false);
    if (projectId) navigate(`/projeto/${projectId}`);
    else toast({ title: "Não foi possível guardar agora", description: "Tente de novo em instantes; os cenários continuam salvos neste navegador.", variant: "destructive" });
  };

  const maior = exibidos.length ? Math.max(...exibidos.map((c) => c.liquido)) : 0;
  const botao = "min-h-[44px] px-5 text-[15px] font-semibold";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button className={botao} onClick={() => void compartilhar()}>Compartilhar a simulação</Button>
        <Button variant="outline" className={botao} onClick={salvarCenario}>Salvar cenário</Button>
        <Button variant="outline" className={botao} onClick={() => setResumoAberto(true)}>Copiar o resumo</Button>
        <Button variant="outline" className={botao} onClick={() => void guardarNoPainel()} disabled={guardando} aria-busy={guardando}>
          {guardando ? "Guardando…" : user ? "Guardar no Painel" : "Criar conta e guardar"}
        </Button>
      </div>
      <p className="e-legenda mt-2 max-w-[720px]">
        O link leva as premissas (só números e escolhas, nenhum dado pessoal). Cenários ficam só neste navegador; com uma conta, a simulação vira um projeto no Painel.
      </p>

      {exibidos.length > 0 && (
        <TabelaNumerada numero={3} className="mt-8" titulo={`Cenários salvos neste navegador (${exibidos.length} de ${MAX_CENARIOS})`} unidade="Resultado recalculado com a base atual. O maior resultado líquido em negrito.">
          <thead>
            <tr>
              <th scope="col" className={TH}>Cenário</th>
              <th scope="col" className={cn(TH, "text-right")}>Bruta (R$/mês)</th>
              <th scope="col" className={cn(TH, "text-right")}>Líquido (R$/mês)</th>
              <th scope="col" className={cn(TH, "text-right")}><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {exibidos.map((c) => (
              <tr key={c.id}>
                <td className={TD}>{c.nome}<span className="e-legenda block">{rotuloModo(c.premissas.modo)}</span></td>
                <td className={TD_NUM}>{formatBRL(c.receitaBruta)}</td>
                <td className={cn(TD_NUM, c.liquido === maior && exibidos.length > 1 && "font-semibold", c.liquido < 0 && "e-negativo")}>{formatBRL(c.liquido)}</td>
                <td className={cn(TD, "text-right")}>
                  <span className="inline-flex gap-3">
                    <button type="button" className="e-link inline-flex min-h-[44px] items-center text-[15px]" onClick={() => carregar(c.premissas)}>Usar</button>
                    <button type="button" className="inline-flex min-h-[44px] items-center text-[15px] text-magenta-700 underline underline-offset-[3px]" onClick={() => remover(c.id)}>Remover</button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </TabelaNumerada>
      )}

      <Dialog open={compartilharAberto} onOpenChange={setCompartilharAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="e-h3">Compartilhar a simulação</DialogTitle>
            <DialogDescription>Quem abrir o link vê esta mesma conta, com as mesmas fontes, e pode mudar as premissas.</DialogDescription>
          </DialogHeader>
          <Input readOnly value={compartilharAberto ? link() : ""} onFocus={(e) => e.currentTarget.select()} className="min-h-[48px] text-base" aria-label="Link da simulação" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void copiar(link(), "link")} className={cn(botao, "flex-1")}>{copiado === "link" ? "Link copiado" : "Copiar link"}</Button>
            <Button asChild variant="outline" className={cn(botao, "flex-1")}>
              <a href={compartilharAberto ? `https://wa.me/?text=${encodeURIComponent(`${textoCompartilhar} ${link()}`)}` : "#"} target="_blank" rel="noopener noreferrer" onClick={() => registrar("whatsapp")}>Enviar no WhatsApp</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resumoAberto} onOpenChange={setResumoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="e-h3">Resumo da simulação</DialogTitle>
            <DialogDescription>Texto para colar numa mensagem ou numa anotação.</DialogDescription>
          </DialogHeader>
          <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap border border-foreground/10 bg-card p-4 font-body text-sm">{resumo}</pre>
          <Button onClick={() => void copiar(resumo, "resumo")} className={cn(botao, "w-full")}>{copiado === "resumo" ? "Copiado" : "Copiar texto"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
