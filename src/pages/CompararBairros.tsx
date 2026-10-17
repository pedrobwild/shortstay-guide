import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Copy, MessageCircle, Plus, Share2, X } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import OrcamentoButton from "@/components/OrcamentoButton";
import RodapeRadar from "@/components/RodapeRadar";
import FonteBairro from "@/components/guide/FonteBairro";
import FaixaQuartis from "@/components/guide/FaixaQuartis";
import { VariacaoColetaBairro, useVariacoesVisiveis } from "@/components/guide/VariacaoColeta";
import NaturezaTag from "@/components/radar/NaturezaTag";
import AvisoBase from "@/components/radar/AvisoBase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { BairroProvider, useBairroData } from "@/hooks/useBairroData";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";
import type { BairroItem } from "@/data/guide-data";
import { linkProjecaoBairro } from "@/data/navegacao";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { COR_SERIE, avisoAmostraBairro, fimEscalaQuartis, marcaNatureza, naturezaBairro, textoSemQuartis, type NaturezaBairro } from "@/lib/radarUi";
import { slugifyBairro } from "@/lib/seo";
import { MAX_COMPARAR, caminhoComparar, lerComparar } from "@/lib/comparar";
import { cn } from "@/lib/utils";

/**
 * Compara até 3 bairros lado a lado com os números da base aprovada
 * (diária, ocupação, quartis, anúncios e receita de referência = diária × 30 × ocupação),
 * cada um com sua fonte. A seleção vive na URL (?b=slug,slug) para ser compartilhada.
 * Desktop: tabela com rótulos à esquerda; celular: leitura por indicador.
 */
export default function CompararBairros() {
  return (
    <BairroProvider>
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <CompararConteudo />
        <RodapeRadar />
      </div>
    </BairroProvider>
  );
}

const LINHAS: { rotulo: string; ajuda?: string; valor: (b: BairroItem) => number | null; texto: (v: number | null) => string }[] = [
  { rotulo: "Diária média (ADR)", valor: (b) => b.dailyAvg, texto: (v) => (v == null ? "—" : formatBRL(v)) },
  { rotulo: "Ocupação média", valor: (b) => b.avgOccupancy, texto: (v) => (v == null ? "—" : formatPercent(v, 0)) },
  { rotulo: "Anúncios na amostra", ajuda: "tamanho da amostra da fonte", valor: (b) => b.activeListings, texto: (v) => (v == null ? "—" : formatDecimal(v, 0)) },
  { rotulo: "Receita mensal de referência", ajuda: "diária × 30 × ocupação, antes de custos", valor: (b) => receitaMensalReferencia(b), texto: (v) => (v == null ? "—" : formatBRL(v)) },
];

/** Barra proporcional ao maior valor da linha, na cor da série (estimativa listrada em âmbar, aproximação em azul). */
/** Marca curta ao lado do nome no celular: estimativa, aproximação ou amostra pequena (Mooca). */
function marcaBairro(b: BairroItem): string | null {
  return marcaNatureza(b) ?? (avisoAmostraBairro(b) ? "amostra pequena" : null);
}

function Barra({ fracao, serie, natureza, alto = 6 }: { fracao: number; serie: number; natureza: NaturezaBairro; alto?: 6 | 8 }) {
  const listrada = natureza === "estimativa" ? "bg-estimativa-listrada" : natureza === "aproximacao" ? "bg-aproximacao-listrada" : null;
  return (
    <div className="rounded-full bg-trilho" style={{ height: alto }} aria-hidden="true">
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", listrada)}
        style={{ width: `${(Math.max(0, Math.min(1, fracao)) * 100).toFixed(1)}%`, background: listrada ? undefined : COR_SERIE[serie] }}
      />
    </div>
  );
}

function CompararConteudo() {
  const { bairros, isLoading, offline, recarregar } = useBairroData();
  const [params, setParams] = useSearchParams();
  const [escolhendo, setEscolhendo] = useState(false);
  const [compartilharAberto, setCompartilharAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const variacoes = useVariacoesVisiveis();

  const slugsDisponiveis = useMemo(() => bairros.map((b) => slugifyBairro(b.name)), [bairros]);
  const pedidos = lerComparar(params.get("b"), slugsDisponiveis);
  // Sem seleção na URL, começa com os três primeiros bairros da base.
  const slugs = params.get("b") === null ? slugsDisponiveis.slice(0, MAX_COMPARAR) : pedidos;
  const selecionados = slugs
    .map((s) => bairros.find((b) => slugifyBairro(b.name) === s))
    .filter((b): b is BairroItem => Boolean(b));
  const disponiveis = bairros.filter((b) => !slugs.includes(slugifyBairro(b.name)));
  const vagas = Array.from({ length: MAX_COMPARAR }, (_, i) => selecionados[i] ?? null);
  const fimEscala = fimEscalaQuartis(selecionados);
  const temVariacao = selecionados.some((b) => variacoes.some((v) => v.bairro === b.name));

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
  const simular = (b: BairroItem) => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "comparar", bairro: b.name });

  const linhasCalculadas = LINHAS.map((l) => {
    const brutos = selecionados.map((b) => l.valor(b));
    const valores = brutos.map((v) => v ?? 0);
    const maior = Math.max(1, ...valores);
    // "maior" só faz sentido com dois ou mais bairros com valor nesta linha.
    const comValor = brutos.filter((v) => v != null).length;
    return { ...l, valores, maior, comValor };
  });
  const ehMaior = (v: number, linha: { maior: number; comValor: number }) => linha.comValor > 1 && v === linha.maior && v > 0;

  const botaoAdicionar = selecionados.length < MAX_COMPARAR && disponiveis.length > 0;
  // Com bairros escolhidos, a comparação aparece já com a base de reserva (mesmos números aprovados)
  // enquanto a base do Radar carrega; o esqueleto só ocupa o lugar quando ainda não há seleção.
  const mostrarComparacao = selecionados.length > 0;

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-5 md:px-10 md:pt-10">
      <h1 className="mb-1.5 font-display text-[28px] font-bold leading-[1.1] text-foreground md:mb-2 md:text-[40px]">Comparar bairros</h1>
      <p className="mb-4 max-w-[680px] text-sm text-muted-foreground md:mb-6 md:text-base">
        <span className="md:hidden">Até {MAX_COMPARAR} bairros. Cada número com a sua fonte.</span>
        <span className="hidden md:inline">Escolha até {MAX_COMPARAR} bairros e veja diária, ocupação e faixa de preço lado a lado, cada número com a sua fonte.</span>
      </p>

      {/* Seleção: chips com remover, adicionar e compartilhar */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 md:gap-2">
        {selecionados.map((b, i) => (
          <span key={b.name} className="inline-flex min-h-[44px] items-center gap-0.5 rounded-[22px] border border-input bg-card pl-3 pr-1 text-sm font-medium text-foreground md:pl-4 md:text-[15px]">
            <span className="mr-1.5 h-2 w-2 shrink-0 rounded-full md:hidden" style={{ background: COR_SERIE[i] }} aria-hidden="true" />
            {b.name}
            <button type="button" onClick={() => remover(b)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-medium transition-colors hover:bg-secondary" aria-label={`Remover ${b.name}`}>
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
        {botaoAdicionar && (
          <button
            type="button"
            onClick={() => setEscolhendo((v) => !v)}
            aria-expanded={escolhendo}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[22px] border border-dashed border-serie-3 px-4 text-sm font-semibold text-primary transition-colors hover:bg-accent-light md:text-[15px]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /><span className="md:hidden">Adicionar</span><span className="hidden md:inline">Adicionar bairro</span>
          </button>
        )}
        <span className="ml-1 text-sm text-muted-foreground" aria-live="polite">{selecionados.length} de {MAX_COMPARAR}</span>
        {selecionados.length > 0 && (
          <Button variant="outline" className="ml-auto hidden min-h-[44px] px-4 text-[15px] font-semibold md:inline-flex" onClick={() => void compartilhar()}>
            <Share2 className="h-4 w-4" aria-hidden="true" />Compartilhar comparação
          </Button>
        )}
      </div>
      {escolhendo && (
        <div className="mb-3 flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-3">
          {disponiveis.map((b) => (
            <button key={b.name} type="button" onClick={() => adicionar(b)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent-light">
              {b.name}
              {marcaNatureza(b) && <span className={cn("text-xs font-medium", naturezaBairro(b) === "aproximacao" ? "text-accent-text" : "text-estimate-text")}>{marcaNatureza(b)}</span>}
              {avisoAmostraBairro(b) && <span className="text-xs font-medium text-estimate-text">amostra pequena</span>}
              <span className="tabular-nums text-muted-foreground">{formatBRL(receitaMensalReferencia(b))}</span>
            </button>
          ))}
        </div>
      )}

      {offline && (
        <AvisoBase className="mt-4" onTentar={recarregar}>
          Não foi possível carregar a base do Radar. Mostrando a reserva offline (coleta de {COLETA_GUESTFAVORITES}).
        </AvisoBase>
      )}

      {/* Estados */}
      {isLoading && selecionados.length === 0 && (
        <div aria-busy="true" aria-label="Carregando bairros" className="mt-6 grid gap-4 md:grid-cols-[180px_repeat(3,minmax(0,1fr))] lg:grid-cols-[240px_repeat(3,minmax(0,1fr))]">
          <div className="hidden md:block" />
          {[0, 1, 2].map((i) => <div key={i} className="h-[200px] rounded-md bg-secondary md:h-[420px]" />)}
        </div>
      )}
      {!isLoading && selecionados.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-input p-12 text-center text-muted-foreground">Nenhum bairro escolhido. Use “Adicionar bairro” para começar.</div>
      )}

      {/* Desktop/tablet: tabela com rótulos à esquerda */}
      {mostrarComparacao && (
        <div role="table" aria-label="Comparação de bairros" className="mt-6 hidden rounded-md border border-border bg-card md:block">
          <div role="row" className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] border-b-2 border-foreground lg:grid-cols-[240px_repeat(3,minmax(0,1fr))]">
            <div role="columnheader" className="self-end p-5 text-[13px] text-muted-foreground">Indicador</div>
            {vagas.map((b, i) => (
              <div key={b?.name ?? `vaga-${i}`} role="columnheader" className="min-w-0 border-l border-border p-5">
                {b ? (
                  <>
                    <h2 className="mb-2 font-display text-2xl font-bold leading-[1.15] text-foreground">{b.name}</h2>
                    <NaturezaTag tipo={naturezaBairro(b)} />
                    <div className="mt-1.5 text-xs text-muted-foreground"><FonteBairro nome={b.name} semNatureza /></div>
                  </>
                ) : botaoAdicionar ? (
                  <button type="button" onClick={() => setEscolhendo(true)} className="inline-flex min-h-[72px] w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-input text-sm font-semibold text-primary transition-colors hover:bg-accent-light">
                    <Plus className="h-4 w-4" aria-hidden="true" />Adicionar bairro
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {linhasCalculadas.map((l) => (
            <div key={l.rotulo} role="row" className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] border-b border-border lg:grid-cols-[240px_repeat(3,minmax(0,1fr))]">
              <div role="rowheader" className="px-5 py-[18px]">
                <div className="text-[15px] font-medium text-foreground">{l.rotulo}</div>
                {l.ajuda && <div className="mt-0.5 text-xs text-muted-foreground">{l.ajuda}</div>}
              </div>
              {vagas.map((b, i) => {
                if (!b) return <div key={`vaga-${i}`} role="cell" className="border-l border-border" />;
                const bruto = l.valor(b);
                const v = l.valores[i];
                return (
                  <div key={b.name} role="cell" className="min-w-0 border-l border-border px-5 py-[18px]">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[22px] font-semibold tabular-nums text-foreground lg:text-[26px]">{l.texto(bruto)}</span>
                      {ehMaior(v, l) && <span className="text-xs font-semibold text-accent-text">maior</span>}
                    </div>
                    <div className="mt-2"><Barra fracao={v / l.maior} serie={i} natureza={naturezaBairro(b)} /></div>
                  </div>
                );
              })}
            </div>
          ))}

          <div role="row" className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] border-b border-border lg:grid-cols-[240px_repeat(3,minmax(0,1fr))]">
            <div role="rowheader" className="px-5 py-[18px]">
              <div className="text-[15px] font-medium text-foreground">Faixa de diárias</div>
              <div className="mt-0.5 text-xs text-muted-foreground">25% mais baratos · mediana · 25% mais caros, em escala comum de R$ 0 a {formatBRL(fimEscala)}</div>
            </div>
            {vagas.map((b, i) => (
              <div key={b?.name ?? `vaga-${i}`} role="cell" className="min-w-0 border-l border-border px-5 py-[18px]">
                {b && (b.dailyQuartiles
                  ? <FaixaQuartis quartis={b.dailyQuartiles} escala={[0, fimEscala]} variante="linha" legendaMedia={false} />
                  : <p className="text-[13px] leading-[1.45] text-muted-foreground">{textoSemQuartis(b)}</p>)}
              </div>
            ))}
          </div>

          {temVariacao && (
            <div role="row" className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] border-b border-border lg:grid-cols-[240px_repeat(3,minmax(0,1fr))]">
              <div role="rowheader" className="px-5 py-[18px]">
                <div className="text-[15px] font-medium text-foreground">O que mudou nesta coleta</div>
                <div className="mt-0.5 text-xs text-muted-foreground">comparação com a coleta anterior da mesma fonte</div>
              </div>
              {vagas.map((b, i) => (
                <div key={b?.name ?? `vaga-${i}`} role="cell" className="min-w-0 border-l border-border px-5 py-[18px]">
                  {b && <VariacaoColetaBairro bairro={b.name} className="border-0 bg-transparent p-0" />}
                </div>
              ))}
            </div>
          )}

          <div role="row" className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] lg:grid-cols-[240px_repeat(3,minmax(0,1fr))]">
            <div role="rowheader" className="px-5 py-[18px]"><span className="sr-only">Ações</span></div>
            {vagas.map((b, i) => (
              <div key={b?.name ?? `vaga-${i}`} role="cell" className="grid min-w-0 content-start gap-1.5 border-l border-border px-5 py-[18px]">
                {b && (
                  <>
                    <Button asChild className="min-h-[44px] whitespace-normal font-semibold">
                      <Link to={linkProjecaoBairro(slugifyBairro(b.name))} onClick={() => simular(b)}>Simular {b.name}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="min-h-[44px] whitespace-normal font-semibold text-primary">
                      <Link to={`/bairro/${slugifyBairro(b.name)}`}>Ver análise do bairro</Link>
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Celular: leitura por indicador, com o nome junto de cada valor */}
      {mostrarComparacao && (
        <div className="md:hidden">
          {linhasCalculadas.map((l) => (
            <section key={l.rotulo} className="border-t border-border py-4">
              <h2 className="font-body text-[15px] font-semibold text-foreground">{l.rotulo}</h2>
              {l.ajuda && <p className="mt-0.5 text-xs text-muted-foreground">{l.ajuda}</p>}
              <ul className="mt-2.5 space-y-1">
                {selecionados.map((b, i) => (
                  <li key={b.name} className="grid min-h-[32px] grid-cols-[110px_minmax(0,1fr)_84px] items-center gap-2.5">
                    <span className="flex min-w-0 items-center gap-1.5 text-[13px]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COR_SERIE[i] }} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate">{b.name}</span>
                        {marcaBairro(b) && <span className={cn("block truncate text-[11px] leading-tight", naturezaBairro(b) === "aproximacao" ? "text-accent-text" : "text-estimate-text")}>{marcaBairro(b)}</span>}
                      </span>
                    </span>
                    <Barra fracao={l.valores[i] / l.maior} serie={i} natureza={naturezaBairro(b)} alto={8} />
                    <span className="text-right text-[15px] font-semibold tabular-nums">{l.texto(l.valor(b))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className="border-t border-border py-4">
            <h2 className="font-body text-[15px] font-semibold text-foreground">Faixa de diárias</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Escala comum de R$ 0 a {formatBRL(fimEscala)}</p>
            <ul className="mt-2.5 space-y-3">
              {selecionados.map((b, i) => (
                <li key={b.name}>
                  <span className="flex flex-wrap items-center gap-1.5 text-[13px]"><span className="h-2 w-2 rounded-full" style={{ background: COR_SERIE[i] }} aria-hidden="true" />{b.name}{marcaBairro(b) && <span className={cn("text-[11px]", naturezaBairro(b) === "aproximacao" ? "text-accent-text" : "text-estimate-text")}>· {marcaBairro(b)}</span>}</span>
                  {b.dailyQuartiles
                    ? <FaixaQuartis quartis={b.dailyQuartiles} escala={[0, fimEscala]} variante="linha" legendaMedia={false} />
                    : <p className="mt-1 text-[13px] text-muted-foreground">{textoSemQuartis(b)}</p>}
                </li>
              ))}
            </ul>
          </section>
          <section className="border-t border-border py-4">
            <h2 className="font-body text-[15px] font-semibold text-foreground">Fontes</h2>
            <ul className="mt-2 space-y-3">
              {selecionados.map((b) => (
                <li key={b.name} className="text-[13px]">
                  <span className="flex flex-wrap items-center gap-2"><strong className="font-semibold">{b.name}</strong><NaturezaTag tipo={naturezaBairro(b)} /></span>
                  <FonteBairro nome={b.name} semNatureza />
                  <VariacaoColetaBairro bairro={b.name} className="mt-1 p-3" />
                  <span className="flex flex-wrap gap-x-4">
                    <Link to={linkProjecaoBairro(slugifyBairro(b.name))} onClick={() => simular(b)} className="inline-flex min-h-[44px] items-center font-medium text-primary underline underline-offset-4">Simular imóvel em {b.name}</Link>
                    <Link to={`/bairro/${slugifyBairro(b.name)}`} className="inline-flex min-h-[44px] items-center font-medium text-primary underline underline-offset-4">Ver análise de {b.name}</Link>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <p className="mb-4 mt-2 text-xs text-muted-foreground">Receita de referência = diária média × 30 × ocupação média, antes de custos. Estimativas Bewild aparecem com listras âmbar; aproximações pelo Itaim Bibi, com listras azuis.</p>
          <div className="grid gap-2">
            <Button asChild className="min-h-[48px] text-[15px] font-semibold">
              <Link to={linkProjecaoBairro(slugifyBairro(selecionados[0].name))} onClick={() => simular(selecionados[0])}>Simular {selecionados[0].name}</Link>
            </Button>
            <Button variant="outline" className="min-h-[48px] text-[15px] font-semibold" onClick={() => void compartilhar()}>
              <Share2 className="h-4 w-4" aria-hidden="true" />Compartilhar comparação
            </Button>
          </div>
        </div>
      )}

      <p className="mb-10 mt-4 hidden max-w-[820px] text-[13px] text-muted-foreground md:block">
        Receita de referência é uma conta simples (diária média × 30 × ocupação média) para comparar bairros; não inclui custos de operação nem é garantia de resultado.
      </p>

      <div className="regua mt-8 flex flex-col gap-4 py-6 md:mt-0 md:flex-row md:items-center md:justify-between md:gap-6">
        <p className="font-display text-xl font-semibold leading-snug text-foreground md:text-[22px]">Já escolheu o bairro? A Bewild orça a reforma completa do seu studio.</p>
        <OrcamentoButton local="comparar" rotulo="Solicitar orçamento" icone={false} className="min-h-[48px] shrink-0 whitespace-nowrap px-[22px] text-[15px] font-semibold" />
      </div>

      <Dialog open={compartilharAberto} onOpenChange={setCompartilharAberto}>
        <DialogContent className="max-w-[480px] gap-0 p-7 font-body">
          <DialogTitle className="mb-2 pr-6 font-display text-[26px] font-bold leading-[1.2]">Compartilhar comparação</DialogTitle>
          <DialogDescription className="mb-3.5 text-[15px] text-muted-foreground">Quem abrir o link vê os mesmos bairros lado a lado.</DialogDescription>
          <Input readOnly value={compartilharAberto ? link() : ""} onFocus={(e) => e.currentTarget.select()} className="mb-3 min-h-[48px] text-base" aria-label="Link da comparação" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => void copiar()} className="min-h-[44px] text-[15px] font-semibold">
              {copiado ? <><Check className="h-4 w-4" aria-hidden="true" />Link copiado</> : <><Copy className="h-4 w-4" aria-hidden="true" />Copiar link</>}
            </Button>
            <Button asChild variant="outline" className="min-h-[44px] text-[15px] font-semibold">
              <a href={compartilharAberto ? `https://wa.me/?text=${encodeURIComponent(`${texto} ${link()}`)}` : "#"} target="_blank" rel="noopener noreferrer" onClick={() => registrar("whatsapp")}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />Enviar no WhatsApp
              </a>
            </Button>
          </div>
          <Button variant="ghost" onClick={() => setCompartilharAberto(false)} className="mt-3 min-h-[44px] w-full text-sm font-medium text-muted-foreground">Fechar</Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
