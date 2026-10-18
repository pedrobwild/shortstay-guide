import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import OrcamentoButton from "@/components/OrcamentoButton";
import ProjectAnalytics from "@/components/ota/ProjectAnalytics";
import BwildVsDiySection from "@/components/ota/BwildVsDiySection";
import AvisoBase from "@/components/radar/AvisoBase";
import SimuladorReceitaLiquida from "@/components/guide/SimuladorReceitaLiquida";
import { useBairroData } from "@/hooks/useBairroData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDeslocamentoChat } from "@/hooks/useDeslocamentoChat";
import { useSimuladorReceita } from "@/hooks/useSimuladorReceita";
import { trackSimulationUsed } from "@/lib/marketingConsent";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";
import { DEFAULT_SP_SEASONALITY } from "@/lib/projectAnalytics";
import { mesAMes, type MesSimulado, type Resultado } from "@/lib/simuladorReceita";
import { formatBRL } from "@/lib/numberFormat";
import { slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";

const mesAno = (m: MesSimulado) => `${m.rotulo}/${m.ano}`;
const mesAnoCurto = (m: MesSimulado) => `${m.rotulo}/${String(m.ano).slice(2)}`;
const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Mês a mês: barras empilhadas (líquido embaixo, custos em cima), escala pelo maior bruto mensal. */
function MesAMes({ meses, alto }: { meses: MesSimulado[]; alto: "grande" | "mini" }) {
  const maior = Math.max(1, ...meses.map((m) => m.bruta));
  return (
    <div>
      <div className={cn("grid items-end", alto === "grande" ? "h-[200px] gap-2.5" : "h-24 gap-1")} style={{ gridTemplateColumns: `repeat(${meses.length}, minmax(0,1fr))` }}>
        {meses.map((m) => {
          const liquido = Math.max(0, m.liquido);
          const rotulo = `${mesAno(m)}: receita bruta ${formatBRL(m.bruta)} · custos ${formatBRL(m.custos)} · resultado líquido ${formatBRL(m.liquido)}`;
          return (
            <div key={m.chave} role="img" aria-label={rotulo} title={rotulo} className="flex h-full flex-col justify-end">
              <div className="bg-cost transition-[height] duration-300" style={{ height: `${(((m.bruta - liquido) / maior) * 100).toFixed(1)}%` }} />
              <div className="bg-primary transition-[height] duration-300" style={{ height: `${((liquido / maior) * 100).toFixed(1)}%` }} />
            </div>
          );
        })}
      </div>
      {alto === "grande" ? (
        <div className="mt-1.5 grid gap-2.5" style={{ gridTemplateColumns: `repeat(${meses.length}, minmax(0,1fr))` }} aria-hidden="true">
          {meses.map((m) => <span key={m.chave} className="text-center text-xs text-muted-foreground">{m.rotulo}</span>)}
        </div>
      ) : (
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground" aria-hidden="true">
          <span>{mesAnoCurto(meses[0])}</span>
          <span className="flex items-center gap-2"><span className="inline-block h-2 w-2 bg-primary" />líquido <span className="inline-block h-2 w-2 bg-cost" />custos</span>
          <span>{mesAnoCurto(meses[meses.length - 1])}</span>
        </div>
      )}
    </div>
  );
}

/** Primeiro dia do mês seguinte ao atual (UTC), início da janela de 12 meses. */
function proximoMes() {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));
}

/**
 * Página /projecao: o mesmo simulador da home (estado compartilhado: rascunho e
 * ?bairro= do mapa), com o formulário fixo ao rolar, o mês a mês com a sazonalidade
 * de São Paulo, o próximo passo (orçamento) e as análises detalhadas da mesma projeção.
 */
export default function ProjecaoStudio() {
  const { offline, recarregar } = useBairroData();
  const sim = useSimuladorReceita();
  const { p, bairro, resultado, diaria, ocupacao } = sim;
  const navigate = useNavigate();
  const location = useLocation();
  const [, setParams] = useSearchParams();
  // A URL acompanha o bairro que a pessoa escolhe (o link do mapa continua válido ao recarregar).
  const simPagina = useMemo(() => ({
    ...sim,
    escolherBairro: (nome: string) => {
      sim.escolherBairro(nome);
      setParams((atual) => { const n = new URLSearchParams(atual); n.set("bairro", slugifyBairro(nome)); return n; }, { replace: true });
    },
  }), [sim, setParams]);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [detalheAberto, setDetalheAberto] = useState(false);
  useDeslocamentoChat(desktop ? null : 104);

  const inicio = useMemo(proximoMes, []);
  const meses = useMemo(() => (resultado && p.modo === "short_stay" ? mesAMes(resultado, DEFAULT_SP_SEASONALITY, inicio) : null), [resultado, p.modo, inicio]);
  const periodo = meses ? `${capitalizar(mesAno(meses[0]))} a ${mesAno(meses[meses.length - 1])}` : "";
  const liquido = resultado?.liquido ?? 0;
  const voltar = () => (location.key !== "default" ? navigate(-1) : navigate("/"));

  const extras = resultado && (
    <>
      {meses && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Mês a mês</p>
            <span className="hidden gap-4 text-[13px] text-foreground-medium md:flex">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-primary" aria-hidden="true" />Resultado líquido</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-cost" aria-hidden="true" />Custos</span>
            </span>
          </div>
          <div className="hidden md:block"><MesAMes meses={meses} alto="grande" /></div>
          <div className="md:hidden"><MesAMes meses={meses} alto="mini" /></div>
          <p className="mt-2 text-xs leading-snug text-muted-foreground">{periodo} · a mesma receita anual distribuída pela sazonalidade de São Paulo (modelo ilustrativo, não dado observado). Custos fixos iguais todo mês; os percentuais acompanham a receita.</p>
        </div>
      )}
      {bairro && (
        <div className="mt-6 grid items-center gap-5 rounded-md bg-primary p-6 text-primary-foreground md:grid-cols-[minmax(0,1fr)_auto] md:gap-6">
          <div className="min-w-0">
            <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-primary-label">Próximo passo</p>
            <p className="mb-1.5 font-display text-2xl font-semibold leading-[1.2]">Preparar a reforma do studio em {bairro.name}</p>
            <p className="text-sm text-primary-soft">A Bewild orça a reforma completa do seu studio, do projeto à entrega.</p>
          </div>
          <OrcamentoButton local="projecao" rotulo="Solicitar orçamento de reforma" icone={false} className="min-h-[48px] bg-card px-[22px] text-[15px] font-bold text-primary hover:bg-accent-light" />
        </div>
      )}
    </>
  );

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-32 pt-4 lg:px-10 lg:pb-16 lg:pt-8">
      <button type="button" onClick={voltar} className="hidden min-h-[44px] items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-flex">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar
      </button>
      <h1 className="mb-1 mt-1 font-display text-[28px] font-bold leading-[1.1] text-foreground lg:mb-2 lg:text-[40px]">Projeção do seu studio</h1>
      <p className="mb-4 max-w-[720px] text-sm text-muted-foreground lg:mb-7 lg:text-base">
        <span className="lg:hidden">Com base na média de mercado do bairro.</span>
        <span className="hidden lg:inline">Estime receita, custos e o que sobra por mês com base na média de mercado do bairro. Informe bairro, valor do imóvel e despesas; ajuste as premissas se quiser.</span>
      </p>

      {offline && (
        <AvisoBase tom="aviso" className="mb-5" onTentar={recarregar}>
          A base do Radar não respondeu. A projeção usa a reserva offline (coleta de {COLETA_GUESTFAVORITES}).
        </AvisoBase>
      )}

      <div onChangeCapture={trackSimulationUsed} onPointerDownCapture={trackSimulationUsed} onKeyDownCapture={trackSimulationUsed}>
        <SimuladorReceitaLiquida sim={simPagina} variante="pagina" extras={extras} />
      </div>

      {/* Análises detalhadas da mesma projeção (calendário de 12 meses com sazonalidade) */}
      {resultado && p.modo === "short_stay" && (
        <Collapsible open={detalheAberto} onOpenChange={setDetalheAberto} className="mt-12 border-t-2 border-foreground">
          <CollapsibleTrigger className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3 text-left">
            <span>
              <span className="block font-display text-[22px] font-bold text-foreground">Análise detalhada da projeção</span>
              <span className="block text-sm text-muted-foreground">Outro modelo, com as mesmas premissas: um calendário simulado de 12 meses (365 dias, estadias de 3 noites, sazonalidade). Os totais ficam perto dos de cima, não iguais.</span>
            </span>
            <ChevronDown className={cn("h-5 w-5 shrink-0 text-primary transition-transform", detalheAberto && "rotate-180")} aria-hidden="true" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <ProjectAnalytics
              mode="projection"
              controle={{
                // Os percentuais sobre a receita (Airbnb, gestão, manutenção) entram como custo variável único; os fixos somam no condomínio.
                costs: {
                  adr: diaria,
                  cleaningPerStay: 0,
                  managementPct: p.shortStay.gestaoPct + p.shortStay.airbnbPct + p.shortStay.manutencaoPct,
                  taxesPct: p.shortStay.impostosPct,
                  condoMonthly: p.imovel.condominio + p.imovel.iptu + p.shortStay.contas,
                  propertyValue: p.imovel.valorImovel,
                },
                occupancyPct: ocupacao,
                avgStayNights: 3,
                rotulos: { gestao: "Gestão, Airbnb e manutenção", condominio: "Condomínio, IPTU e contas" },
              }}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Comparativo "fazer sozinho vs. com a Bewild" */}
      <div className="mt-12 border-t border-border pt-8">
        <BwildVsDiySection controle={bairro ? { bairro: bairro.name, area: p.area, valorImovel: p.imovel.valorImovel } : undefined} />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Quer explorar outros bairros antes? <Link to="/mapa" className="font-medium text-primary underline underline-offset-4">Abrir o mapa</Link> ou <Link to="/comparar" className="font-medium text-primary underline underline-offset-4">comparar bairros</Link>.
      </p>

      {/* Celular: barra fixa com o resultado e o orçamento */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border bg-card px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Resultado líquido estimado</div>
          <div className={cn("truncate text-lg font-bold tabular-nums", liquido < 0 ? "text-destructive" : "text-primary")}>{formatBRL(liquido)}/mês</div>
        </div>
        <OrcamentoButton local="projecao" rotulo="Orçar reforma" icone={false} className="min-h-[48px] px-4 text-sm font-semibold" />
      </div>
    </main>
  );
}
