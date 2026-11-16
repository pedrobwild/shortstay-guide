import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import OrcamentoButton from "@/components/OrcamentoButton";
import PedidoMaterial from "@/components/captacao/PedidoMaterial";
import { Button } from "@/components/ui/button";
import ProjectAnalytics from "@/components/ota/ProjectAnalytics";
import AvisoBase from "@/components/radar/AvisoBase";
import SimuladorReceitaLiquida from "@/components/guide/SimuladorReceitaLiquida";
import CaseStudySection from "@/components/guide/CaseStudySection";
import { CabecalhoTela, Container, Secao } from "@/components/estudo/Estrutura";
import { Figura, TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import ComparacaoDecoracao from "@/components/estudo/ComparacaoDecoracao";
import { DECORATION_LEVELS } from "@/data/guide-data";
import { NotaAmostra, Tag, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, FormulaReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import SeletorBairro from "@/components/estudo/SeletorBairro";
import BarraEmpilhada from "@/components/estudo/graficos/BarraEmpilhada";
import ColunasMensais from "@/components/estudo/graficos/ColunasMensais";
import CampoNumero from "@/components/ferramentas/CampoNumero";
import AcoesSimulacao from "@/components/projecao/AcoesSimulacao";
import { useBairroData } from "@/hooks/useBairroData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMomento } from "@/lib/momento";
import { useDeslocamentoChat } from "@/hooks/useDeslocamentoChat";
import { useSimuladorReceita } from "@/hooks/useSimuladorReceita";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { trackSimulationUsed } from "@/lib/marketingConsent";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";
import { TEXTO_DRE_PERCENTUAIS, TEXTO_INVESTIMENTO_TOTAL } from "@/data/dreGuia";
import { FIPEZAP_DATA, ROTULO_ESTUDO_REFORMA, STUDIO_EXEMPLO_IMOVEL, STUDIO_EXEMPLO_M2 } from "@/data/provasBewild";
import { ACQUISITION_COSTS } from "@/lib/financiamento";
import { DEFAULT_SP_SEASONALITY } from "@/lib/projectAnalytics";
import { indicadores, LIMITES, LIMITES_MERCADO, mesAMes, SHORT_STAY_PADRAO, type MesSimulado } from "@/lib/simuladorReceita";
import { segmentosReceita } from "@/lib/estudoFerramentas";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { artigoBairro, naturezaBairro, textoSemQuartis } from "@/lib/radarUi";
import { slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";

const mesAno = (m: MesSimulado) => `${m.rotulo}/${m.ano}`;
const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const emBairro = (nome: string) => { const a = artigoBairro(nome); return `${a === "o" ? "no" : a === "a" ? "na" : "em"} ${nome}`; };

/** Primeiro dia do mês seguinte ao atual (UTC), início da janela de 12 meses. */
function proximoMes() {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));
}

/** Aplica um número digitado só quando está dentro dos limites do simulador. */
const dentro = (v: number | null, { min, max }: { min: number; max: number }) => v != null && v >= min && v <= max;

/**
 * Página /projecao (Simular) no redesign "Estudo aberto". Topo: premissas editáveis
 * (bairro, diária, ocupação, fixos, imóvel e reforma), o resultado líquido em destaque,
 * a barra empilhada da receita (Fig. 1), o DRE linha a linha (Tab. 1) e o investimento
 * com rentabilidade anual e prazo estimado de retorno. Abaixo seguem, restilizados, o
 * mês a mês, compartilhar e cenários, todas as premissas (decoração, faixa de área,
 * percentuais do DRE e locação tradicional), o próximo passo, o case real e a análise
 * detalhada. Estado único em useSimuladorReceita (URL + rascunho).
 */
export default function ProjecaoStudio() {
  const { offline, recarregar } = useBairroData();
  const sim = useSimuladorReceita();
  const { p, bairro, bairros, diaria, ocupacao, diariaBase, diariaAjustada, ocupacaoAjustada, reforma, sugestaoReforma, reformaAjustada, atualizar, recebidaPorLink, reaberta } = sim;
  const [, setParams] = useSearchParams();
  // A URL acompanha o bairro que a pessoa escolhe (o link do mapa continua válido ao recarregar).
  const simPagina = useMemo(() => ({
    ...sim,
    escolherBairro: (nome: string) => {
      sim.escolherBairro(nome);
      setParams((atual) => { const n = new URLSearchParams(atual); n.set("bairro", slugifyBairro(nome)); return n; }, { replace: true, preventScrollReset: true });
    },
  }), [sim, setParams]);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [comItbi, setComItbi] = useState(false);
  // Origem do valor do imóvel (digitado ou exemplo): só nesta tela, fora de PremissasSimulador, para não mudar o que é guardado no Painel.
  const [valorDeExemplo, setValorDeExemplo] = useState(false);
  // Celular: condomínio, IPTU, contas, reforma e ITBI ficam recolhidos, para o resultado vir logo depois do essencial.
  const [custosAbertos, setCustosAbertos] = useState(false);
  const momento = useMomento();
  // A barra fixa do celular só aparece enquanto o resultado está fora da tela (lido depois da montagem).
  const refResultado = useRef<HTMLDivElement>(null);
  const [resultadoVisivel, setResultadoVisivel] = useState(false);
  const temResultado = Boolean(sim.resultadoShortStay && sim.bairro);
  useEffect(() => {
    const el = refResultado.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => setResultadoVisivel(e.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, [temResultado]);
  useDeslocamentoChat(desktop || resultadoVisivel ? null : 96);

  // O topo é sempre o short stay (o modelo do Radar); a locação tradicional segue nas premissas completas.
  const r = sim.resultadoShortStay;
  const inicio = useMemo(proximoMes, []);
  const meses = useMemo(() => (r ? mesAMes(r, DEFAULT_SP_SEASONALITY, inicio) : null), [r, inicio]);
  const itbi = comItbi && p.imovel.valorImovel > 0 ? Math.round(p.imovel.valorImovel * ACQUISITION_COSTS.itbiRate) : 0;
  const ind = r ? indicadores(r, p.imovel.valorImovel, reforma, itbi) : null;
  const barra = r ? segmentosReceita(r) : null;
  const shortStayAlterado = JSON.stringify(p.shortStay) !== JSON.stringify(SHORT_STAY_PADRAO);

  if (!bairro || !r || !barra) {
    return (
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Container className="py-16"><p className="e-apoio" aria-busy="true">Carregando a base de bairros…</p></Container>
      </main>
    );
  }

  const aprox = naturezaBairro(bairro) === "aproximacao";
  const liquido = r.liquido;
  const refMedia = aprox ? "Média do Itaim Bibi (aproximação)" : "Média do bairro";
  const segmentosFig = [
    // Nas deduções percentuais a base já é "x% da receita bruta" (a legenda mostra o percentual); nos fixos, a origem do valor.
    ...barra.custos.map((c) => ({ chave: c.chave, rotulo: c.rotulo, valor: c.valor, tom: c.tom, nota: c.chave === "fixos" || !c.base.includes("%") ? c.base : undefined, deducao: true })),
    ...(barra.liquido ? [{ chave: "liquido", rotulo: "Resultado líquido", valor: barra.liquido.valor, tom: barra.liquido.tom, destaque: true }] : []),
  ];

  const linksProximoPasso = (
    <p className="mt-8 flex flex-wrap gap-x-6 text-[15px]">
      <Link to="/mapa" className="e-link inline-flex min-h-[44px] items-center">Abrir o mapa</Link>
      <Link to="/comparar" className="e-link inline-flex min-h-[44px] items-center">Comparar bairros</Link>
      {momento !== "tenho" && <Link to="/operar" className="e-link inline-flex min-h-[44px] items-center">Comparar meu studio com o bairro</Link>}
    </p>
  );

  return (
    <main id="conteudo" tabIndex={-1} className="pb-32 outline-none lg:pb-8">
      <CabecalhoTela
        rotulo="Simular · resultado líquido do short stay"
        titulo={<>Simule quanto sobra por mês de um studio {emBairro(bairro.name)}</>}
        lead="Partimos da média do bairro. Ajuste para o seu imóvel: os custos são hipóteses editáveis."
      >
        <p className="flex flex-wrap items-center gap-2">
          <TagBairro b={bairro} />
          <NotaAmostra b={bairro} />
          {aprox && <span className="e-legenda">{TEXTO_APROXIMACAO}</span>}
        </p>
      </CabecalhoTela>

      {offline && (
        <Container className="mb-6">
          <AvisoBase tom="aviso" onTentar={recarregar}>A base do Radar não respondeu. A simulação usa a reserva offline (coleta de {COLETA_GUESTFAVORITES}).</AvisoBase>
        </Container>
      )}
      {recebidaPorLink && (
        <Container className="mb-6">
          <p role="status" className="e-apoio max-w-[720px] border-l-[3px] border-ciano pl-3">{reaberta
            ? "Você reabriu a simulação guardada no Painel; as premissas são as que você salvou. Altere à vontade; nada muda no que está guardado."
            : "Você abriu uma simulação compartilhada: as premissas são de quem enviou o link. Altere à vontade; nada muda para a outra pessoa."}</p>
        </Container>
      )}

      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {/* ─── Premissas ─── */}
          <section aria-labelledby="premissas-titulo" className="min-w-0" onChangeCapture={trackSimulationUsed} onKeyDownCapture={trackSimulationUsed} onPointerDownCapture={trackSimulationUsed}>
            <div className="lg:sticky lg:top-6">
              <h2 id="premissas-titulo" className="e-rotulo border-t border-foreground pt-3">Premissas</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <div className="sm:col-span-2 lg:col-span-1">
                  <SeletorBairro rotulo="Bairro" bairros={bairros} valor={bairro.name} onChange={simPagina.escolherBairro} />
                </div>
                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <CampoNumero
                    rotulo="Valor do imóvel (R$)"
                    prefixo="R$"
                    valor={p.imovel.valorImovel || null}
                    onChange={(v) => {
                      setValorDeExemplo(false);
                      if (v == null) atualizar({ imovel: { ...p.imovel, valorImovel: 0 } });
                      else if (dentro(v, LIMITES.valorImovel)) atualizar({ imovel: { ...p.imovel, valorImovel: v } });
                    }}
                    tag={<Tag tipo="hipotese">{valorDeExemplo ? "Hipótese · exemplo" : undefined}</Tag>}
                    ajuda={valorDeExemplo
                      ? `Exemplo: studio de ${STUDIO_EXEMPLO_M2} m² ao preço médio FipeZap (${FIPEZAP_DATA}). Troque pelo valor do seu imóvel.`
                      : "Com ele, calculamos a rentabilidade anual e o prazo de retorno."}
                  />
                  {!(p.imovel.valorImovel > 0) && (
                    <button
                      type="button"
                      onClick={() => { setValorDeExemplo(true); atualizar({ imovel: { ...p.imovel, valorImovel: STUDIO_EXEMPLO_IMOVEL } }); trackGlobal("cta_clicked", { cta_id: "simulador_valor_exemplo", section: "premissas" }); }}
                      className="e-link inline-flex min-h-[44px] items-center text-[15px]"
                    >
                      Usar um exemplo
                    </button>
                  )}
                </div>
                <CampoNumero
                  rotulo="Diária média (R$)"
                  prefixo="R$"
                  valor={diaria}
                  onChange={(v) => { if (dentro(v, LIMITES_MERCADO.diaria)) atualizar({ diaria: v }); }}
                  tag={diariaAjustada ? <Tag tipo="hipotese">Sua hipótese</Tag> : sim.resultadoMediaBairro ? <Tag tipo="hipotese" titulo="Média do bairro × nível de decoração: hipótese do simulador" /> : <TagBairro b={bairro} />}
                  ajuda={diariaAjustada ? `${refMedia}: ${formatBRL(diariaBase)}.` : p.decoracao !== "basico" ? `${refMedia} × nível de decoração (hipótese).` : `${refMedia}.`}
                />
                <CampoNumero
                  rotulo="Ocupação média (%)"
                  unidade="%"
                  casas={1}
                  valor={ocupacao}
                  onChange={(v) => { if (dentro(v, LIMITES_MERCADO.ocupacao)) atualizar({ ocupacao: v }); }}
                  tag={ocupacaoAjustada ? <Tag tipo="hipotese">Sua hipótese</Tag> : <TagBairro b={bairro} />}
                  ajuda={`${refMedia}: ${formatDecimal(bairro.avgOccupancy, 0)}%.`}
                />
                {(diariaAjustada || ocupacaoAjustada || p.decoracao !== "basico") && (
                  <button type="button" onClick={() => atualizar({ diaria: null, ocupacao: null, decoracao: "basico" })} className="e-link inline-flex min-h-[44px] items-center justify-self-start text-[15px] sm:col-span-2 lg:col-span-1">
                    Voltar aos valores do bairro
                  </button>
                )}
                <details
                  open={desktop || custosAbertos}
                  onToggle={(e) => { if (!desktop) setCustosAbertos(e.currentTarget.open); }}
                  className="group min-w-0 sm:col-span-2 lg:col-span-1"
                >
                  <summary className="e-fina flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 border-y py-3 lg:hidden [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">Ajustar custos</span>
                      <span className="e-legenda block">Custos fixos: {formatBRL(p.imovel.condominio + p.imovel.iptu + p.shortStay.contas)} por mês · Reforma: {formatBRL(reforma)}{reformaAjustada ? "" : " (sugestão)"}</span>
                    </span>
                    <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
                  </summary>
                  <div className="grid gap-5 pt-5 sm:grid-cols-2 lg:grid-cols-1 lg:pt-0">
                    <CampoNumero rotulo="Condomínio (R$/mês)" prefixo="R$" valor={p.imovel.condominio} onChange={(v) => { if (dentro(v, LIMITES.condominio)) atualizar({ imovel: { ...p.imovel, condominio: v! } }); }} tag={<Tag tipo="hipotese" />} ajuda="Exemplo de partida; informe o do seu prédio." />
                    <CampoNumero rotulo="IPTU (R$/mês)" prefixo="R$" valor={p.imovel.iptu} onChange={(v) => { if (dentro(v, LIMITES.iptu)) atualizar({ imovel: { ...p.imovel, iptu: v! } }); }} tag={<Tag tipo="hipotese" />} ajuda="Carnê anual ÷ 12." />
                    <CampoNumero rotulo="Contas (R$/mês)" prefixo="R$" valor={p.shortStay.contas} onChange={(v) => { if (dentro(v, LIMITES.contas)) atualizar({ shortStay: { ...p.shortStay, contas: v! } }); }} tag={<Tag tipo="hipotese" />} ajuda="Luz, água, gás e internet." />
                    <div className="min-w-0">
                      <CampoNumero
                        rotulo="Reforma (R$)"
                        prefixo="R$"
                        valor={reforma}
                        onChange={(v) => { if (v == null) atualizar({ reforma: null }); else if (dentro(v, LIMITES_MERCADO.reforma)) atualizar({ reforma: v }); }}
                        tag={<Tag tipo="hipotese" />}
                        ajuda={sugestaoReforma && !reformaAjustada ? `Sugestão: ${sugestaoReforma.areaM2} m² × ${formatBRL(sugestaoReforma.custoM2)}/m², a partir do ${ROTULO_ESTUDO_REFORMA} da Bewild; sobe com a diária.` : "Valor informado por você."}
                      />
                      {reformaAjustada && sugestaoReforma && (
                        <button type="button" onClick={() => atualizar({ reforma: null })} className="e-link inline-flex min-h-[44px] items-center text-[15px]">Voltar à sugestão ({formatBRL(sugestaoReforma.valor)})</button>
                      )}
                    </div>
                    <label className="flex min-h-[44px] cursor-pointer items-start gap-3 sm:col-span-2 lg:col-span-1">
                      <input type="checkbox" checked={comItbi} onChange={(e) => setComItbi(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--ciano-700))]" />
                      <span className="text-[15px] leading-[22px]">
                        Somar o ITBI ({formatDecimal(ACQUISITION_COSTS.itbiRate * 100, 0)}% do valor do imóvel) ao investimento
                        <span className="e-legenda block">Hipótese, como no estudo; a alíquota varia por município.</span>
                      </span>
                    </label>
                  </div>
                </details>
              </div>
              <p className="e-legenda mt-5">
                {shortStayAlterado ? "Percentuais ajustados por você em “Todas as premissas”." : <>Custos da operação (hipóteses do guia): {TEXTO_DRE_PERCENTUAIS}. Ajuste em “Todas as premissas”, abaixo.</>}
              </p>
            </div>
          </section>

          {/* ─── Resultado ─── */}
          <div className="min-w-0" aria-live="polite">
            <div id="resultado" ref={refResultado} className="scroll-mt-6 border-t border-foreground pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="e-rotulo">Resultado líquido por mês (R$)</h2>
                <Tag tipo="hipotese">Simulação · hipótese</Tag>
              </div>
              <p className={cn("e-numero mt-2", liquido < 0 && "e-negativo")}>{formatBRL(liquido)}</p>
              <p className="e-apoio mt-1">
                {formatBRL(r.liquidoAnual)} por ano · {r.receitaBruta > 0 ? `${formatPercent(r.margem * 100, 0)} da receita bruta de ${formatBRL(r.receitaBruta)}` : "sem receita"}.
                {liquido < 0 && <span className="e-negativo"> Os custos passam da receita: o studio fica no negativo com essas premissas.</span>}
              </p>
              {sim.resultadoMediaBairro && (
                <ComparacaoDecoracao
                  className="mt-5"
                  nivel={(DECORATION_LEVELS.find((d) => d.value === sim.p.decoracao)?.label ?? "").toLowerCase()}
                  bairro={bairro.name}
                  diariaNivel={sim.diaria}
                  diariaBairro={bairro.dailyAvg}
                  liquidoNivel={r.liquido}
                  liquidoBairro={sim.resultadoMediaBairro.liquido}
                />
              )}
            </div>

            <Figura
              numero={1}
              className="mt-10"
              titulo={liquido >= 0 ? <>De cada {formatBRL(r.receitaBruta)} de receita, sobram {formatBRL(liquido)}</> : <>Os custos ({formatBRL(r.totalDeducoes)}) passam da receita ({formatBRL(r.receitaBruta)})</>}
              unidade="Receita bruta do mês repartida entre custos e resultado líquido (R$/mês). Percentuais sobre a receita bruta."
              legenda={liquido < 0 ? <span className="e-negativo">O trecho com contorno magenta, depois da linha tracejada, são custos acima da receita.</span> : undefined}
            >
              <BarraEmpilhada
                segmentos={segmentosFig}
                total={r.receitaBruta}
                formatar={formatBRL}
                rotuloPct="da receita"
                rotuloAcessivel={`Receita bruta de ${formatBRL(r.receitaBruta)} por mês: ${segmentosFig.map((s) => `${s.rotulo} ${formatBRL(s.valor)}`).join("; ")}.`}
                marcaReferencia={liquido < 0 ? { valor: r.receitaBruta, rotulo: "receita bruta" } : undefined}
              />
            </Figura>

            <TabelaNumerada
              numero={1}
              rolavel
              className="mt-12"
              titulo="Da receita bruta ao resultado líquido"
              unidade="R$ por mês. Cada linha mostra como o valor foi obtido."
            >
              <thead>
                <tr>
                  <th scope="col" className={TH}>Linha</th>
                  <th scope="col" className={cn(TH, "hidden sm:table-cell")}>Base</th>
                  <th scope="col" className={cn(TH, "text-right")}>R$/mês</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className={cn(TD, "font-semibold")}>Receita bruta<span className="e-legenda block font-normal sm:hidden">{formatBRL(diaria)} × 30 × {formatDecimal(ocupacao, 0)}%</span></th>
                  <td className={cn(TD, "hidden text-tinta-78 sm:table-cell")}>{formatBRL(diaria)} × 30 × {formatDecimal(ocupacao, 0)}%</td>
                  <td className={cn(TD_NUM, "font-semibold")}>{formatBRL(r.receitaBruta)}</td>
                </tr>
                {r.deducoes.map((d) => (
                  <tr key={d.chave}>
                    <th scope="row" className={cn(TD, "font-normal")}>{d.rotulo}<span className="e-legenda block sm:hidden">{d.base}</span></th>
                    <td className={cn(TD, "hidden text-tinta-78 sm:table-cell")}>{d.base}</td>
                    <td className={TD_NUM}>−{formatBRL(d.valor)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className={cn(TD, "font-normal text-tinta-78")}>Total de custos</th>
                  <td className={cn(TD, "hidden text-tinta-78 sm:table-cell")}>{r.receitaBruta > 0 ? `${formatPercent((r.totalDeducoes / r.receitaBruta) * 100, 0)} da receita bruta` : "—"}</td>
                  <td className={cn(TD_NUM, "text-tinta-78")}>−{formatBRL(r.totalDeducoes)}</td>
                </tr>
                <tr>
                  <th scope="row" className="border-t border-foreground py-3 pr-2 text-left font-semibold">Resultado líquido</th>
                  <td className="hidden border-t border-foreground px-2 py-3 text-tinta-78 sm:table-cell">receita bruta − custos</td>
                  <td className={cn("border-t border-foreground py-3 pl-2 text-right font-semibold tabular-nums", liquido < 0 && "e-negativo")}>{formatBRL(liquido)}</td>
                </tr>
              </tbody>
            </TabelaNumerada>

            <div className="mt-12 border-t border-foreground pt-4">
              <h2 className="e-rotulo mb-4">Sobre o investimento</h2>
              <GradeIndicadores className="lg:grid-cols-3">
                <Indicador
                  pequeno
                  rotulo="Investimento total (R$)"
                  valor={ind ? formatBRL(ind.investimento) : "—"}
                  nota={ind ? <>imóvel {formatBRL(p.imovel.valorImovel)} + reforma {formatBRL(reforma)}{reformaAjustada ? "" : " (sugerida)"}{itbi > 0 ? <> + ITBI {formatBRL(itbi)}</> : ""}</> : "Informe o valor do imóvel para ver o investimento."}
                />
                <Indicador pequeno rotulo="Rentabilidade anual (% ao ano)" valor={ind ? <span className={cn(ind.rentabilidadeAA < 0 && "e-negativo")}>{formatDecimal(ind.rentabilidadeAA, 1)}%</span> : "—"} nota={ind ? "resultado líquido anual ÷ investimento total" : "Informe o valor do imóvel para ver a rentabilidade."} />
                <Indicador pequeno rotulo="Prazo estimado de retorno (anos)" valor={ind?.paybackAnos != null ? formatDecimal(ind.paybackAnos, 1) : "—"} nota={!ind ? "Informe o valor do imóvel para ver o prazo." : ind.paybackAnos == null ? "sem resultado líquido positivo" : "investimento total ÷ resultado líquido anual"} />
              </GradeIndicadores>
              <p className="e-legenda mt-4 max-w-[720px]">
                Investimento total = {TEXTO_INVESTIMENTO_TOTAL}. Na explicação técnica, a rentabilidade anual é o <i>yield</i> líquido e o prazo estimado de retorno, o <i>payback</i> simples, sem juros nem valorização. Não considera financiamento.
              </p>
            </div>

            <div className="mt-10 max-w-[720px] space-y-3">
              <div className="overflow-x-auto"><FormulaReceita diaria={diaria} ocupacaoPct={ocupacao} receita={r.receitaBruta} /></div>
              <AvisoReceita />
              {!bairro.dailyQuartiles && <p className="e-legenda">{textoSemQuartis(bairro)}</p>}
            </div>
          </div>
        </div>
      </Container>

      {meses && (
        <Secao
          id="mes-a-mes"
          rotulo="Mês a mês"
          titulo="A mesma receita anual, distribuída pela sazonalidade de São Paulo"
          lead={<>{capitalizar(mesAno(meses[0]))} a {mesAno(meses[meses.length - 1])}. A curva mensal é um modelo ilustrativo, não dado observado: custos fixos iguais todo mês, percentuais acompanhando a receita.</>}
        >
          <Figura numero={2} titulo="Receita bruta por mês, separada em custos e resultado líquido" unidade="R$ por mês (mil). Hipótese de sazonalidade.">
            <ColunasMensais meses={meses} />
            <p className="e-legenda mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 bg-ciano" />resultado líquido</span>
              <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 bg-neutro-300 outline outline-1 outline-foreground/55" />custos</span>
            </p>
          </Figura>
        </Secao>
      )}

      <Secao id="compartilhar" rotulo="Guardar e compartilhar" titulo="Leve esta conta adiante">
        <AcoesSimulacao sim={simPagina} resultado={r} indicadores={ind} />
      </Secao>

      <Secao
        id="premissas-completas"
        rotulo="Todas as premissas"
        titulo="Ajuste a decoração, a faixa de área, os percentuais de custo ou compare com a locação tradicional"
        lead="O mesmo simulador, com todas as hipóteses editáveis. O que mudar aqui atualiza a conta de cima (que mostra sempre o short stay)."
      >
        <details className="group e-fina border-y">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            Abrir todas as premissas
            <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
          </summary>
          <div className="pb-8 pt-2">
            <SimuladorReceitaLiquida sim={simPagina} variante="secao" />
          </div>
        </details>
      </Secao>

      {/* Próximo passo conforme a etapa (momento.ts, lido depois da montagem); sem etapa, vale "Vou comprar". */}
      {momento === "reformar" ? (
        <Secao id="proximo-passo" rotulo="Próximo passo" titulo="Quer este studio pronto para alugar?" lead="A Bewild avalia o escopo e prepara o orçamento da reforma completa: projeto, obra, marcenaria sob medida, mobiliário, eletrodomésticos e enxoval.">
          <OrcamentoButton local="projecao" contexto={{ bairro: bairro.name, area: p.area }} className="h-auto min-h-[44px] px-5 py-2 text-[15px] font-semibold" />
          {linksProximoPasso}
        </Secao>
      ) : momento === "tenho" ? (
        <Secao id="proximo-passo" rotulo="Próximo passo" titulo="Veja onde o seu studio está em relação ao bairro" lead={<>Compare a sua diária e a sua ocupação com a média {aprox ? "do Itaim Bibi (aproximação)" : `de ${bairro.name}`}.</>}>
          <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold">
            <Link to="/operar" onClick={() => trackGlobal("cta_clicked", { cta_id: "proximo_passo_operar", section: "projecao", bairro: bairro.name })}>Comparar meu studio</Link>
          </Button>
          {linksProximoPasso}
        </Secao>
      ) : (
        <Secao id="proximo-passo" rotulo="Próximo passo">
          <PedidoMaterial material="checklist_compra" origem="projecao" bairro={bairro.name} />
          <p className="mt-8 flex flex-wrap items-center gap-x-3 text-[15px]">
            <span className="text-tinta-78">Já tem o imóvel e quer planejar a reforma?</span>
            <OrcamentoButton local="projecao" variant="link" contexto={{ bairro: bairro.name, area: p.area }} className="min-h-[44px] px-0 text-[15px]" />
          </p>
          {linksProximoPasso}
        </Secao>
      )}

      <Secao id="case" rotulo="Case real" titulo="Um studio reformado pela Bewild, com os números publicados no depoimento">
        <CaseStudySection />
      </Secao>

      {p.modo === "short_stay" && (
        <Secao id="analise-detalhada" rotulo="Análise detalhada" titulo="Um calendário simulado de 12 meses com as mesmas premissas" lead="Outro modelo: 365 dias, estadias de 3 noites e sazonalidade. Os totais ficam perto dos de cima, não iguais.">
          <Collapsible open={detalheAberto} onOpenChange={setDetalheAberto} className="e-fina border-y">
            <CollapsibleTrigger className="flex min-h-[44px] w-full items-center justify-between gap-3 py-3 text-left text-[17px] font-semibold">
              {detalheAberto ? "Fechar a análise detalhada" : "Abrir a análise detalhada"}
              <span aria-hidden="true" className={cn("text-tinta-70 transition-transform motion-reduce:transition-none", detalheAberto && "rotate-45")}>+</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-8 pt-4">
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
        </Secao>
      )}

      {/* Celular: barra fixa com o resultado e o atalho para a conta; some quando o resultado está na tela. O orçamento vem só depois, no "Próximo passo". */}
      {!resultadoVisivel && (
        <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-foreground bg-background px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
          <div className="min-w-0">
            <div className="e-rotulo">Resultado líquido</div>
            <div className={cn("truncate text-lg font-semibold tabular-nums", liquido < 0 && "e-negativo")}>{formatBRL(liquido)}/mês</div>
          </div>
          <a href="#resultado" onClick={() => trackGlobal("cta_clicked", { cta_id: "ver_a_conta", section: "barra-celular" })} className="e-link inline-flex min-h-[44px] items-center px-2 text-[15px] font-semibold">
            Ver a conta
          </a>
        </div>
      )}
    </main>
  );
}
