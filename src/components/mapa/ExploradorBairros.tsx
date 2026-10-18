import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Layers, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import FonteBairro from "@/components/guide/FonteBairro";
import FaixaQuartis from "@/components/guide/FaixaQuartis";
import { VariacaoColetaBairro } from "@/components/guide/VariacaoColeta";
import Carimbo from "@/components/radar/Carimbo";
import NaturezaTag from "@/components/radar/NaturezaTag";
import Segmentado from "@/components/radar/Segmentado";
import AvisoBase from "@/components/radar/AvisoBase";
import MapaRadar, { CAMADAS_INICIAIS, type CamadasMapa } from "@/components/mapa/MapaRadar";
import { useBairroData } from "@/hooks/useBairroData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDeslocamentoChat } from "@/hooks/useDeslocamentoChat";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { POI_CATEGORIES, type POICategoryKey } from "@/data/mapaBairrosData";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";
import { linkProjecaoBairro } from "@/data/navegacao";
import type { BairroItem } from "@/data/guide-data";
import {
  FILTROS_INICIAIS, RECEITAS_MINIMAS, avisoAmostraBairro, extremosLegendaReceita, naturezaBairro, normalizarTexto, passaFiltros,
  temFiltroAtivo, textoSemQuartis, type FiltroFonte, type FiltrosMapa,
} from "@/lib/radarUi";
import { MAX_COMPARAR, caminhoComparar, lerComparar } from "@/lib/comparar";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { slugifyBairro } from "@/lib/seo";
import { definirBairroAtual, useBairroAtual } from "@/lib/bairroAtual";
import { cn } from "@/lib/utils";

const OPCOES_FONTE: { valor: FiltroFonte; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas as fontes" },
  { valor: "observados", rotulo: "Só dados observados" },
];
const rotuloReceita = (v: number) => (v === 0 ? "Qualquer" : `≥ ${formatBRL(v)}`);
const BAIRRO_PADRAO = "Pinheiros";
const ALTURA_FOLHA_RECOLHIDA = 236;
/** Faixa da página visível abaixo do mapa no celular (cabeçalho de 56px + 64px). */
const FAIXA_PAGINA_CELULAR = 64;

/** Chip de filtro (receita mínima, fonte no celular): 44px, ativo em azul profundo. */
function Chip({ ativo, onClick, children, className }: { ativo: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
        ativo ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground hover:bg-accent-light",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Controle das camadas de contexto do mapa (mantém as camadas do mapa anterior). */
function ControleCamadas({ camadas, onChange, className }: { camadas: CamadasMapa; onChange: (c: CamadasMapa) => void; className?: string }) {
  const ativas = [camadas.calor, camadas.clusters, camadas.metro].filter(Boolean).length + camadas.pois.length;
  const alternarPoi = (k: POICategoryKey) => onChange({ ...camadas, pois: camadas.pois.includes(k) ? camadas.pois.filter((x) => x !== k) : [...camadas.pois, k] });
  const linhas: { chave: "poligonos" | "calor" | "clusters" | "metro"; rotulo: string }[] = [
    { chave: "poligonos", rotulo: "Contorno dos bairros" },
    { chave: "calor", rotulo: "Mapa de calor de demanda" },
    { chave: "clusters", rotulo: "Agrupamento de anúncios" },
    { chave: "metro", rotulo: "Metrô e raio de caminhada" },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent-light", className)}
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          Camadas{ativas ? <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">{ativas}</span> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] max-w-[calc(100vw-24px)] rounded-lg p-4 font-body">
        <p className="mb-2 text-sm font-semibold text-foreground">Camadas do mapa</p>
        <div className="space-y-1">
          {linhas.map((l) => (
            <label key={l.chave} className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 text-sm text-foreground">
              {l.rotulo}
              <Switch checked={camadas[l.chave]} onCheckedChange={(v) => onChange({ ...camadas, [l.chave]: v })} />
            </label>
          ))}
        </div>
        <p className="mb-2 mt-3 text-sm font-semibold text-foreground">Pontos de interesse</p>
        <div className="flex flex-wrap gap-1.5">
          {POI_CATEGORIES.map((c) => {
            const ativo = camadas.pois.includes(c.key);
            const Icone = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={ativo}
                onClick={() => alternarPoi(c.key)}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                  ativo ? "border-primary bg-accent-light text-primary" : "border-input bg-card text-foreground-medium hover:bg-secondary",
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                <Icone className="h-3.5 w-3.5" aria-hidden="true" />{c.label}
              </button>
            );
          })}
        </div>
        {camadas.pois.length > 0 && (
          <button type="button" onClick={() => onChange({ ...camadas, pois: [] })} className="mt-1 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary underline underline-offset-[3px]">
            Limpar pontos de interesse
          </button>
        )}
        <p className="mt-3 text-xs leading-snug text-muted-foreground">
          Camadas de contexto: mapa de calor e agrupamentos são ilustrativos (critério interno da Bewild), não dado observado. Os números de cada bairro vêm só da base do Radar.
        </p>
      </PopoverContent>
    </Popover>
  );
}

/** Dados do bairro selecionado: usados no painel lateral (desktop) e no painel inferior (celular). */
function useResumoBairro(b: BairroItem | undefined) {
  return useMemo(() => {
    if (!b) return null;
    const receita = receitaMensalReferencia(b);
    return {
      receita,
      formula: `${formatBRL(b.dailyAvg)} × 30 × ${formatPercent(b.avgOccupancy, 0)}, antes de custos`,
      aviso: avisoAmostraBairro(b),
      natureza: naturezaBairro(b),
    };
  }, [b]);
}

export default function ExploradorBairros({
  destaque = [],
  rotuloDestaque,
  onLimparDestaque,
  pedidoCentralizar,
}: {
  /** Bairros em destaque no mapa (ex.: perto de um evento ou do perfil escolhido nas leituras abaixo). */
  destaque?: string[];
  rotuloDestaque?: string;
  onLimparDestaque?: () => void;
  /** Seleção feita fora do mapa (leituras abaixo): centraliza o mapa no bairro a cada pedido. */
  pedidoCentralizar?: { nome: string; n: number } | null;
}) {
  const { bairros, isLoading, offline, recarregar } = useBairroData();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [filtros, setFiltros] = useState<FiltrosMapa>(FILTROS_INICIAIS);
  const [camadas, setCamadas] = useState<CamadasMapa>(CAMADAS_INICIAIS);
  const [expandido, setExpandido] = useState(false);
  const [centralizar, setCentralizar] = useState<{ nome: string; n: number } | null>(null);
  const [alturaArea, setAlturaArea] = useState(700);
  const areaRef = useRef<HTMLDivElement>(null);

  // Seleção (?bairro=slug) e comparação (?b=slug,slug) vivem na URL.
  const porSlug = useMemo(() => new Map(bairros.map((b) => [slugifyBairro(b.name), b])), [bairros]);
  const slugs = useMemo(() => [...porSlug.keys()], [porSlug]);
  const slugSel = params.get("bairro");
  // Sem ?bairro= na URL, começa pelo bairro atual da pessoa (escolhido no hero, no simulador ou na página de bairro).
  const bairroAtual = useBairroAtual();
  const selecionado = (slugSel ? porSlug.get(slugifyBairro(slugSel)) : undefined)
    ?? (bairroAtual ? porSlug.get(bairroAtual.slug) : undefined)
    ?? bairros.find((b) => b.name === BAIRRO_PADRAO) ?? bairros[0];
  const comparacao = lerComparar(params.get("b"), slugs);
  const nomesComparacao = comparacao.map((s) => porSlug.get(s)?.name).filter((n): n is string => Boolean(n));
  const slugSelecionado = selecionado ? slugifyBairro(selecionado.name) : "";
  const naComparacao = comparacao.includes(slugSelecionado);
  const comparacaoCheia = comparacao.length >= MAX_COMPARAR;

  const visiveis = useMemo(() => new Set(bairros.filter((b) => passaFiltros(b, filtros)).map((b) => b.name)), [bairros, filtros]);
  const filtroAtivo = temFiltroAtivo(filtros);
  const semResultado = !isLoading && visiveis.size === 0;
  const extremos = extremosLegendaReceita(bairros);
  const resumo = useResumoBairro(selecionado);

  // Deep link com ?bairro=: centraliza o mapa no bairro uma vez.
  const centralizouLink = useRef(false);
  useEffect(() => {
    if (centralizouLink.current || !slugSel || !selecionado) return;
    centralizouLink.current = true;
    setCentralizar({ nome: selecionado.name, n: 1 });
  }, [slugSel, selecionado]);

  useEffect(() => {
    if (pedidoCentralizar) setCentralizar((c) => ({ nome: pedidoCentralizar.nome, n: (c?.n ?? 0) + 1 }));
  }, [pedidoCentralizar]);

  // Altura útil do mapa no celular (o painel expandido não passa do topo dos filtros).
  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setAlturaArea(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Bairro com amostra pequena (Mooca) ganha uma linha de aviso já no painel recolhido.
  const alturaRecolhida = ALTURA_FOLHA_RECOLHIDA + (resumo?.aviso ? 30 : 0);
  const alturaFolha = expandido ? Math.max(alturaRecolhida, Math.min(600, alturaArea - 128)) : alturaRecolhida;
  // No celular o mapa deixa 64px da página à mostra (para rolar até as leituras); o botão do chat
  // sobe acima do painel só enquanto o mapa ocupa a tela.
  const [mapaNaTela, setMapaNaTela] = useState(true);
  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setMapaNaTela(e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useDeslocamentoChat(desktop || !mapaNaTela ? null : alturaFolha + FAIXA_PAGINA_CELULAR + 12);

  const atualizarParams = (alterar: (p: URLSearchParams) => void) => {
    setParams((atual) => { const p = new URLSearchParams(atual); alterar(p); return p; }, { replace: true });
  };
  const selecionar = (nome: string) => {
    definirBairroAtual(nome);
    atualizarParams((p) => p.set("bairro", slugifyBairro(nome)));
    trackGlobal("cta_clicked", { cta_id: "mapa_selecionar_bairro", section: "mapa", bairro: nome });
  };
  const alternarComparacao = () => {
    if (!selecionado) return;
    if (naComparacao) {
      atualizarParams((p) => { const resto = comparacao.filter((s) => s !== slugSelecionado); if (resto.length) p.set("b", resto.join(",")); else p.delete("b"); });
    } else if (!comparacaoCheia) {
      atualizarParams((p) => p.set("b", [...comparacao, slugSelecionado].join(",")));
      trackGlobal("cta_clicked", { cta_id: "mapa_adicionar_comparacao", section: "mapa", bairro: selecionado.name });
    } else {
      navigate(caminhoComparar(comparacao));
    }
  };
  const limparFiltros = () => setFiltros(FILTROS_INICIAIS);
  const buscarEnter = () => {
    const q = normalizarTexto(filtros.busca);
    const primeiro = bairros.find((b) => visiveis.has(b.name) && (!q || normalizarTexto(b.name).includes(q)));
    if (primeiro) { selecionar(primeiro.name); setCentralizar((c) => ({ nome: primeiro.name, n: (c?.n ?? 0) + 1 })); }
  };

  const rotuloComparar = naComparacao
    ? `Na comparação (${comparacao.length} de ${MAX_COMPARAR}) · remover`
    : comparacaoCheia ? `Comparação cheia (${MAX_COMPARAR} de ${MAX_COMPARAR}) · abrir` : `Adicionar à comparação (${comparacao.length} de ${MAX_COMPARAR})`;
  const rotuloCompararCurto = naComparacao ? "Comparando" : comparacaoCheia ? "Comparação cheia" : "Comparar";
  const contador = `${visiveis.size} de ${bairros.length} bairros`;

  const campoBusca = (celular: boolean) => (
    <label className={cn("relative flex items-center", celular ? "w-full" : "w-[240px]")}>
      <span className="sr-only">Buscar bairro</span>
      <Search className={cn("pointer-events-none absolute h-4 w-4 text-muted-foreground", celular ? "left-4" : "left-3.5")} aria-hidden="true" />
      <input
        type="search"
        value={filtros.busca}
        onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarEnter(); } }}
        placeholder="Buscar bairro"
        enterKeyHint="search"
        className={cn(
          "w-full border border-input bg-card text-base text-foreground placeholder:text-muted-foreground",
          celular ? "min-h-[48px] rounded-3xl pl-11 pr-4 shadow-[0_2px_8px_hsl(var(--foreground)/0.08)]" : "min-h-[44px] rounded-lg pl-10 pr-3.5",
        )}
      />
    </label>
  );

  const acoesPrincipais = selecionado && (
    <Button asChild className="min-h-[48px] whitespace-normal text-[15px] font-semibold">
      <Link to={linkProjecaoBairro(slugSelecionado)} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "mapa", bairro: selecionado.name })}>
        Simular imóvel em {selecionado.name}
      </Link>
    </Button>
  );

  const quartisOuTexto = (variante: "padrao" | "frase") => selecionado && (
    selecionado.dailyQuartiles
      ? <FaixaQuartis quartis={selecionado.dailyQuartiles} media={variante === "padrao" ? selecionado.dailyAvg : undefined} variante={variante} />
      : <p className="text-sm leading-normal text-muted-foreground">{textoSemQuartis(selecionado)}</p>
  );

  return (
    <div className="lg:mx-auto lg:max-w-[1280px] lg:px-10 lg:pb-14 lg:pt-8">
      {/* Cabeçalho (desktop); no celular o mapa ocupa a tela e o título fica só para leitores de tela */}
      <div className="sr-only lg:not-sr-only lg:mb-5 lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div>
          <h1 className="mb-1.5 font-display text-[40px] font-bold leading-[1.1] text-foreground">Mapa de bairros</h1>
          <p className="text-base text-muted-foreground">Selecione um bairro para ver diária, ocupação, amostra e fonte.</p>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground" aria-live="polite">{contador}</span>
      </div>

      {/* Barra de filtros (desktop), entre réguas finas */}
      <div className="hidden flex-wrap items-center gap-3 border-y border-border py-3 lg:mb-4 lg:flex">
        {campoBusca(false)}
        <Segmentado rotulo="Fonte" valor={filtros.fonte} opcoes={OPCOES_FONTE} onChange={(v) => setFiltros((f) => ({ ...f, fonte: v }))} />
        <span className="ml-2 text-sm text-muted-foreground" id="rotulo-receita">Receita de referência</span>
        <div className="flex gap-1.5" role="group" aria-labelledby="rotulo-receita">
          {RECEITAS_MINIMAS.map((v) => (
            <Chip key={v} ativo={filtros.receitaMin === v} onClick={() => setFiltros((f) => ({ ...f, receitaMin: v }))}>{rotuloReceita(v)}</Chip>
          ))}
        </div>
        {filtroAtivo && (
          <button type="button" onClick={limparFiltros} className="min-h-[44px] px-2.5 text-sm font-semibold text-primary underline underline-offset-[3px]">Limpar filtros</button>
        )}
      </div>

      <div className="lg:grid lg:h-[680px] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
        {/* Área do mapa: tela inteira no celular */}
        <div ref={areaRef} className="relative h-[calc(100svh-120px)] min-h-[480px] overflow-hidden lg:h-full lg:min-h-0 lg:rounded-md lg:border lg:border-border">
          <MapaRadar
            bairros={bairros}
            selecionado={selecionado?.name ?? null}
            visiveis={visiveis}
            destaque={destaque}
            camadas={camadas}
            onSelecionar={selecionar}
            compacto={!desktop}
            centralizar={centralizar}
            folga={desktop ? { top: 72, bottom: 72, left: 56, right: 72 } : { top: 132, bottom: ALTURA_FOLHA_RECOLHIDA + 24, left: 28, right: 28 }}
          />

          {/* Celular: busca e chips flutuando no topo */}
          <div className="absolute inset-x-3 top-3 z-[5] grid min-w-0 gap-2 overflow-hidden lg:hidden">
            {campoBusca(true)}
            <div className="-mx-3 flex min-w-0 gap-1.5 overflow-x-auto px-3 pb-1 scrollbar-none" role="group" aria-label="Filtros">
              {OPCOES_FONTE.map((o) => (
                <Chip key={o.valor} ativo={filtros.fonte === o.valor} onClick={() => setFiltros((f) => ({ ...f, fonte: o.valor }))}>{o.rotulo}</Chip>
              ))}
              {RECEITAS_MINIMAS.map((v) => (
                <Chip key={v} ativo={filtros.receitaMin === v} onClick={() => setFiltros((f) => ({ ...f, receitaMin: v }))}>{v === 0 ? "Qualquer receita" : rotuloReceita(v)}</Chip>
              ))}
              <ControleCamadas camadas={camadas} onChange={setCamadas} className="rounded-full border-input" />
            </div>
            {offline && (
              <div role="alert" className="flex min-h-[44px] items-center gap-2 justify-self-start rounded-full border border-destructive-border bg-destructive-light pl-3.5 text-[13px] text-destructive-text">
                <span className="min-w-0 truncate">Base offline · reserva de {COLETA_GUESTFAVORITES}</span>
                <button type="button" onClick={recarregar} className="min-h-[44px] shrink-0 rounded-full px-3 font-semibold underline underline-offset-2">Tentar de novo</button>
              </div>
            )}
            {destaque.length > 0 && (
              <div className="flex min-h-[44px] max-w-full items-center justify-self-start rounded-full border border-estimate-border bg-estimate-light pl-3.5 text-[13px] text-estimate-text">
                <span className="min-w-0 truncate">{rotuloDestaque ?? "Bairros em destaque"}</span>
                {onLimparDestaque && (
                  <button type="button" onClick={onLimparDestaque} aria-label="Limpar destaque" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"><X className="h-4 w-4" aria-hidden="true" /></button>
                )}
              </div>
            )}
            <p className="sr-only" aria-live="polite">{contador}</p>
          </div>

          {/* Desktop: camadas e destaque no canto superior esquerdo */}
          <div className="absolute left-3 top-3 z-[4] hidden max-w-[calc(100%-80px)] flex-wrap items-center gap-2 lg:flex">
            <ControleCamadas camadas={camadas} onChange={setCamadas} />
            {destaque.length > 0 && (
              <span className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-estimate-border bg-estimate-light pl-3 pr-1 text-sm text-estimate-text">
                {rotuloDestaque ?? "Bairros em destaque"}
                {onLimparDestaque && (
                  <button type="button" onClick={onLimparDestaque} aria-label="Limpar destaque" className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-card"><X className="h-4 w-4" aria-hidden="true" /></button>
                )}
              </span>
            )}
          </div>

          {isLoading && (
            <div aria-busy="true" className="absolute inset-0 z-[3] flex items-center justify-center bg-mapa-fundo/70 text-[15px] text-muted-foreground">Carregando bairros…</div>
          )}

          {semResultado && (
            <div className="absolute left-1/2 top-1/2 z-[5] w-[calc(100%-48px)] max-w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card px-6 py-5 text-center">
              <p className="mb-1.5 font-semibold text-foreground">Nenhum bairro com esses filtros</p>
              <p className="mb-3 text-sm text-muted-foreground">Tente outro nome ou reduza a receita mínima.</p>
              <Button variant="outline" onClick={limparFiltros} className="min-h-[44px] font-semibold">Limpar filtros</Button>
            </div>
          )}

          {/* Legenda (desktop) */}
          <div className="absolute bottom-3 left-3 z-[4] hidden w-[250px] gap-2 rounded-lg border border-border bg-card/95 px-3.5 py-3 text-xs text-foreground-medium lg:grid">
            <strong className="text-xs font-semibold text-foreground">Receita mensal de referência</strong>
            <div className="flex h-2 overflow-hidden rounded-sm" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => <span key={n} className="flex-1" style={{ background: `hsl(var(--escala-${n}))` }} />)}
            </div>
            {extremos && <div className="flex justify-between tabular-nums"><span>{formatBRL(extremos[0])}</span><span>{formatBRL(extremos[1])}</span></div>}
            <div className="flex flex-wrap gap-x-3.5 gap-y-1">
              <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-foreground-medium" />tamanho = anúncios</span>
              {bairros.some((b) => naturezaBairro(b) === "aproximacao") && <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border-[1.5px] border-dashed border-accent-text" />aproximação</span>}
              <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border-[1.5px] border-dashed border-estimate" />estimativa</span>
            </div>
            {camadas.pois.length > 0 && (
              <div className="grid gap-1 border-t border-border pt-2">
                <strong className="text-xs font-semibold text-foreground">Pontos de interesse</strong>
                {POI_CATEGORIES.filter((c) => camadas.pois.includes(c.key)).map((c) => (
                  <span key={c.key} className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.label}</span>
                ))}
              </div>
            )}
          </div>

          {/* Barra "Comparando" (desktop) */}
          {nomesComparacao.length > 0 && !isLoading && (
            <div className="absolute bottom-3 right-3 z-[4] hidden max-w-[calc(100%-290px)] items-center gap-3 rounded-lg bg-foreground py-1.5 pl-4 pr-1.5 text-sm text-background lg:flex">
              <span className="truncate">Comparando: {nomesComparacao.join(", ")}</span>
              <Link to={caminhoComparar(comparacao)} className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-md bg-card px-3.5 font-semibold text-foreground hover:bg-accent-light">
                Abrir comparação<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* Celular: atalho para a comparação, acima do painel */}
          {nomesComparacao.length > 0 && !isLoading && (
            <Link
              to={caminhoComparar(comparacao)}
              className="absolute left-3 z-[6] inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-sheet transition-[bottom] [transition-duration:250ms] lg:hidden"
              style={{ bottom: alturaFolha + 12 }}
            >
              Comparando {nomesComparacao.length} · Abrir<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}

          {/* Celular: painel inferior do bairro (recolhido 236px / expandido) */}
          {selecionado && resumo && (
            <section
              aria-label="Bairro selecionado"
              className="absolute inset-x-0 bottom-0 z-[6] flex flex-col rounded-t-2xl bg-card shadow-sheet transition-[height] [transition-duration:250ms] ease-out lg:hidden"
              style={{ height: alturaFolha }}
            >
              <button
                type="button"
                onClick={() => setExpandido((v) => !v)}
                aria-expanded={expandido}
                aria-label={expandido ? "Recolher painel" : "Expandir painel"}
                className="flex h-7 shrink-0 items-center justify-center"
              >
                <span className="h-1 w-10 rounded-full bg-input" aria-hidden="true" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto px-5">
                {isLoading ? (
                  <div aria-busy="true" className="grid gap-3 pt-1"><div className="h-7 w-1/2 rounded bg-secondary" /><div className="h-14 rounded bg-trilho" /></div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="mb-1.5 truncate font-display text-[26px] font-bold leading-[1.1] text-foreground">{selecionado.name}</h2>
                        <NaturezaTag tipo={resumo.natureza} />
                        {resumo.aviso && <p className="mt-1.5 text-xs font-medium text-estimate-text">Atenção: {resumo.aviso}</p>}
                      </div>
                      <Button variant="outline" onClick={() => setExpandido((v) => !v)} className="min-h-[44px] shrink-0 px-3 text-[13px] font-semibold">
                        {expandido ? "Recolher" : "Detalhes"}
                      </Button>
                    </div>
                    <dl className="mt-3.5 grid grid-cols-3 border-t border-foreground">
                      <div className="py-2.5 pr-2"><dt className="text-xs text-muted-foreground">Diária média</dt><dd className="mt-0.5 text-xl font-semibold tabular-nums">{formatBRL(selecionado.dailyAvg)}</dd></div>
                      <div className="border-l border-border px-2 py-2.5"><dt className="text-xs text-muted-foreground">Ocupação</dt><dd className="mt-0.5 text-xl font-semibold tabular-nums">{formatPercent(selecionado.avgOccupancy, 0)}</dd></div>
                      <div className="border-l border-border py-2.5 pl-2"><dt className="text-xs text-muted-foreground">Receita ref.</dt><dd className="mt-0.5 text-xl font-semibold tabular-nums">{formatBRL(resumo.receita)}</dd></div>
                    </dl>
                    {expandido && (
                      <div className="pb-3">
                        <div className="grid gap-2 border-t border-border py-3 text-sm">
                          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Anúncios na amostra</span><strong className="font-semibold tabular-nums">{selecionado.activeListings != null ? formatDecimal(selecionado.activeListings, 0) : "—"}</strong></div>
                          <div className="flex justify-between gap-3"><span className="shrink-0 text-muted-foreground">Período</span><strong className="text-right font-semibold">{selecionado.period ?? "—"}</strong></div>
                          <div><span className="text-muted-foreground">Fonte</span><FonteBairro nome={selecionado.name} semNatureza carimbo /></div>
                          <p className="text-xs text-muted-foreground">Receita de referência: {resumo.formula}</p>
                        </div>
                        <div className="border-t border-border py-3">
                          <p className="mb-1.5 text-sm text-foreground">Faixa de diárias{resumo.natureza === "aproximacao" ? " do Itaim Bibi" : ""}</p>
                          {quartisOuTexto("frase")}
                        </div>
                        {resumo.aviso && <p className="mb-2 rounded-md bg-estimate-light px-3 py-2.5 text-[13px] text-estimate-text">Atenção: {resumo.aviso}. A faixa pode não representar o bairro.</p>}
                        <VariacaoColetaBairro bairro={selecionado.name} className="mb-2 p-3" />
                        <p className="text-xs text-muted-foreground">Cor = receita mensal de referência · tamanho = anúncios na amostra · contorno tracejado azul = aproximação pelo Itaim Bibi · âmbar = estimativa Bewild.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 px-5 pb-5 pt-3">
                <Button variant="outline" onClick={alternarComparacao} aria-pressed={naComparacao} className={cn("min-h-[48px] text-sm font-semibold", naComparacao && "bg-accent-light")}>
                  {naComparacao && <Check className="h-4 w-4" aria-hidden="true" />}{rotuloCompararCurto}
                </Button>
                <Button asChild className="min-h-[48px] text-sm font-semibold">
                  <Link to={linkProjecaoBairro(slugSelecionado)} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "mapa", bairro: selecionado.name })}>Simular imóvel</Link>
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Desktop: painel do bairro */}
        <aside aria-label="Bairro selecionado" className="hidden min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6">
          {offline && (
            <AvisoBase onTentar={recarregar} className="mb-4 py-2.5 text-sm">
              Não foi possível carregar a base do Radar. Mostrando a reserva offline (coleta de {COLETA_GUESTFAVORITES}); nenhum número foi alterado.
            </AvisoBase>
          )}
          {isLoading || !selecionado || !resumo ? (
            <div aria-busy="true" className="grid gap-3">
              <div className="h-3.5 w-2/5 rounded-[3px] bg-secondary" /><div className="h-8 w-[70%] rounded-[3px] bg-secondary" />
              <div className="h-[90px] rounded-[3px] bg-trilho" /><div className="h-[60px] rounded-[3px] bg-trilho" />
            </div>
          ) : (
            <>
              <p className="mb-1 text-[13px] text-muted-foreground">Bairro selecionado</p>
              <h2 className="mb-4 font-display text-[32px] font-bold leading-[1.1] text-foreground">{selecionado.name}</h2>
              {/* Carimbo de fonte (o mesmo do hero da home): natureza, números e origem num bloco só */}
              <Carimbo
                titulo="Referência do bairro"
                tag={<NaturezaTag tipo={resumo.natureza} />}
                celulas={[
                  { rotulo: "Diária média", valor: formatBRL(selecionado.dailyAvg) },
                  { rotulo: "Ocupação", valor: formatPercent(selecionado.avgOccupancy, 0) },
                  {
                    rotulo: "Anúncios",
                    valor: selecionado.activeListings != null ? formatDecimal(selecionado.activeListings, 0) : "—",
                    nota: resumo.aviso ? "amostra pequena" : undefined,
                  },
                ]}
                valorClassName="min-[360px]:text-2xl"
                rodape={<FonteBairro nome={selecionado.name} semNatureza rodape />}
              />
              <div className="mt-1 border-b border-border py-3.5">
                <div className="flex items-baseline justify-between gap-3"><span className="text-sm text-foreground-medium">Receita mensal de referência</span><strong className="text-xl font-semibold tabular-nums">{formatBRL(resumo.receita)}</strong></div>
                <p className="mt-1 text-xs text-muted-foreground">{resumo.formula}</p>
              </div>
              <div className="pb-1 pt-4">
                <p className="mb-2 text-sm text-foreground-medium">Faixa de diárias{resumo.natureza === "aproximacao" ? " do Itaim Bibi" : ""}</p>
                {quartisOuTexto("padrao")}
                {resumo.aviso && <p className="mt-3 rounded-md bg-estimate-light px-3 py-2.5 text-[13px] text-estimate-text">Atenção: {resumo.aviso}. A faixa pode não representar o bairro.</p>}
              </div>
              <VariacaoColetaBairro bairro={selecionado.name} className="mb-4 mt-3 p-3" />
            </>
          )}
          </div>
          {!isLoading && selecionado && (
            <div className="grid shrink-0 gap-2 px-6 pb-6 pt-4">
              {acoesPrincipais}
              <Button variant="outline" onClick={alternarComparacao} aria-pressed={naComparacao} className={cn("min-h-[44px] whitespace-normal text-[15px] font-semibold", naComparacao && "bg-accent-light")}>
                {naComparacao && <Check className="h-4 w-4" aria-hidden="true" />}{rotuloComparar}
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
