import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Minus, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import OrcamentoButton from "@/components/OrcamentoButton";
import ProjectAnalytics from "@/components/ota/ProjectAnalytics";
import BwildVsDiySection from "@/components/ota/BwildVsDiySection";
import NaturezaTag, { type TipoNatureza } from "@/components/radar/NaturezaTag";
import Segmentado from "@/components/radar/Segmentado";
import Stepper from "@/components/radar/Stepper";
import AvisoBase from "@/components/radar/AvisoBase";
import FonteBairro from "@/components/guide/FonteBairro";
import { useBairroData } from "@/hooks/useBairroData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDeslocamentoChat } from "@/hooks/useDeslocamentoChat";
import { trackSimulationUsed } from "@/lib/marketingConsent";
import { diariaPorMetragem, type SizeKey } from "@/data/bairrosCurados";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";
import type { BairroItem } from "@/data/guide-data";
import { DEFAULT_SP_SEASONALITY, projectionBreakdown, type ProjectionBreakdown } from "@/lib/projectAnalytics";
import {
  CAMPOS, FAIXAS_AREA, PREMISSAS_PADRAO, armazenamentoLocal, lerPremissasSalvas, salvarPremissas, type PremissasProjecao,
} from "@/lib/projecaoPremissas";
import { ajusteManual, avisoAmostraBairro, naturezaBairro } from "@/lib/radarUi";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";

const BAIRRO_PADRAO = "Pinheiros";
const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const mesAno = (m: { monthLabel: string; year: number }) => `${m.monthLabel}/${m.year}`;
const mesAnoCurto = (m: { monthLabel: string; year: number }) => `${m.monthLabel}/${String(m.year).slice(2)}`;
const noites = (v: number) => `${formatDecimal(v, 0)} noite${v === 1 ? "" : "s"}`;

/** Valores de 12 meses para a tela (a cadeia anualiza pelo número de meses da janela). */
function anualizar(r: ProjectionBreakdown) {
  const fator = 12 / r.monthsObserved;
  const custos = r.totalCostsBrl * fator;
  return {
    bruta: r.annualGrossRevenueBrl,
    custos,
    liquido: r.annualNetRevenueBrl,
    limpeza: r.cleaningTotalBrl * fator,
    gestao: r.managementTotalBrl * fator,
    impostos: r.taxesTotalBrl * fator,
    condominio: r.condoTotalBrl * fator,
    custosPct: r.annualGrossRevenueBrl > 0 ? (custos / r.annualGrossRevenueBrl) * 100 : 0,
  };
}

function Rotulo({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="rotulo-secao">{children}</p>
      {extra}
    </div>
  );
}

/** Campo de mercado (diária/ocupação): rótulo, natureza do número, stepper e a origem do bairro. */
function CampoMercado({ rotulo, tag, ajuda, children }: { rotulo: string; tag: TipoNatureza; ajuda: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{rotulo}</span>
        <NaturezaTag tipo={tag} tamanho="sm" />
      </div>
      {children}
      <span className="text-xs leading-snug text-muted-foreground">{ajuda}</span>
    </div>
  );
}

function LinhaPremissa({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid items-center gap-x-3 gap-y-1.5 min-[400px]:grid-cols-[minmax(0,1fr)_168px]">
      <span className="text-sm text-foreground">{rotulo}</span>
      {children}
    </div>
  );
}

/** Cascata "Da receita ao resultado": cada custo desconta do que sobrou da receita bruta. */
function Cascata({ a, reservas, p }: { a: ReturnType<typeof anualizar>; reservas: number; p: PremissasProjecao }) {
  const total = Math.max(1, a.bruta);
  let restante = a.bruta;
  const passo = (rotulo: string, valor: number) => {
    restante -= valor;
    return { rotulo, valor, esquerda: Math.max(0, restante) / total, largura: Math.max(0, valor) / total, tipo: "custo" as const };
  };
  const linhas = [
    { rotulo: "Receita bruta", valor: a.bruta, esquerda: 0, largura: 1, tipo: "bruta" as const },
    passo(`Limpeza (${formatDecimal(reservas, 0)} reservas)`, a.limpeza),
    passo(`Gestão (${formatPercent(p.gestao, 0)})`, a.gestao),
    passo(`Impostos (${formatPercent(p.impostos, 1)})`, a.impostos),
    passo("Condomínio (12 meses)", a.condominio),
    { rotulo: "Resultado líquido", valor: a.liquido, esquerda: 0, largura: Math.max(0, a.liquido) / total, tipo: "liquido" as const },
  ];
  return (
    <ul className="space-y-1">
      {linhas.map((l) => (
        <li key={l.rotulo} className="grid min-h-[36px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[180px_minmax(0,1fr)_110px] xl:grid-cols-[220px_minmax(0,1fr)_120px]">
          <span className={cn("text-sm", l.tipo === "bruta" && "font-semibold text-foreground", l.tipo === "custo" && "text-foreground-medium", l.tipo === "liquido" && "font-bold text-primary")}>{l.rotulo}</span>
          <span className="relative col-span-2 row-start-2 h-[18px] rounded-sm bg-background md:col-span-1 md:row-start-auto" aria-hidden="true">
            <span
              className={cn("absolute inset-y-0 rounded-sm transition-[left,width] duration-300", l.tipo === "bruta" && "bg-accent", l.tipo === "custo" && "bg-cost", l.tipo === "liquido" && "bg-primary")}
              style={{ left: `${(l.esquerda * 100).toFixed(1)}%`, width: `${(Math.min(1, l.largura) * 100).toFixed(1)}%` }}
            />
          </span>
          <span className={cn("text-right text-sm tabular-nums", l.tipo !== "custo" && "font-semibold", l.tipo === "liquido" && "font-bold", l.tipo === "liquido" && a.liquido < 0 && "text-destructive")}>
            {l.tipo === "custo" ? formatBRL(-l.valor) : formatBRL(l.valor)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Mês a mês: barras empilhadas (líquido embaixo, custos em cima), escala pelo maior bruto mensal. */
function MesAMes({ r, alto }: { r: ProjectionBreakdown; alto: "grande" | "mini" }) {
  const maior = Math.max(1, ...r.months.map((m) => m.grossBrl));
  return (
    <div>
      <div className={cn("grid items-end", alto === "grande" ? "h-[200px] gap-2.5" : "h-24 gap-1")} style={{ gridTemplateColumns: `repeat(${r.months.length}, minmax(0,1fr))` }}>
        {r.months.map((m) => {
          const liquido = Math.max(0, m.netBrl);
          const rotulo = `${mesAno(m)}: ${noites(m.nights)}, ${m.stays} reservas · receita bruta ${formatBRL(m.grossBrl)} · resultado líquido ${formatBRL(m.netBrl)}`;
          return (
            <div key={m.monthKey} role="img" aria-label={rotulo} title={rotulo} className="flex h-full flex-col justify-end">
              <div className="bg-cost transition-[height] duration-300" style={{ height: `${(((m.grossBrl - liquido) / maior) * 100).toFixed(1)}%` }} />
              <div className="bg-primary transition-[height] duration-300" style={{ height: `${((liquido / maior) * 100).toFixed(1)}%` }} />
            </div>
          );
        })}
      </div>
      {alto === "grande" ? (
        <div className="mt-1.5 grid gap-2.5" style={{ gridTemplateColumns: `repeat(${r.months.length}, minmax(0,1fr))` }} aria-hidden="true">
          {r.months.map((m) => <span key={m.monthKey} className="text-center text-xs text-muted-foreground">{m.monthLabel}</span>)}
        </div>
      ) : (
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground" aria-hidden="true">
          <span>{mesAnoCurto(r.months[0])}</span>
          <span className="flex items-center gap-2"><span className="inline-block h-2 w-2 bg-primary" />líquido <span className="inline-block h-2 w-2 bg-cost" />custos</span>
          <span>{mesAnoCurto(r.months[r.months.length - 1])}</span>
        </div>
      )}
    </div>
  );
}

export default function ProjecaoStudio() {
  const { bairros, offline, recarregar } = useBairroData();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [p, setP] = useState<PremissasProjecao>(() => lerPremissasSalvas(armazenamentoLocal()));
  const [premissasAbertas, setPremissasAbertas] = useState(false);
  const [detalheAberto, setDetalheAberto] = useState(false);
  useDeslocamentoChat(desktop ? null : 104);

  // Bairro: ?bairro= (link do mapa/comparação) > rascunho salvo > Pinheiros > primeiro da base.
  const slugUrl = params.get("bairro");
  useEffect(() => {
    if (!slugUrl) return;
    const alvo = bairros.find((b) => slugifyBairro(b.name) === slugifyBairro(slugUrl));
    if (alvo) setP((atual) => (atual.bairro === alvo.name ? atual : { ...atual, bairro: alvo.name, diaria: null, ocupacao: null }));
  }, [slugUrl, bairros]);
  useEffect(() => { salvarPremissas(p, armazenamentoLocal()); }, [p]);

  const bairro: BairroItem | undefined = bairros.find((b) => b.name === p.bairro) ?? bairros.find((b) => b.name === BAIRRO_PADRAO) ?? bairros[0];
  const diariaBairro = bairro ? diariaPorMetragem(bairro, p.area) : 0;
  const ocupacaoBairro = bairro?.avgOccupancy ?? 0;
  const diaria = p.diaria ?? diariaBairro;
  const ocupacao = p.ocupacao ?? ocupacaoBairro;
  const diariaAjustada = p.diaria != null && p.diaria !== diariaBairro;
  const ocupacaoAjustada = p.ocupacao != null && p.ocupacao !== ocupacaoBairro;
  const naturezaMercado: TipoNatureza = bairro ? naturezaBairro(bairro) : "observado";
  const premissasAlteradas = (["estadia", "limpeza", "gestao", "impostos", "condominio"] as const).some((k) => p[k] !== PREMISSAS_PADRAO[k]);

  const r = useMemo(() => projectionBreakdown({
    occupancyPct: ocupacao,
    adr: diaria,
    cleaningPerStay: p.limpeza,
    managementPct: p.gestao,
    taxesPct: p.impostos,
    condoMonthly: p.condominio,
    propertyValue: p.valorImovel,
    avgStayNights: p.estadia,
    months: 12,
    seasonality: DEFAULT_SP_SEASONALITY,
  }), [ocupacao, diaria, p.limpeza, p.gestao, p.impostos, p.condominio, p.valorImovel, p.estadia]);
  const a = anualizar(r);
  const negativo = a.liquido < 0;
  const periodo = `${capitalizar(mesAno(r.months[0]))} a ${mesAno(r.months[r.months.length - 1])}`;
  const semValor = !(p.valorImovel > 0);

  const atualizar = (parcial: Partial<PremissasProjecao>) => setP((atual) => ({ ...atual, ...parcial }));
  const escolherBairro = (nome: string) => {
    atualizar({ bairro: nome, diaria: null, ocupacao: null });
    setParams((atual) => { const n = new URLSearchParams(atual); n.set("bairro", slugifyBairro(nome)); return n; }, { replace: true });
  };
  const voltar = () => (location.key !== "default" ? navigate(-1) : navigate("/"));

  const indicadores = [
    { rotulo: "Rentabilidade bruta anual", valor: semValor ? "—" : formatPercent(r.grossYieldPct, 1), base: semValor ? "Receita bruta de 12 meses ÷ valor do imóvel" : `Receita bruta de 12 meses ÷ valor do imóvel (${formatBRL(p.valorImovel)})` },
    { rotulo: "Rentabilidade líquida anual", valor: semValor ? "—" : formatPercent(r.capRatePct, 1), base: "Resultado líquido de 12 meses ÷ valor do imóvel" },
    { rotulo: "Prazo de retorno do imóvel", valor: semValor || r.paybackYears == null ? "—" : `${formatDecimal(r.paybackYears, 1)} anos`, base: !semValor && r.paybackYears == null ? "Sem prazo: o resultado líquido simulado não é positivo" : "Valor do imóvel ÷ resultado líquido anual, sem reajustes" },
  ];

  /* ─── Formulário ─── */
  const campoBairro = (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground" id="projecao-rotulo-bairro">Bairro</span>
      <Select value={bairro?.name ?? ""} onValueChange={escolherBairro}>
        <SelectTrigger aria-labelledby="projecao-rotulo-bairro" className="h-12 rounded-lg bg-card text-base">
          <SelectValue placeholder="Selecione o bairro" />
        </SelectTrigger>
        <SelectContent>
          {bairros.map((b) => (
            <SelectItem key={b.name} value={b.name} className="min-h-[44px]">{b.name}{naturezaBairro(b) === "estimativa" ? " (estimativa)" : ""}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {bairro && avisoAmostraBairro(bairro) && (
        <span className="rounded-md bg-estimate-light px-3 py-2 text-xs font-normal leading-snug text-estimate-text">
          {bairro.name}: {avisoAmostraBairro(bairro)}. Leia diária e ocupação com cautela.
        </span>
      )}
      {bairro && naturezaMercado === "estimativa" && (
        <span className="flex flex-wrap items-center gap-2 text-xs font-normal leading-snug text-muted-foreground">
          <NaturezaTag tipo="estimativa" tamanho="sm" />
          {ajusteManual(bairro) ? "Diária e ocupação com ajuste manual da Bewild." : "Sem fonte pública atualizada: leia com cautela."}
        </span>
      )}
    </div>
  );
  const campoArea = (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">Faixa de área</span>
      <Segmentado
        rotulo="Faixa de área"
        valor={p.area}
        opcoes={FAIXAS_AREA.map((f) => ({ valor: f, rotulo: f }))}
        onChange={(v: SizeKey) => atualizar({ area: v })}
        itemClassName="min-h-[42px] px-2 lg:min-h-[42px]"
      />
      <span className="text-xs leading-snug text-muted-foreground">A faixa ainda não altera a diária: não há fonte de diária por metragem.</span>
    </div>
  );
  const campoValor = (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      Valor do imóvel
      <span className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-muted-foreground">R$</span>
        <input
          inputMode="numeric"
          autoComplete="off"
          value={p.valorImovel ? formatDecimal(p.valorImovel, 0) : ""}
          onChange={(e) => {
            const digitos = e.target.value.replace(/\D/g, "").slice(0, 9);
            atualizar({ valorImovel: Math.min(CAMPOS.valorImovel.max, Number(digitos) || 0) });
          }}
          placeholder="Informe o valor"
          className="min-h-[48px] w-full rounded-lg border border-input bg-card pl-10 pr-3 text-base font-medium tabular-nums text-foreground placeholder:font-normal placeholder:text-muted-foreground"
        />
      </span>
    </label>
  );
  const blocoMercado = bairro && (
    <div className="grid gap-3.5">
      <Rotulo extra={(diariaAjustada || ocupacaoAjustada) && (
        <button type="button" onClick={() => atualizar({ diaria: null, ocupacao: null })} className="inline-flex min-h-[44px] items-center text-[13px] font-semibold text-primary underline underline-offset-[3px]">Restaurar dados do bairro</button>
      )}>Mercado do bairro</Rotulo>
      <CampoMercado rotulo="Diária média" tag={diariaAjustada ? "ajustado" : naturezaMercado} ajuda={`${bairro.name}: ${formatBRL(diariaBairro)} · média do bairro`}>
        <Stepper rotulo="Diária média" valor={diaria} onChange={(v) => atualizar({ diaria: v })} passo={CAMPOS.diaria.passo} min={CAMPOS.diaria.min} max={CAMPOS.diaria.max} formatar={formatBRL} alto={desktop ? 44 : 48} />
      </CampoMercado>
      <CampoMercado rotulo="Ocupação média" tag={ocupacaoAjustada ? "ajustado" : naturezaMercado} ajuda={`${bairro.name}: ${formatPercent(ocupacaoBairro, 0)} · média anual, com sazonalidade de São Paulo aplicada mês a mês`}>
        <Stepper rotulo="Ocupação média" valor={ocupacao} onChange={(v) => atualizar({ ocupacao: v })} passo={CAMPOS.ocupacao.passo} min={CAMPOS.ocupacao.min} max={CAMPOS.ocupacao.max} formatar={(v) => formatPercent(v, 0)} alto={desktop ? 44 : 48} />
      </CampoMercado>
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        Fonte de diária e ocupação: <FonteBairro nome={bairro.name} semNatureza carimbo />
      </div>
    </div>
  );
  const blocoPremissas = (
    <div className="grid gap-3">
      <Rotulo extra={<NaturezaTag tipo="hipotese" tamanho="sm" />}>Premissas de operação</Rotulo>
      <LinhaPremissa rotulo="Limpeza por reserva">
        <Stepper rotulo="Limpeza por reserva" valor={p.limpeza} onChange={(v) => atualizar({ limpeza: v })} {...CAMPOS.limpeza} formatar={formatBRL} />
      </LinhaPremissa>
      <LinhaPremissa rotulo="Gestão">
        <Stepper rotulo="Gestão" valor={p.gestao} onChange={(v) => atualizar({ gestao: v })} {...CAMPOS.gestao} formatar={(v) => formatPercent(v, 0)} />
      </LinhaPremissa>
      <LinhaPremissa rotulo="Impostos sobre receita">
        <Stepper rotulo="Impostos sobre receita" valor={p.impostos} onChange={(v) => atualizar({ impostos: v })} {...CAMPOS.impostos} casas={1} formatar={(v) => formatPercent(v, 1)} />
      </LinhaPremissa>
      <LinhaPremissa rotulo="Condomínio por mês">
        <Stepper rotulo="Condomínio por mês" valor={p.condominio} onChange={(v) => atualizar({ condominio: v })} {...CAMPOS.condominio} formatar={formatBRL} />
      </LinhaPremissa>
      <LinhaPremissa rotulo="Estadia média">
        <Stepper rotulo="Estadia média" valor={p.estadia} onChange={(v) => atualizar({ estadia: v })} {...CAMPOS.estadia} formatar={noites} />
      </LinhaPremissa>
      <span className="text-xs leading-snug text-muted-foreground">
        Padrões do projeto: limpeza {formatBRL(PREMISSAS_PADRAO.limpeza)}/reserva, gestão {formatPercent(PREMISSAS_PADRAO.gestao, 0)}, impostos {formatPercent(PREMISSAS_PADRAO.impostos, 0)}, condomínio {formatBRL(PREMISSAS_PADRAO.condominio)}/mês, estadia média de {noites(PREMISSAS_PADRAO.estadia)}.
        {premissasAlteradas && (
          <> <button type="button" onClick={() => atualizar({ estadia: PREMISSAS_PADRAO.estadia, limpeza: PREMISSAS_PADRAO.limpeza, gestao: PREMISSAS_PADRAO.gestao, impostos: PREMISSAS_PADRAO.impostos, condominio: PREMISSAS_PADRAO.condominio })} className="inline-flex min-h-[44px] items-center font-semibold text-primary underline underline-offset-[3px]">Restaurar padrões</button></>
        )}
      </span>
    </div>
  );

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-32 pt-4 lg:px-10 lg:pb-16 lg:pt-8">
      <button type="button" onClick={voltar} className="hidden min-h-[44px] items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-flex">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar
      </button>
      <h1 className="mb-1 mt-1 font-display text-[28px] font-bold leading-[1.1] text-foreground lg:mb-2 lg:text-[40px]">Projeção do seu studio</h1>
      <p className="mb-4 max-w-[720px] text-sm text-muted-foreground lg:mb-7 lg:text-base">
        <span className="lg:hidden">Com base na média de mercado do bairro.</span>
        <span className="hidden lg:inline">Estime receita, custos e retorno com base na média de mercado do bairro. Informe bairro, faixa de área e valor do imóvel; ajuste as premissas se quiser.</span>
      </p>

      {offline && (
        <AvisoBase tom="aviso" className="mb-5" onTentar={recarregar}>
          A base do Radar não respondeu. A projeção usa a reserva offline (coleta de {COLETA_GUESTFAVORITES}).
        </AvisoBase>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-10">
        {/* Formulário (fixo ao rolar no desktop) */}
        <form
          onSubmit={(e) => e.preventDefault()}
          onChangeCapture={trackSimulationUsed}
          onPointerDownCapture={trackSimulationUsed}
          onKeyDownCapture={trackSimulationUsed}
          aria-label="Premissas da projeção"
          className="grid gap-5 rounded-lg border border-border bg-card p-4 lg:sticky lg:top-20 lg:rounded-md lg:p-6"
        >
          <p className="rotulo-secao hidden lg:block">Seu imóvel</p>
          {campoBairro}
          {campoArea}
          {campoValor}
          {desktop ? (
            <>
              <div className="border-t border-border pt-4">{blocoMercado}</div>
              <div className="border-t border-border pt-4">{blocoPremissas}</div>
            </>
          ) : (
            <Collapsible open={premissasAbertas} onOpenChange={setPremissasAbertas}>
              <CollapsibleTrigger className="flex min-h-[48px] w-full items-center justify-between gap-3 border-t border-border px-1 text-left text-sm font-semibold text-primary">
                Premissas: diária, ocupação e custos
                {premissasAbertas ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="grid gap-5 pt-3">
                {blocoMercado}
                <div className="border-t border-border pt-4">{blocoPremissas}</div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </form>

        {/* Resultado: recalcula a cada mudança */}
        <section aria-live="polite" aria-label="Resultado da projeção" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2 lg:mb-5">
            <NaturezaTag tipo="hipotese">Simulação · hipótese, não retorno garantido</NaturezaTag>
            <span className="text-sm text-muted-foreground">{periodo} · sazonalidade de São Paulo · {formatDecimal(r.bookedNights, 0)} noites e {formatDecimal(r.reservationsCount, 0)} reservas estimadas</span>
          </div>

          {/* Equação (desktop/tablet): bruta − custos = líquido */}
          <div className="regua-base hidden grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] items-start pb-5 md:grid">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Receita bruta · 12 meses</div>
              <div className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.01em] tabular-nums xl:text-[40px]">{formatBRL(a.bruta)}</div>
              <div className="text-[13px] text-muted-foreground">antes de custos · {formatBRL(a.bruta / 12)}/mês</div>
            </div>
            <div className="pt-[27px] text-center text-[32px] leading-none text-serie-3 xl:pt-[33px]" aria-hidden="true">−</div>
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Custos operacionais</div>
              <div className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.01em] tabular-nums text-foreground-medium xl:text-[40px]">{formatBRL(-a.custos)}</div>
              <div className="text-[13px] text-muted-foreground">{formatPercent(a.custosPct, 0)} da receita bruta</div>
            </div>
            <div className="pt-[27px] text-center text-[32px] leading-none text-serie-3 xl:pt-[33px]" aria-hidden="true">=</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-primary">Resultado líquido · 12 meses</div>
              <div className={cn("mt-1 text-[30px] font-bold leading-tight tracking-[-0.01em] tabular-nums xl:text-[40px]", negativo ? "text-destructive" : "text-primary")}>{formatBRL(a.liquido)}</div>
              <div className="text-[13px] text-muted-foreground">≈ {formatBRL(a.liquido / 12)}/mês · antes de IR e financiamento</div>
            </div>
          </div>

          {/* Celular: lista de três linhas */}
          <dl className="regua md:hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border py-3"><dt className="text-sm">Receita bruta · 12 meses</dt><dd className="text-xl font-semibold tabular-nums">{formatBRL(a.bruta)}</dd></div>
            <div className="flex items-baseline justify-between gap-3 border-b border-border py-3"><dt className="text-sm text-foreground-medium">− Custos operacionais</dt><dd className="text-xl font-semibold tabular-nums text-foreground-medium">{formatBRL(-a.custos)}</dd></div>
            <div className="regua-base flex items-baseline justify-between gap-3 py-3"><dt className="text-sm font-semibold text-primary">= Resultado líquido</dt><dd className={cn("text-2xl font-bold tabular-nums", negativo ? "text-destructive" : "text-primary")}>{formatBRL(a.liquido)}</dd></div>
          </dl>

          <div className="border-b border-border py-6">
            <p className="mb-3.5 text-[15px] font-semibold text-foreground">Da receita ao resultado</p>
            <Cascata a={a} reservas={r.reservationsCount} p={p} />
          </div>

          <div className="border-b border-border py-6">
            <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[15px] font-semibold text-foreground">Mês a mês</p>
              <span className="hidden gap-4 text-[13px] text-foreground-medium md:flex">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-primary" aria-hidden="true" />Resultado líquido</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-cost" aria-hidden="true" />Custos</span>
              </span>
            </div>
            <div className="hidden md:block"><MesAMes r={r} alto="grande" /></div>
            <div className="md:hidden"><MesAMes r={r} alto="mini" /></div>
          </div>

          <div className="border-b border-border py-6">
            <p className="mb-3.5 text-[15px] font-semibold text-foreground">Indicadores de retorno</p>
            {semValor && <p className="mb-3 rounded-md bg-estimate-light px-3 py-2.5 text-sm text-estimate-text">Informe o valor do imóvel para calcular os indicadores.</p>}
            <div className="grid md:grid-cols-3 md:gap-8">
              {indicadores.map((i) => (
                <div key={i.rotulo} className="border-t border-border py-3 first:border-t-0 md:border-t-0 md:py-0">
                  <div className="flex items-baseline justify-between gap-3 md:block">
                    <div className="text-sm text-foreground-medium">{i.rotulo}</div>
                    <div className="text-xl font-semibold tabular-nums md:mb-1.5 md:mt-1 md:text-[34px] md:leading-tight">{i.valor}</div>
                  </div>
                  <div className="mt-0.5 text-xs leading-[1.45] text-muted-foreground md:text-[13px]">{i.base}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Não considera reforma, mobília, IPTU, manutenção, imposto de renda nem financiamento. Período: 12 meses projetados.</p>
          </div>

          {/* Próximo passo */}
          {bairro && (
            <div className="mt-7 grid items-center gap-5 rounded-md bg-primary p-6 text-primary-foreground md:grid-cols-[minmax(0,1fr)_auto] md:gap-6">
              <div className="min-w-0">
                <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-primary-label">Próximo passo</p>
                <p className="mb-1.5 font-display text-2xl font-semibold leading-[1.2]">Preparar a reforma do studio em {bairro.name}</p>
                <p className="text-sm text-primary-soft">A Bewild orça a reforma completa do seu studio, do projeto à entrega.</p>
              </div>
              <OrcamentoButton
                local="projecao"
                rotulo="Solicitar orçamento de reforma"
                icone={false}
                className="min-h-[48px] bg-card px-[22px] text-[15px] font-bold text-primary hover:bg-accent-light"
              />
            </div>
          )}
        </section>
      </div>

      {/* Análises detalhadas da mesma projeção (painel anterior: ocupação, sazonalidade, padrões, break-even…) */}
      <Collapsible open={detalheAberto} onOpenChange={setDetalheAberto} className="mt-12 border-t-2 border-foreground">
        <CollapsibleTrigger className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3 text-left">
          <span>
            <span className="block font-display text-[22px] font-bold text-foreground">Análise detalhada da projeção</span>
            <span className="block text-sm text-muted-foreground">Ocupação e receita por mês, sazonalidade, padrões de reserva, ponto de equilíbrio e retorno, com as mesmas premissas.</span>
          </span>
          <ChevronDown className={cn("h-5 w-5 shrink-0 text-primary transition-transform", detalheAberto && "rotate-180")} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <ProjectAnalytics
            mode="projection"
            controle={{
              costs: { adr: diaria, cleaningPerStay: p.limpeza, managementPct: p.gestao, condoMonthly: p.condominio, taxesPct: p.impostos, propertyValue: p.valorImovel },
              occupancyPct: ocupacao,
              avgStayNights: p.estadia,
            }}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Comparativo "fazer sozinho vs. com a Bewild" — ancora o ROI da reforma */}
      <div className="mt-12 border-t border-border pt-8">
        <BwildVsDiySection controle={bairro ? { bairro: bairro.name, area: p.area, valorImovel: p.valorImovel } : undefined} />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Quer explorar outros bairros antes? <Link to="/mapa" className="font-medium text-primary underline underline-offset-4">Abrir o mapa</Link> ou <Link to="/comparar" className="font-medium text-primary underline underline-offset-4">comparar bairros</Link>.
      </p>

      {/* Celular: barra fixa com o resultado e o orçamento */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border bg-card px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Resultado líquido estimado</div>
          <div className={cn("truncate text-lg font-bold tabular-nums", negativo ? "text-destructive" : "text-primary")}>{formatBRL(a.liquido / 12)}/mês</div>
        </div>
        <OrcamentoButton local="projecao" rotulo="Orçar reforma" icone={false} className="min-h-[48px] px-4 text-sm font-semibold" />
      </div>
    </main>
  );
}
