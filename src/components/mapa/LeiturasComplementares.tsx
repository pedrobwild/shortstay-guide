import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpDown, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import NaturezaTag from "@/components/radar/NaturezaTag";
import ROIRanking from "@/components/mapa/ROIRanking";
import NeighborhoodComparison from "@/components/mapa/NeighborhoodComparison";
import {
  NEIGHBORHOODS, EVENTS, DEMAND_FILTERS, EVENT_ICONS, IMPACT_STYLES, TAG_ICONS,
  type CityEvent,
} from "@/data/mapaBairrosData";
import { useBairroData } from "@/hooks/useBairroData";
import { alinharLeiturasComBase, nomesNaBase, temPerfil, type LeituraBairro } from "@/lib/leiturasBairros";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

/** Faixas do score interno (critério da Bewild, não estatística de mercado). */
const corScore = (score: number) => (score >= 88 ? "bg-primary" : score >= 84 ? "bg-accent" : "bg-muted-foreground/40");

/**
 * Leituras do mapa anterior, mantidas abaixo do novo explorador: ranking, bairros
 * por perfil de demanda, comparação rápida e eventos que aumentam a demanda (perfil
 * e evento destacam os bairros no mapa). Diária, ocupação e receita vêm da base do
 * Radar (os mesmos números do painel); score, concorrência e perfil de demanda são
 * critérios internos da Bewild.
 */
export default function LeiturasComplementares({
  eventoAtivo,
  onEvento,
  perfis,
  onPerfis,
  onSelecionarBairro,
  embutido = false,
}: {
  eventoAtivo: CityEvent | null;
  onEvento: (e: CityEvent | null) => void;
  perfis: string[];
  onPerfis: (perfis: string[]) => void;
  /** Leva o bairro para o painel do mapa (quando ele está na base do Radar). */
  onSelecionarBairro: (nome: string) => void;
  /** Dentro de uma seção do /mapa ("Estudo aberto"): sem margens da página e com título de nível 3. */
  embutido?: boolean;
}) {
  const { bairros } = useBairroData();
  const [comparando, setComparando] = useState(false);
  const [selecionado, setSelecionado] = useState<string | undefined>();

  const leituras = useMemo(() => alinharLeiturasComBase(NEIGHBORHOODS, bairros), [bairros]);
  const filtrados = useMemo(() => {
    if (!perfis.length) return leituras;
    return leituras.filter((n) => temPerfil(n, perfis));
  }, [leituras, perfis]);
  // Eventos: só os bairros próximos que estão na base (sem nenhum, o evento sai da lista).
  const eventos = useMemo(
    () => EVENTS.map((e) => ({ ...e, nearbyNeighborhoods: nomesNaBase(e.nearbyNeighborhoods, bairros) })).filter((e) => e.nearbyNeighborhoods.length > 0),
    [bairros],
  );
  const destacados = eventoAtivo ? nomesNaBase(eventoAtivo.nearbyNeighborhoods, bairros) : [];
  const escolher = (n: LeituraBairro) => { setSelecionado(n.name); onSelecionarBairro(n.name); };
  const alternarPerfil = (k: string) => onPerfis(perfis.includes(k) ? perfis.filter((x) => x !== k) : [...perfis, k]);

  return (
    <section aria-labelledby="leituras-titulo" className={embutido ? "min-w-0 pt-12" : "mx-auto max-w-[1280px] px-5 pb-14 pt-5 lg:px-10 lg:pt-14"}>
      <p className={embutido ? "e-rotulo mb-2" : "rotulo-secao mb-2.5"}>Outras leituras dos bairros</p>
      {embutido
        ? <h3 id="leituras-titulo" className="e-h2 mb-3">Perfil de demanda, eventos e ranking</h3>
        : <h2 id="leituras-titulo" className="mb-3 font-display text-[28px] font-bold leading-[1.15] text-foreground md:text-[36px]">Perfil de demanda, eventos e ranking</h2>}
      <p className={embutido ? "e-apoio mb-6 max-w-[720px]" : "mb-6 max-w-[760px] text-[15px] leading-[1.55] text-muted-foreground"}>
        Diária, ocupação e receita vêm da base do Radar, a mesma do painel acima. Score, concorrência e perfil de demanda são critérios internos da Bewild, não estatísticas de mercado.
      </p>

      {/* Perfil de demanda + comparação */}
      <div className="regua flex flex-wrap items-center gap-2 pt-4">
        <span className="mr-1 text-sm text-muted-foreground" id="rotulo-perfil">Perfil de demanda</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="rotulo-perfil">
          {DEMAND_FILTERS.map((f) => {
            const ativo = perfis.includes(f.key);
            const Icone = f.icon;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={ativo}
                onClick={() => alternarPerfil(f.key)}
                className={cn(
                  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  ativo ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground hover:bg-accent-light",
                )}
              >
                <Icone className="h-3.5 w-3.5" aria-hidden="true" />{f.label}
              </button>
            );
          })}
        </div>
        <Button variant="outline" onClick={() => setComparando((v) => !v)} aria-expanded={comparando} className="min-h-[44px] font-semibold sm:ml-auto">
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />Comparar bairros por perfil
        </Button>
      </div>
      {perfis.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Mostrando só bairros com esse tipo de público predominante; os da base do Radar ficam em destaque no mapa.</p>}

      {comparando && (
        <div className="mt-6">
          <NeighborhoodComparison onClose={() => setComparando(false)} disponiveis={leituras} initialNeighborhoods={leituras.slice(0, 2)} />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="min-w-0">
          <ROIRanking neighborhoods={filtrados} onSelectNeighborhood={escolher} selectedName={selecionado} />
        </div>
        <div className="min-w-0">
          <h3 className="mb-1 font-display text-xl font-bold text-foreground">Bairros analisados</h3>
          <p className="mb-3 text-sm text-muted-foreground">{filtrados.length} bairro{filtrados.length !== 1 ? "s" : ""} · score ≥ 88 alto, 84–87 moderado, &lt; 84 menor (critério interno)</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtrados.map((n) => {
              const ativo = selecionado === n.name;
              const emDestaque = destacados.includes(n.name);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => escolher(n)}
                    aria-pressed={ativo}
                    className={cn(
                      "h-full w-full rounded-md border bg-card p-4 text-left transition-colors hover:bg-accent-light",
                      ativo ? "border-primary ring-1 ring-primary" : emDestaque ? "border-estimate-border" : "border-border",
                    )}
                  >
                    <span className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-display text-base font-bold text-foreground">{n.name}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold tabular-nums text-foreground">
                        <span className={cn("h-2.5 w-2.5 rounded-full", corScore(n.score))} aria-hidden="true" />Score {n.score}
                      </span>
                    </span>
                    {(n.natureza !== "observado" || n.aviso) && (
                      <span className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        {n.natureza !== "observado" && <NaturezaTag tipo={n.natureza} tamanho="sm" />}
                        {n.aviso && <span className="text-[11px] font-medium text-estimate-text">{n.aviso}</span>}
                      </span>
                    )}
                    <span className="mb-1.5 flex flex-wrap gap-x-3 text-xs tabular-nums text-muted-foreground">
                      <span>{formatBRL(n.metrics.nightlyRate)}/noite</span>
                      <span>{formatPercent(n.metrics.occupancy, 0)} ocup.</span>
                      <span>{formatBRL(n.metrics.avgRevenueMo)}/mês ref.</span>
                    </span>
                    <span className="mb-2 block text-[11px] tabular-nums text-muted-foreground">
                      {n.metrics.activeListings != null ? `${formatDecimal(n.metrics.activeListings, 0)} anúncios · ` : ""}{n.natureza === "estimativa" ? "faixa estimada" : n.natureza === "aproximacao" ? "faixa central do Itaim Bibi" : "faixa central"} {formatBRL(n.metrics.nightlyRateRange[0])}–{formatBRL(n.metrics.nightlyRateRange[1])}/noite · {n.metrics.dataSource}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {n.tags.slice(0, 4).map((tag) => {
                        const Icone = TAG_ICONS[tag] || MapPin;
                        return (
                          <span key={tag} className="inline-flex items-center gap-1 rounded-[4px] bg-background px-1.5 py-0.5 text-[11px] font-medium text-foreground-medium">
                            <Icone size={10} aria-hidden="true" />{tag}
                          </span>
                        );
                      })}
                      {n.tags.length > 4 && <span className="text-[11px] text-muted-foreground">+{n.tags.length - 4}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Eventos */}
      <div className="mt-12">
        <h3 className="mb-1 flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <Calendar className="h-5 w-5 text-accent-text" aria-hidden="true" />Eventos que aumentam a demanda
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">Escolha um evento para destacar no mapa os bairros próximos. O nível de impacto é critério interno da Bewild.</p>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">Nível de impacto:</span>
          <span className="rounded-full bg-destructive-light px-2 py-0.5 text-destructive-text">Alta demanda — procura concentrada nas datas</span>
          <span className="rounded-full bg-estimate-light px-2 py-0.5 text-estimate-text">Média demanda — aumento moderado</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">Baixa demanda — impacto localizado</span>
        </div>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => {
            const Icone = EVENT_ICONS[evento.category as keyof typeof EVENT_ICONS] || Calendar;
            const estilo = IMPACT_STYLES[evento.impactLevel] || IMPACT_STYLES.low;
            const ativo = eventoAtivo?.id === evento.id;
            return (
              <li key={evento.id} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => onEvento(ativo ? null : evento)}
                  className={cn(
                    "flex h-full w-full items-start gap-2.5 rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent-light",
                    ativo ? "border-primary ring-1 ring-primary" : "border-border",
                  )}
                >
                  <span className={cn("rounded-md p-1.5", estilo.bg)}><Icone size={14} className={estilo.text} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-foreground">{evento.name}</span>
                      <span className={cn("shrink-0 rounded-[4px] px-1 text-[10px] font-semibold", estilo.bg, estilo.text)}>{estilo.label}</span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{evento.startDate.split("-").reverse().join("/")} — {evento.endDate.split("-").reverse().join("/")}</span>
                    <span className="block text-[11px] text-muted-foreground">{evento.location}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {evento.nearbyNeighborhoods.map((nome) => (
                        <span key={nome} className="rounded-[4px] bg-background px-1.5 py-0.5 text-[11px] text-foreground-medium">{nome}</span>
                      ))}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Continuação da análise (bloco final do mapa anterior) */}
      <div className="regua mt-12 flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-foreground">Combine a análise de bairro com o mercado e as tendências de 2026.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-[44px] font-semibold">
            <Link to="/mercado">Análise de mercado<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </Button>
          <Button asChild variant="outline" className="min-h-[44px] font-semibold">
            <Link to="/guia/tendencias">Tendências 2026<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
