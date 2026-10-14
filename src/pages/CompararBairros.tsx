import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Copy, MessageCircle, Plus, Share2, X } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import OrcamentoButton from "@/components/OrcamentoButton";
import FonteBairro from "@/components/guide/FonteBairro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { BairroProvider, useBairroData } from "@/hooks/useBairroData";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import { fmt, type BairroItem } from "@/data/guide-data";
import { linkSimuladorBairro } from "@/data/navegacao";
import { formatPercent } from "@/lib/numberFormat";
import { slugifyBairro } from "@/lib/seo";
import { MAX_COMPARAR, caminhoComparar, lerComparar } from "@/lib/comparar";

/**
 * Compara até 3 bairros lado a lado com os números da base aprovada
 * (diária, ocupação, quartis, anúncios e receita de referência = diária × 30 × ocupação),
 * cada um com sua fonte. A seleção vive na URL (?b=slug,slug) para ser compartilhada.
 */
export default function CompararBairros() {
  return (
    <BairroProvider>
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <CompararConteudo />
      </div>
    </BairroProvider>
  );
}

const LINHAS: { rotulo: string; valor: (b: BairroItem) => string; ajuda?: string }[] = [
  { rotulo: "Diária média (ADR)", valor: (b) => `R$ ${fmt(b.dailyAvg)}` },
  { rotulo: "Ocupação média", valor: (b) => formatPercent(b.avgOccupancy, 0) },
  { rotulo: "Diária: 25% mais baratos", valor: (b) => (b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[0])}` : "—") },
  { rotulo: "Diária: mediana", valor: (b) => (b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[1])}` : "—") },
  { rotulo: "Diária: 25% mais caros", valor: (b) => (b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[2])}` : "—") },
  { rotulo: "Anúncios na amostra", valor: (b) => (b.activeListings != null ? fmt(b.activeListings) : "—") },
  { rotulo: "Receita mensal de referência", valor: (b) => `R$ ${fmt(receitaMensalReferencia(b))}`, ajuda: "diária × 30 × ocupação, antes de custos" },
];

function CompararConteudo() {
  const { bairros, isLoading } = useBairroData();
  const [params, setParams] = useSearchParams();
  const [escolhendo, setEscolhendo] = useState(false);
  const [compartilharAberto, setCompartilharAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const slugsDisponiveis = useMemo(() => bairros.map((b) => slugifyBairro(b.name)), [bairros]);
  const pedidos = lerComparar(params.get("b"), slugsDisponiveis);
  // Sem seleção na URL, começa com os três primeiros bairros da base.
  const slugs = params.get("b") === null ? slugsDisponiveis.slice(0, MAX_COMPARAR) : pedidos;
  const selecionados = slugs
    .map((s) => bairros.find((b) => slugifyBairro(b.name) === s))
    .filter((b): b is BairroItem => Boolean(b));
  const disponiveis = bairros.filter((b) => !slugs.includes(slugifyBairro(b.name)));

  const atualizar = (novos: string[]) => setParams({ b: novos.join(",") }, { replace: true });
  const adicionar = (b: BairroItem) => { atualizar([...slugs, slugifyBairro(b.name)].slice(0, MAX_COMPARAR)); setEscolhendo(false); };
  const remover = (b: BairroItem) => atualizar(slugs.filter((s) => s !== slugifyBairro(b.name)));

  const link = () => `${window.location.origin}${caminhoComparar(slugs)}`;
  const texto = `Comparação de bairros para studio de short stay no Radar Bewild: ${selecionados.map((b) => b.name).join(", ")}.`;
  const registrar = (canal: string) => trackGlobal("comparacao_compartilhada", { canal, bairros: slugs.join(",") });
  const compartilhar = async () => {
    if (typeof navigator.share === "function" && window.matchMedia?.("(pointer: coarse)").matches) {
      try { await navigator.share({ title: "Comparação de bairros — Radar Bewild", text: texto, url: link() }); registrar("nativo"); return; }
      catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; }
    }
    setCopiado(false);
    setCompartilharAberto(true);
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(link()); setCopiado(true); registrar("copiar_link"); setTimeout(() => setCopiado(false), 2000); }
    catch { toast({ title: "Não foi possível copiar", description: "Selecione o link e copie manualmente." }); }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Comparar bairros</h1>
        <p className="text-muted-foreground max-w-2xl">
          Escolha até {MAX_COMPARAR} bairros e veja diária, ocupação e faixa de preço lado a lado, cada número com a sua fonte.
        </p>
      </header>

      {/* Seleção */}
      <div className="flex flex-wrap items-center gap-2">
        {selecionados.map((b) => (
          <span key={b.name} className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-border bg-card pl-4 pr-1 text-sm font-medium text-foreground">
            {b.name}
            <button type="button" onClick={() => remover(b)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" aria-label={`Remover ${b.name}`}>
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
        {selecionados.length < MAX_COMPARAR && disponiveis.length > 0 && (
          <Button variant="outline" className="min-h-[44px] rounded-full" onClick={() => setEscolhendo((v) => !v)} aria-expanded={escolhendo}>
            <Plus className="mr-1 h-4 w-4" />Adicionar bairro
          </Button>
        )}
        {selecionados.length > 0 && (
          <Button variant="ghost" className="min-h-[44px]" onClick={() => void compartilhar()}>
            <Share2 className="mr-2 h-4 w-4" />Compartilhar comparação
          </Button>
        )}
      </div>
      {escolhendo && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
          {disponiveis.map((b) => (
            <Button key={b.name} variant="ghost" className="min-h-[44px]" onClick={() => adicionar(b)}>{b.name}</Button>
          ))}
        </div>
      )}

      {/* Estados */}
      {isLoading && selecionados.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}
      {!isLoading && selecionados.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum bairro escolhido. Use "Adicionar bairro" para começar.</CardContent></Card>
      )}

      {/* Comparação: um cartão por bairro, lado a lado a partir do tablet */}
      {selecionados.length > 0 && (
        <div className={`grid grid-cols-1 gap-4 ${selecionados.length === 2 ? "md:grid-cols-2" : selecionados.length >= 3 ? "md:grid-cols-3" : ""}`}>
          {selecionados.map((b) => {
            const slug = slugifyBairro(b.name);
            return (
              <Card key={b.name} className="min-w-0">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{b.name}</h2>
                    <FonteBairro nome={b.name} />
                  </div>
                  <dl className="divide-y divide-border/60">
                    {LINHAS.map((l) => (
                      <div key={l.rotulo} className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-sm text-muted-foreground">
                          {l.rotulo}
                          {l.ajuda && <span className="block text-xs">{l.ajuda}</span>}
                        </dt>
                        <dd className="text-sm font-semibold text-foreground tabular-nums text-right">{l.valor(b)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex flex-col gap-2">
                    <Button asChild className="min-h-[44px]">
                      <Link to={linkSimuladorBairro(slug)} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "comparar", bairro: b.name })}>Simular {b.name}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="min-h-[44px]">
                      <Link to={`/bairro/${slug}`}>Ver análise do bairro</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground max-w-3xl">
        Receita de referência é uma conta simples (diária média × 30 × ocupação média) para comparar bairros; não inclui custos de operação nem é garantia de resultado.
      </p>

      <Card className="border-primary/20 bg-secondary/40">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-foreground">Já escolheu o bairro? A Bewild orça a reforma completa do seu studio.</p>
          <OrcamentoButton local="comparar" className="min-h-[44px]" />
        </CardContent>
      </Card>

      <Dialog open={compartilharAberto} onOpenChange={setCompartilharAberto}>
        <DialogContent className="font-body">
          <DialogHeader><DialogTitle className="font-display">Compartilhar comparação</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Quem abrir o link vê os mesmos bairros lado a lado.</p>
          <Input readOnly value={compartilharAberto ? link() : ""} onFocus={(e) => e.currentTarget.select()} className="min-h-[48px] text-base" aria-label="Link da comparação" />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => void copiar()} className="flex-1 min-h-[44px]">{copiado ? <><Check className="mr-2 h-4 w-4" />Link copiado</> : <><Copy className="mr-2 h-4 w-4" />Copiar link</>}</Button>
            <Button asChild variant="outline" className="flex-1 min-h-[44px]">
              <a href={compartilharAberto ? `https://wa.me/?text=${encodeURIComponent(`${texto} ${link()}`)}` : "#"} target="_blank" rel="noopener noreferrer" onClick={() => registrar("whatsapp")}>
                <MessageCircle className="mr-2 h-4 w-4" />Enviar no WhatsApp
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
