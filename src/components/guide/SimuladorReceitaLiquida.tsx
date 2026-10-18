import { DEDUCOES_PADRAO_PCT, DRE_GUIA, TEXTO_DRE_PERCENTUAIS, TEXTO_INVESTIMENTO_TOTAL } from "@/data/dreGuia";
import { useState, type ReactNode } from "react";
import { ChevronDown, Lightbulb, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import FonteBairro from "@/components/guide/FonteBairro";
import FonteLink from "@/components/guide/FonteLink";
import NaturezaTag from "@/components/radar/NaturezaTag";
import Segmentado from "@/components/radar/Segmentado";
import Stepper from "@/components/radar/Stepper";
import type { SimuladorReceita } from "@/hooks/useSimuladorReceita";
import { DECORATION_LEVELS } from "@/data/guide-data";
import type { SizeKey } from "@/data/bairrosCurados";
import { FONTES_GUIA } from "@/data/fontesGuia";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { ajusteManual, avisoAmostraBairro, marcaNatureza, naturezaBairro } from "@/lib/radarUi";
import {
  FAIXAS_AREA, LIMITES, LIMITES_MERCADO, RENTABILIDADE_LOCACAO_SP_AA, SHORT_STAY_PADRAO, TRADICIONAL_PADRAO, type Decoracao, type ModoSimulacao, type Resultado,
} from "@/lib/simuladorReceita";
import { cn } from "@/lib/utils";

const MODOS: readonly { valor: ModoSimulacao; rotulo: string }[] = [
  { valor: "short_stay", rotulo: "Short stay (Airbnb)" },
  { valor: "tradicional", rotulo: "Locação tradicional" },
] as const;
/** Em telas estreitas (até 400px) o controle usa rótulos curtos para caber sem cortar. */
const MODOS_CURTOS: readonly { valor: ModoSimulacao; rotulo: string }[] = [
  { valor: "short_stay", rotulo: "Short stay" },
  { valor: "tradicional", rotulo: "Tradicional" },
] as const;
const brl = (v: number) => formatBRL(v);
const pctTexto = (v: number) => formatPercent(v, Number.isInteger(v) ? 0 : 1);

/** Rótulo de grupo de campos (caixa-alta), com a etiqueta de natureza ao lado quando houver. */
function Grupo({ titulo, tag, children, className }: { titulo: string; tag?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("min-w-0 border-0 p-0", className)}>
      <legend className="mb-3 flex w-full items-center justify-between gap-2">
        <span className="rotulo-secao">{titulo}</span>
        {tag}
      </legend>
      <div className="grid gap-3">{children}</div>
    </fieldset>
  );
}

/** Linha de campo: rótulo (e ajuda) à esquerda, controle de 168px à direita; empilha abaixo de 400px. */
function Campo({ rotulo, ajuda, largo = false, children }: { rotulo: string; ajuda?: string; /** Valores de 6+ dígitos (valor do imóvel). */ largo?: boolean; children: ReactNode }) {
  return (
    <div className={cn("grid items-center gap-x-3 gap-y-1.5", largo ? "min-[400px]:grid-cols-[minmax(0,1fr)_196px]" : "min-[400px]:grid-cols-[minmax(0,1fr)_168px]")}>
      <span className="grid">
        <span className="text-sm text-foreground">{rotulo}</span>
        {ajuda && <span className="text-xs leading-snug text-muted-foreground">{ajuda}</span>}
      </span>
      {children}
    </div>
  );
}

/** Cascata "Da receita ao resultado": cada dedução desconta do que sobrou da receita bruta. */
function Cascata({ r }: { r: Resultado }) {
  const total = Math.max(1, r.receitaBruta);
  let restante = r.receitaBruta;
  const linhas = [
    { chave: "bruta", rotulo: "Receita bruta", base: "média por mês", valor: r.receitaBruta, esquerda: 0, largura: 1, tipo: "bruta" as const },
    ...r.deducoes.map((d) => {
      restante -= d.valor;
      return { ...d, esquerda: Math.max(0, restante) / total, largura: Math.min(1, d.valor / total), tipo: "custo" as const };
    }),
    { chave: "liquido", rotulo: "Resultado líquido", base: "por mês", valor: r.liquido, esquerda: 0, largura: Math.max(0, r.liquido) / total, tipo: "liquido" as const },
  ];
  return (
    <ul className="space-y-1" aria-label="Da receita bruta ao resultado líquido">
      {linhas.map((l) => (
        <li key={l.chave} className="grid min-h-[40px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[200px_minmax(0,1fr)_110px]">
          <span className="grid">
            <span className={cn("text-sm", l.tipo === "bruta" && "font-semibold text-foreground", l.tipo === "custo" && "text-foreground-medium", l.tipo === "liquido" && "font-bold text-primary")}>{l.rotulo}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{l.base}</span>
          </span>
          <span className="relative col-span-2 row-start-2 h-[18px] rounded-sm bg-background md:col-span-1 md:row-start-auto" aria-hidden="true">
            <span
              className={cn("absolute inset-y-0 rounded-sm transition-[left,width] duration-300", l.tipo === "bruta" && "bg-accent", l.tipo === "custo" && "bg-cost", l.tipo === "liquido" && "bg-primary")}
              style={{ left: `${(l.esquerda * 100).toFixed(1)}%`, width: `${(l.largura * 100).toFixed(1)}%` }}
            />
          </span>
          <span className={cn("text-right text-sm tabular-nums", l.tipo !== "custo" && "font-semibold", l.tipo === "liquido" && "font-bold", l.tipo === "liquido" && r.liquido < 0 && "text-destructive")}>
            {l.tipo === "custo" ? brl(-l.valor) : brl(l.valor)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Simulador de receita líquida: short stay (Airbnb) e locação tradicional sobre o
 * mesmo imóvel. É o único simulador do Radar: a seção #simulador da home e a página
 * /projecao usam este componente com o mesmo estado (useSimuladorReceita).
 * Diária e ocupação vêm da base do Radar; os custos são hipóteses editáveis, cada
 * uma com a origem escrita. `variante="pagina"` deixa o formulário fixo ao rolar e
 * recebe blocos extras (mês a mês, próximo passo) via `extras`.
 */
export default function SimuladorReceitaLiquida({
  sim,
  variante = "secao",
  extras,
  rodape,
}: {
  sim: SimuladorReceita;
  variante?: "secao" | "pagina";
  /** Blocos abaixo dos indicadores (ex.: mês a mês e próximo passo na /projecao). */
  extras?: ReactNode;
  /** Conteúdo abaixo do resultado (ações da home: compartilhar, salvar, guardar). */
  rodape?: ReactNode;
}) {
  const { p, atualizar, escolherBairro, bairros, bairro: selected, diariaBase, diaria, ocupacao, diariaAjustada, ocupacaoAjustada, reforma, sugestaoReforma, reformaAjustada, aluguel, resultadoShortStay: resultadoSS, resultadoTradicional: resultadoTrad, resultado, indicadores: ind } = sim;
  const [premissasAbertas, setPremissasAbertas] = useState(false);
  const modo = p.modo;
  const shortStay = p.shortStay;
  const tradicional = p.tradicional;
  const imovel = p.imovel;
  const decLevel = DECORATION_LEVELS.find((d) => d.value === p.decoracao) ?? DECORATION_LEVELS[0];
  const shortStayAlterado = JSON.stringify(shortStay) !== JSON.stringify(SHORT_STAY_PADRAO);
  const tradicionalAlterado = JSON.stringify(tradicional) !== JSON.stringify(TRADICIONAL_PADRAO);

  if (!selected || !resultado) return null;
  const faixa = { min: Math.round(selected.dailyMin * decLevel.multiplier), max: Math.round(selected.dailyMax * decLevel.multiplier) };
  const natureza = naturezaBairro(selected);
  const aviso = avisoAmostraBairro(selected);
  const semAluguel = modo === "tradicional" && aluguel <= 0;
  const pagina = variante === "pagina";
  const setModo = (m: ModoSimulacao) => atualizar({ modo: m });
  const setImovel = (parcial: Partial<typeof imovel>) => atualizar({ imovel: { ...imovel, ...parcial } });
  const setShortStay = (parcial: Partial<typeof shortStay>) => atualizar({ shortStay: { ...shortStay, ...parcial } });
  const setTradicional = (parcial: Partial<typeof tradicional>) => atualizar({ tradicional: { ...tradicional, ...parcial } });

  return (
    <div className={cn("rounded-md border border-border bg-card font-body", pagina && "border-0 bg-transparent")}>
      {/* Modo */}
      <div className={cn("border-b border-border px-5 py-4 md:px-6", pagina && "px-0 md:px-0")}>
        <Segmentado<ModoSimulacao> rotulo="Modelo de locação" valor={modo} opcoes={MODOS} onChange={setModo} className="hidden w-full min-[400px]:flex md:w-auto md:max-w-[440px]" />
        <Segmentado<ModoSimulacao> rotulo="Modelo de locação" valor={modo} opcoes={MODOS_CURTOS} onChange={setModo} className="w-full min-[400px]:hidden" />
        <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
          {modo === "short_stay"
            ? "Diária e ocupação do bairro vêm da base do Radar. Os custos abaixo são hipóteses: ajuste para a sua operação."
            : "A base do Radar não tem aluguel por bairro. O aluguel de partida usa a rentabilidade média de locação de São Paulo sobre o valor do imóvel; ajuste para o seu contrato."}
        </p>
      </div>

      <div className={cn("grid gap-8 p-5 md:p-6 lg:gap-10", pagina ? "px-0 md:px-0 lg:grid-cols-[440px_minmax(0,1fr)] lg:items-start" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]")}>
        {/* ─── Formulário ─── */}
        <div className={cn("grid min-w-0 content-start gap-7", pagina && "rounded-lg border border-border bg-card p-4 lg:sticky lg:top-20 lg:rounded-md lg:p-6")}>
          <Grupo titulo="Seu imóvel">
            <div className="grid gap-1.5">
              <label htmlFor="sim-bairro" className="text-sm text-foreground">Bairro</label>
              <Select value={selected.name} onValueChange={escolherBairro}>
                <SelectTrigger id="sim-bairro" className="min-h-[48px] text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bairros.map((b) => (
                    <SelectItem key={b.name} value={b.name} className="min-h-[44px] text-base">{b.name}{marcaNatureza(b) ? ` (${marcaNatureza(b)})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aviso && <span className="rounded-md bg-estimate-light px-3 py-2 text-xs leading-snug text-estimate-text">{selected.name}: {aviso}. Leia diária e ocupação com cautela.</span>}
            </div>
            <div className="grid gap-1.5">
              <span className="text-sm text-foreground">Faixa de área</span>
              <Segmentado<SizeKey> rotulo="Faixa de área" valor={p.area} opcoes={FAIXAS_AREA.map((f) => ({ valor: f, rotulo: f }))} onChange={(v) => atualizar({ area: v })} itemClassName="px-2" />
              <span className="text-xs leading-snug text-muted-foreground">A faixa não altera a diária (não há fonte por metragem); ela entra na sugestão de reforma.</span>
            </div>
            <Campo rotulo="Valor do imóvel" ajuda="Opcional: libera rentabilidade e prazo de retorno." largo>
              <Stepper rotulo="Valor do imóvel" valor={imovel.valorImovel} onChange={(v) => setImovel({ valorImovel: v })} formatar={brl} {...LIMITES.valorImovel} />
            </Campo>
            <Campo rotulo="Investimento em reforma" ajuda={sugestaoReforma ? (reformaAjustada ? `Informado por você. Sugestão para esta faixa e diária: ${brl(sugestaoReforma.valor)}.` : `Sugestão (hipótese): ${sugestaoReforma.areaM2} m² × ${brl(sugestaoReforma.custoM2)}/m², com base no estudo Bewild; sobe com a diária. Soma ao imóvel no prazo de retorno.`) : "Soma ao imóvel no prazo de retorno."} largo>
              <div className="grid min-w-0 gap-0.5">
                <Stepper rotulo="Investimento em reforma" valor={reforma} onChange={(v) => atualizar({ reforma: v })} formatar={brl} {...LIMITES_MERCADO.reforma} />
                {reformaAjustada && sugestaoReforma && <button type="button" onClick={() => atualizar({ reforma: null })} className="inline-flex min-h-[44px] items-center justify-self-end text-xs font-semibold text-primary underline underline-offset-4">Voltar à sugestão ({brl(sugestaoReforma.valor)})</button>}
              </div>
            </Campo>
            <Campo rotulo="Condomínio por mês" ajuda="Exemplo de partida; informe o do seu prédio.">
              <Stepper rotulo="Condomínio por mês" valor={imovel.condominio} onChange={(v) => setImovel({ condominio: v })} formatar={brl} {...LIMITES.condominio} />
            </Campo>
            <Campo rotulo="IPTU por mês" ajuda="Carnê anual dividido por 12.">
              <Stepper rotulo="IPTU por mês" valor={imovel.iptu} onChange={(v) => setImovel({ iptu: v })} formatar={brl} {...LIMITES.iptu} />
            </Campo>
          </Grupo>

          {modo === "short_stay" ? (
            <>
              <Grupo titulo="Mercado do bairro" tag={<NaturezaTag tipo={natureza} tamanho="sm" />}>
                <div className="text-xs"><FonteBairro nome={selected.name} semNatureza carimbo /></div>
                {natureza === "estimativa" && <p className="text-xs leading-snug text-muted-foreground">{ajusteManual(selected) ? "Diária e ocupação com ajuste manual da Bewild." : "Sem fonte pública atualizada: leia com cautela."}</p>}
                {natureza === "aproximacao" && <p className="text-xs leading-snug text-muted-foreground">Sem dado público por bairro: diária e ocupação do Itaim Bibi (GuestFavorites).</p>}
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="sim-decoracao" className="text-sm text-foreground">Nível de decoração</label>
                    <NaturezaTag tipo="hipotese" tamanho="sm" />
                  </div>
                  <Select value={p.decoracao} onValueChange={(v) => atualizar({ decoracao: v as Decoracao, diaria: null })}>
                    <SelectTrigger id="sim-decoracao" className="min-h-[48px] text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DECORATION_LEVELS.map((d) => (
                        <SelectItem key={d.value} value={d.value} className="min-h-[44px] text-base">{d.label} ({formatDecimal(d.multiplier, d.multiplier === 1.45 ? 2 : 1)}× a diária)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {natureza === "estimativa"
                      ? `Sem quartis publicados: estimativa Bewild de ${brl(faixa.min)} a ${brl(faixa.max)} por diária com esse nível.`
                      : `Faixa de diárias com esse nível: ${brl(faixa.min)} a ${brl(faixa.max)} (25% mais baratos a 25% mais caros${natureza === "aproximacao" ? " do Itaim Bibi" : ""}).`}
                  </p>
                </div>
                <Campo rotulo="Diária média" ajuda={diariaAjustada ? `Ajustada por você. Média do bairro com esse nível: ${brl(diariaBase)}.` : `Média do bairro${p.decoracao !== "basico" ? " × decoração" : ""}.`}>
                  <Stepper rotulo="Diária média" valor={diaria} onChange={(v) => atualizar({ diaria: v })} formatar={brl} {...LIMITES_MERCADO.diaria} />
                </Campo>
                <div className="grid gap-2">
                  <label htmlFor="sim-ocupacao" className="flex items-center justify-between text-sm text-foreground">
                    <span>Ocupação estimada</span>
                    <strong className="font-semibold tabular-nums text-primary">{formatPercent(ocupacao, 0)}</strong>
                  </label>
                  <Slider id="sim-ocupacao" value={[ocupacao]} onValueChange={(v) => atualizar({ ocupacao: v[0] })} min={LIMITES_MERCADO.ocupacao.min} max={LIMITES_MERCADO.ocupacao.max} step={1} aria-label="Ocupação estimada" />
                  <p className="text-xs leading-snug text-muted-foreground">Média do bairro: {formatPercent(selected.avgOccupancy, 0)}{ocupacaoAjustada ? " · ajustada por você" : ""}.</p>
                </div>
                {(diariaAjustada || ocupacaoAjustada) && (
                  <button type="button" onClick={() => atualizar({ diaria: null, ocupacao: null })} className="inline-flex min-h-[44px] items-center gap-1.5 justify-self-start text-sm font-semibold text-primary underline underline-offset-[3px]">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Restaurar os dados do bairro
                  </button>
                )}
              </Grupo>

              <Grupo titulo="Custos da operação" tag={<NaturezaTag tipo="hipotese" tamanho="sm" />}>
                <button
                  type="button"
                  onClick={() => setPremissasAbertas((v) => !v)}
                  aria-expanded={premissasAbertas}
                  className="-mt-1 flex min-h-[44px] w-full items-center justify-between gap-2 border-b border-border text-left text-sm text-foreground"
                >
                  <span>
                    Taxa do Airbnb {pctTexto(shortStay.airbnbPct)} · gestão {pctTexto(shortStay.gestaoPct)} · impostos {pctTexto(shortStay.impostosPct)} · manutenção {pctTexto(shortStay.manutencaoPct)} · contas {brl(shortStay.contas)}/mês
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", premissasAbertas && "rotate-180")} aria-hidden="true" />
                </button>
                {premissasAbertas && (
                  <>
                    <Campo rotulo="Taxa do Airbnb" ajuda="Sobre a receita bruta.">
                      <Stepper rotulo="Taxa do Airbnb" valor={shortStay.airbnbPct} onChange={(v) => setShortStay({ airbnbPct: v })} formatar={pctTexto} casas={1} {...LIMITES.impostosPct} />
                    </Campo>
                    <Campo rotulo="Gestão (administradora)" ajuda="0% se você mesmo operar.">
                      <Stepper rotulo="Gestão" valor={shortStay.gestaoPct} onChange={(v) => setShortStay({ gestaoPct: v })} formatar={pctTexto} {...LIMITES.pct} />
                    </Campo>
                    <Campo rotulo="Impostos" ajuda="Depende do seu regime tributário.">
                      <Stepper rotulo="Impostos" valor={shortStay.impostosPct} onChange={(v) => setShortStay({ impostosPct: v })} formatar={pctTexto} casas={1} {...LIMITES.impostosPct} />
                    </Campo>
                    <Campo rotulo="Manutenção e reposição" ajuda="Enxoval, pequenos reparos, reposições.">
                      <Stepper rotulo="Manutenção" valor={shortStay.manutencaoPct} onChange={(v) => setShortStay({ manutencaoPct: v })} formatar={pctTexto} {...LIMITES.pct} />
                    </Campo>
                    <Campo rotulo="Contas por mês" ajuda="Luz, água, gás e internet, pagos pelo anfitrião.">
                      <Stepper rotulo="Contas por mês" valor={shortStay.contas} onChange={(v) => setShortStay({ contas: v })} formatar={brl} {...LIMITES.contas} />
                    </Campo>
                    {shortStayAlterado && (
                      <button type="button" onClick={() => atualizar({ shortStay: SHORT_STAY_PADRAO })} className="inline-flex min-h-[44px] items-center gap-1.5 justify-self-start text-sm font-semibold text-primary underline underline-offset-[3px]">
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Restaurar o padrão do guia
                      </button>
                    )}
                  </>
                )}
                <p className="text-xs leading-snug text-muted-foreground">Padrão do guia (DRE de {formatPercent(DEDUCOES_PADRAO_PCT, 0)}): {TEXTO_DRE_PERCENTUAIS}; os fixos ({formatPercent(DRE_GUIA.fixosPct, 0)}) e as contas ({formatPercent(DRE_GUIA.contasPct, 0)}) do DRE entram aqui em reais, com o condomínio, o IPTU e as contas que você informar. Limpeza costuma ser cobrada do hóspede e fica fora da conta.</p>
              </Grupo>
            </>
          ) : (
            <Grupo titulo="Contrato de locação" tag={<NaturezaTag tipo="hipotese" tamanho="sm" />}>
              <Campo
                rotulo="Aluguel mensal"
                ajuda={p.aluguel !== null
                  ? "Valor informado por você."
                  : imovel.valorImovel > 0 ? `Partida: ${formatPercent(RENTABILIDADE_LOCACAO_SP_AA, 1)} ao ano do valor do imóvel (média de São Paulo).` : "Informe o aluguel, ou o valor do imóvel para uma partida."}
              >
                <Stepper rotulo="Aluguel mensal" valor={aluguel} onChange={(v) => atualizar({ aluguel: v })} formatar={brl} {...LIMITES.aluguel} />
              </Campo>
              {p.aluguel === null && imovel.valorImovel > 0 && <FonteLink fonte={FONTES_GUIA.fipezap} className="-mt-1" />}
              {p.aluguel !== null && imovel.valorImovel > 0 && (
                <button type="button" onClick={() => atualizar({ aluguel: null })} className="-mt-1 inline-flex min-h-[44px] items-center gap-1.5 justify-self-start text-sm font-semibold text-primary underline underline-offset-[3px]">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Voltar à referência de São Paulo
                </button>
              )}
              <Campo rotulo="Meses sem inquilino por ano" ajuda="Troca de inquilino, reforma entre contratos.">
                <Stepper rotulo="Meses sem inquilino" valor={tradicional.vacanciaMeses} onChange={(v) => setTradicional({ vacanciaMeses: v })} formatar={(v) => (v === 1 ? "1 mês" : `${v} meses`)} {...LIMITES.vacanciaMeses} />
              </Campo>
              <Campo rotulo="Taxa de administração" ajuda="0% direto com o inquilino; com imobiliária, a taxa do contrato.">
                <Stepper rotulo="Taxa de administração" valor={tradicional.administracaoPct} onChange={(v) => setTradicional({ administracaoPct: v })} formatar={pctTexto} casas={1} {...LIMITES.administracaoPct} />
              </Campo>
              <Campo rotulo="Imposto de renda" ajuda="Aproximação: % fixo sobre o aluguel recebido. O carnê-leão real é progressivo.">
                <Stepper rotulo="Imposto de renda" valor={tradicional.irPct} onChange={(v) => setTradicional({ irPct: v })} formatar={pctTexto} casas={1} {...LIMITES.irPct} />
              </Campo>
              <Campo rotulo="Reparos entre contratos" ajuda="Pintura e consertos, como % do aluguel.">
                <Stepper rotulo="Reparos entre contratos" valor={tradicional.manutencaoPct} onChange={(v) => setTradicional({ manutencaoPct: v })} formatar={pctTexto} {...LIMITES.pct} />
              </Campo>
              <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 text-sm text-foreground">
                <span className="grid">
                  <span>Condomínio e IPTU pagos pelo inquilino</span>
                  <span className="text-xs leading-snug text-muted-foreground">Nos meses vagos ficam com você de qualquer forma.</span>
                </span>
                <Switch checked={tradicional.encargosPeloInquilino} onCheckedChange={(v) => setTradicional({ encargosPeloInquilino: v })} aria-label="Condomínio e IPTU pagos pelo inquilino" />
              </label>
              {tradicionalAlterado && (
                <button type="button" onClick={() => atualizar({ tradicional: TRADICIONAL_PADRAO })} className="inline-flex min-h-[44px] items-center gap-1.5 justify-self-start text-sm font-semibold text-primary underline underline-offset-[3px]">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Restaurar as hipóteses de partida
                </button>
              )}
            </Grupo>
          )}
        </div>

        {/* ─── Resultado ─── */}
        <div className={cn("min-w-0 border-t border-border pt-6 lg:border-t-0 lg:pt-0", pagina ? "lg:pl-0" : "lg:border-l lg:pl-10")} aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <NaturezaTag tipo="hipotese" className="whitespace-normal">Simulação · hipótese, não retorno garantido</NaturezaTag>
            <span className="text-[13px] text-muted-foreground">
              {modo === "short_stay"
                ? `${selected.name} · diária ${brl(diaria)} · ocupação ${formatPercent(ocupacao, 0)}`
                : `${selected.name} · aluguel ${brl(aluguel)} · ${tradicional.vacanciaMeses === 0 ? "sem vacância" : `${tradicional.vacanciaMeses} ${tradicional.vacanciaMeses === 1 ? "mês vago" : "meses vagos"} por ano`}`}
            </span>
          </div>

          {semAluguel ? (
            <div className="rounded-md border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
              Informe o aluguel mensal, ou o valor do imóvel para começar da referência de São Paulo.
            </div>
          ) : (
            <>
              {/* Equação: três colunas a partir de 640px; em telas estreitas, três linhas */}
              <div className="regua hidden grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_24px_minmax(0,1fr)] items-end gap-x-1 pb-5 pt-4 sm:grid">
                <div><p className="text-xs text-muted-foreground">Receita bruta · mês</p><p className="mt-1 text-[22px] font-semibold leading-none tabular-nums text-foreground md:text-[28px]">{brl(resultado.receitaBruta)}</p></div>
                <span className="pb-1 text-center text-lg text-muted-foreground" aria-hidden="true">−</span>
                <div><p className="text-xs text-muted-foreground">Custos · mês</p><p className="mt-1 text-[22px] font-semibold leading-none tabular-nums text-foreground-medium md:text-[28px]">{brl(resultado.totalDeducoes)}</p><p className="mt-1 text-[11px] text-muted-foreground">{resultado.receitaBruta > 0 ? `${formatPercent(resultado.totalDeducoes / resultado.receitaBruta * 100, 0)} da bruta` : "—"}</p></div>
                <span className="pb-1 text-center text-lg text-muted-foreground" aria-hidden="true">=</span>
                <div>
                  <p className="text-xs text-muted-foreground">Resultado líquido · mês</p>
                  <p className={cn("mt-1 text-[22px] font-bold leading-none tabular-nums md:text-[28px]", resultado.liquido < 0 ? "text-destructive" : "text-primary")}>{brl(resultado.liquido)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{brl(resultado.liquidoAnual)} por ano</p>
                </div>
              </div>
              <dl className="regua grid gap-2 pb-4 pt-3 sm:hidden">
                <div className="flex items-baseline justify-between gap-3"><dt className="text-sm text-foreground">Receita bruta · mês</dt><dd className="shrink-0 whitespace-nowrap text-xl font-semibold tabular-nums text-foreground">{brl(resultado.receitaBruta)}</dd></div>
                <div className="flex items-baseline justify-between gap-3"><dt className="text-sm text-foreground-medium">− Custos ({resultado.receitaBruta > 0 ? formatPercent(resultado.totalDeducoes / resultado.receitaBruta * 100, 0) : "—"})</dt><dd className="shrink-0 whitespace-nowrap text-xl font-semibold tabular-nums text-foreground-medium">{brl(resultado.totalDeducoes)}</dd></div>
                <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-sm font-semibold text-foreground">= Resultado líquido · mês</dt>
                  <dd className="shrink-0 text-right"><span className={cn("block whitespace-nowrap text-2xl font-bold tabular-nums", resultado.liquido < 0 ? "text-destructive" : "text-primary")}>{brl(resultado.liquido)}</span><span className="block whitespace-nowrap text-[11px] text-muted-foreground">{brl(resultado.liquidoAnual)} por ano</span></dd>
                </div>
              </dl>

              <p className="mb-2 mt-5 text-sm font-semibold text-foreground">Da receita ao resultado</p>
              <Cascata r={resultado} />

              {/* Indicadores sobre o investimento */}
              <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Rentabilidade líquida</p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{ind ? `${formatDecimal(ind.rentabilidadeAA, 1)}% a.a.` : "—"}</p>
                  <p className="text-[11px] text-muted-foreground">líquido anual ÷ {reforma > 0 ? "imóvel + reforma" : "valor do imóvel"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prazo de retorno</p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{ind?.paybackAnos != null ? `${formatDecimal(ind.paybackAnos, 1)} anos` : "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{ind && ind.paybackAnos == null ? "sem resultado líquido positivo" : `${reforma > 0 ? "imóvel + reforma" : "valor do imóvel"} ÷ líquido anual`}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sobra da receita bruta</p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{resultado.receitaBruta > 0 ? formatPercent(resultado.margem * 100, 0) : "—"}</p>
                  <p className="text-[11px] text-muted-foreground">líquido ÷ bruta</p>
                </div>
              </div>
              {!ind && <p className="mt-2 text-xs text-muted-foreground">Informe o valor do imóvel para ver rentabilidade e prazo de retorno.</p>}
              {ind && <p className="mt-2 text-xs text-muted-foreground">Investimento total considerado, isto é, {TEXTO_INVESTIMENTO_TOTAL}: {brl(ind.investimento)}{reforma > 0 ? ` = imóvel ${brl(imovel.valorImovel)} + reforma ${brl(reforma)}${reformaAjustada ? "" : " (sugerida)"}` : ""}. Rentabilidade = líquido anual ÷ investimento; prazo de retorno = investimento ÷ líquido anual.</p>}

              {extras}

              {/* Os dois modelos lado a lado */}
              {resultadoSS && resultadoTrad.receitaBruta > 0 && (
                <div className="mt-5 grid gap-1 border-t border-border pt-4 text-sm">
                  <p className="font-semibold text-foreground">O mesmo imóvel nos dois modelos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { nome: "Short stay", r: resultadoSS, ativo: modo === "short_stay", nota: [marcaNatureza(selected), aviso].filter(Boolean).join(" · ") },
                      { nome: "Locação tradicional", r: resultadoTrad, ativo: modo === "tradicional", nota: "" },
                    ].map((c) => (
                      <div key={c.nome} className={cn("rounded-md border px-3 py-2.5", c.ativo ? "border-primary bg-accent-light" : "border-border")}>
                        <p className="text-xs text-muted-foreground">{c.nome}{c.nota ? <span className="text-estimate-text"> · {c.nota}</span> : null}</p>
                        <p className={cn("text-lg font-semibold leading-tight tabular-nums", c.r.liquido < 0 ? "text-destructive" : "text-foreground")}>{brl(c.r.liquido)}</p>
                        <p className="text-[11px] text-muted-foreground">líquido por mês</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-snug text-muted-foreground">Short stay tem mais custo de operação e mais variação mês a mês; a locação tradicional é mais previsível. Compare também o trabalho e o risco de cada modelo, não só o líquido.</p>
                </div>
              )}

              <p className="mt-4 text-xs leading-snug text-muted-foreground">
                Não considera mobília além da reforma informada{pagina ? " nem financiamento" : ", financiamento nem sazonalidade"}. {modo === "short_stay" ? "Diária e ocupação são médias do bairro; o seu anúncio pode ficar acima ou abaixo." : "Reajuste, multa de rescisão e inadimplência ficam fora da conta."}
              </p>
            </>
          )}

          {modo === "short_stay" && (
            <div className="mt-5 flex items-start gap-3 rounded-md border border-estimate-border bg-estimate-light p-4">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-estimate-text" aria-hidden="true" />
              <div className="text-sm">
                <p className="mb-1 font-semibold text-foreground">Para alcançar o topo da faixa, priorize:</p>
                <p className="text-foreground-medium">Marcenaria planejada + iluminação cênica + fotos profissionais. Segundo o Airbnb, anúncios com fotos profissionais tiveram em média 19% mais reservas (2024–2025).</p>
                <FonteLink fonte={FONTES_GUIA.fotografia} />
              </div>
            </div>
          )}
          {rodape}
        </div>
      </div>
    </div>
  );
}
