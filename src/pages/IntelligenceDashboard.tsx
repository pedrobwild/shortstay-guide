import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CabecalhoTela, Container, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import { Figura, TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import MetadadosBase from "@/components/estudo/MetadadosBase";
import { NotaAmostra, Tag, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, FormulaReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import HistogramaPontos from "@/components/estudo/graficos/HistogramaPontos";
import { LegendaPontos } from "@/components/estudo/graficos/LegendaPontos";
import AvisoBase from "@/components/radar/AvisoBase";
import FonteBairro from "@/components/guide/FonteBairro";
import LinkArtigoBewild from "@/components/guide/LinkArtigoBewild";
import { Button } from "@/components/ui/button";
import { ARTIGOS_BEWILD } from "@/data/artigosBewild";
import { FONTE_BAIRROS_CURADOS, ROTULO_ESTIMATIVA_MERCADO } from "@/data/bairrosCurados";
import { FONTES_GUIA } from "@/data/fontesGuia";
import NovaAba from "@/components/NovaAba";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { useBairroSelecionado } from "@/hooks/useBairroSelecionado";
import { useBairrosData, rotuloEstimativa } from "@/hooks/useIntelligenceData";
import { definirBairroAtual } from "@/lib/bairroAtual";
import { classeModal, classesHistograma, contagemContra, extremos, nomesComNatureza, periodoPrincipal, receitaDe } from "@/lib/estudo";
import { faixaConcentracao } from "@/lib/estudoMercado";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { naturezaBairro } from "@/lib/radarUi";
import { bairroPath } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { QuizAnswers, InvestorProfile } from "@/lib/investorQuiz";

// Cada etapa da jornada guiada é carregada só quando a pessoa chega nela.
const Step1Context = lazy(() => import("@/components/intelligence/jornada/Step1").then((m) => ({ default: m.Step1Context })));
const Step2Highlights = lazy(() => import("@/components/intelligence/jornada/Step2").then((m) => ({ default: m.Step2Highlights })));
const Step3Learn = lazy(() => import("@/components/intelligence/jornada/Step3").then((m) => ({ default: m.Step3Learn })));
const Step4Learnings = lazy(() => import("@/components/intelligence/jornada/Step4").then((m) => ({ default: m.Step4Learnings })));
const Step5Compare = lazy(() => import("@/components/intelligence/jornada/Step5").then((m) => ({ default: m.Step5Compare })));
const Step6Profile = lazy(() => import("@/components/intelligence/jornada/Step6").then((m) => ({ default: m.Step6Profile })));
const Step7Explore = lazy(() => import("@/components/intelligence/jornada/Step7").then((m) => ({ default: m.Step7Explore })));
const Step8Recommendation = lazy(() => import("@/components/intelligence/jornada/Step8").then((m) => ({ default: m.Step8Recommendation })));

/**
 * /mercado no redesign "Estudo aberto": o mercado dos 28 bairros da base do Radar.
 * Indicadores de São Paulo, Fig. 1 (histograma de pontos da receita de referência em
 * classes de R$ 500, com a linha de SP), destaques calculados e o método. A jornada
 * guiada antiga (8 etapas, quiz e recomendação, sobre a estimativa de mercado — base
 * 2025) segue no fim, atrás de "Começar a jornada". Pré-renderizada como HTML estático
 * (PreRenderMercado) e substituída ao abrir.
 */
export default function IntelligenceDashboard() {
  return (
    <BairroProvider>
      <PaginaEstudo>
        <Mercado />
      </PaginaEstudo>
    </BairroProvider>
  );
}

function Mercado() {
  const { bairros, cidade, offline, recarregar } = useBaseEstudo();
  const { bairro: selecionado } = useBairroSelecionado(bairros, { naUrl: false });

  const receitaSP = receitaDe(cidade);
  const classes = classesHistograma(bairros);
  const modal = classeModal(classes);
  const faixa = faixaConcentracao(classes);
  const contra = contagemContra(bairros, receitaDe, receitaSP);
  const receita = extremos(bairros, receitaDe);
  const ocupacao = extremos(bairros, (b) => b.avgOccupancy);
  const diaria = extremos(bairros, (b) => b.dailyAvg);
  const periodo = periodoPrincipal(bairros) ?? cidade.period;
  const maior = receita ? bairros.find((b) => b.name === receita.nomesMax[0]) : undefined;

  if (!bairros.length) {
    return (
      <Container className="py-16">
        <h1 className="e-h1">Não há dados de mercado para mostrar agora</h1>
        <AvisoBase className="mt-6" onTentar={recarregar}>A base do Radar não respondeu ou está vazia. Tente de novo em instantes.</AvisoBase>
      </Container>
    );
  }

  return (
    <>
      <CabecalhoTela
        rotulo={`Mercado · ${bairros.length} bairros de São Paulo`}
        titulo={
          faixa
            ? <>A maioria dos bairros ({faixa.quantidade} de {faixa.total}) fica entre {formatBRL(faixa.inicio)} e {formatBRL(faixa.fim)} por mês</>
            : <>Receita de referência dos bairros de São Paulo</>
        }
        lead={<>Receita de referência é a diária média × 30 × a ocupação média, antes de custos. São Paulo fica em {formatBRL(receitaSP)} por mês; cada bairro é comparado a esse número, com a mesma fonte e o mesmo período.</>}
      >
        <MetadadosBase bairros={bairros} cidade={cidade} compacto />
      </CabecalhoTela>

      {offline && (
        <Container className="mb-6">
          <AvisoBase tom="aviso" onTentar={recarregar}>A base do Radar não respondeu agora. Os números são da reserva aprovada (mesma coleta).</AvisoBase>
        </Container>
      )}

      <Secao id="sao-paulo" rotulo="São Paulo · referência" titulo={<>A referência da cidade: {formatBRL(cidade.dailyAvg)} de diária e {formatDecimal(cidade.avgOccupancy, 0)}% de ocupação</>}>
        <GradeIndicadores className="max-[399px]:grid-cols-1">
          <Indicador rotulo="Diária média (R$)" valor={formatBRL(cidade.dailyAvg)} nota={`São Paulo, ${cidade.period}`} />
          <Indicador rotulo="Ocupação média (%)" valor={`${formatDecimal(cidade.avgOccupancy, 0)}%`} nota="Noites ocupadas no período" />
          <Indicador rotulo="Anúncios (n)" valor={formatDecimal(cidade.activeListings, 0)} nota="Anúncios ativos na cidade" />
          <Indicador rotulo="Receita de referência (R$/mês)" valor={formatBRL(receitaSP)} nota={<>{formatBRL(cidade.dailyAvg)} × 30 × {formatDecimal(cidade.avgOccupancy / 100, 2)}, antes de custos</>} />
        </GradeIndicadores>
      </Secao>

      <Secao id="distribuicao" rotulo="Distribuição">
        <Figura
          numero={1}
          titulo={modal ? <>A classe de {formatBRL(modal.inicio)} a {formatBRL(modal.fim)} reúne {modal.itens.length} dos {bairros.length} bairros</> : "Receita de referência por bairro"}
          unidade={<>Receita de referência por mês, em classes de R$ 500. Cada ponto é um bairro; dentro da classe, o maior valor fica no topo. Toque num ponto para abrir o bairro.</>}
          legenda={
            <>
              <LegendaPontos
                bairros={bairros}
                selecionado={selecionado?.name}
                referencia={<>São Paulo: {formatBRL(receitaSP)} por mês ({formatBRL(cidade.dailyAvg)} × 30 × {formatDecimal(cidade.avgOccupancy, 0)}%)</>}
              />
              <p className="mt-3">{TEXTO_APROXIMACAO}</p>
            </>
          }
          fonte={<><a href={FONTES_GUIA.guestfavoritesSP.url} target="_blank" rel="noopener noreferrer" className="e-link">GuestFavorites<NovaAba /></a>, {periodo}. Cálculo do Radar Bewild.</>}
        >
          <HistogramaPontos
            bairros={bairros}
            referencia={{ valor: receitaSP, rotulo: `São Paulo ${formatBRL(receitaSP)}` }}
            selecionado={selecionado?.name}
            hrefDe={(b) => bairroPath(b.name)}
            aoAbrir={(b) => definirBairroAtual(b.name)}
          />
        </Figura>

        <details className="group e-fina mt-8 border-y">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            Ver os valores em tabela
            <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
          </summary>
          <div className="pb-6">
            <TabelaNumerada numero={1} titulo="Receita de referência dos bairros, por classe" unidade="R$/mês, do maior para o menor valor. Os mesmos números da Fig. 1.">
              <thead>
                <tr>
                  <th scope="col" className={TH}>Classe (R$/mês)</th>
                  <th scope="col" className={TH}>Bairro</th>
                  <th scope="col" className={cn(TH, "text-right")}>R$/mês</th>
                  <th scope="col" className={cn(TH, "hidden sm:table-cell")}>Natureza</th>
                </tr>
              </thead>
              <tbody>
                {[...classes].reverse().flatMap((c) =>
                  [...c.itens].reverse().map(({ bairro: b, receita: r }, i) => (
                    <tr key={b.name}>
                      <td className={cn(TD, "whitespace-nowrap tabular-nums text-tinta-70")}>{i === 0 ? `${formatDecimal(c.inicio, 0)}–${formatDecimal(c.fim, 0)}` : ""}</td>
                      <td className={TD}>
                        <Link to={bairroPath(b.name)} onClick={() => definirBairroAtual(b.name)} className={cn("e-link", b.name === selecionado?.name && "font-semibold text-magenta-700")}>{b.name}</Link>
                        <span className="mt-0.5 flex flex-wrap gap-2 sm:hidden">
                          {naturezaBairro(b) !== "observado" && <TagBairro b={b} />}
                          <NotaAmostra b={b} curta />
                        </span>
                      </td>
                      <td className={cn(TD_NUM, "font-semibold")}>{formatBRL(r)}</td>
                      <td className={cn(TD, "hidden sm:table-cell")}>
                        <span className="flex flex-wrap items-center gap-2"><TagBairro b={b} /><NotaAmostra b={b} curta /></span>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </TabelaNumerada>
          </div>
        </details>
      </Secao>

      <Secao id="destaques" rotulo="Destaques" titulo={<>{contra.abaixo} de {contra.total} bairros ficam abaixo da receita de referência de São Paulo</>}>
        <dl className="grid gap-10 md:grid-cols-3 md:gap-8">
          <Indicador
            rotulo="Abaixo de São Paulo (bairros)"
            valor={<>{contra.abaixo} de {contra.total}</>}
            nota={<>Receita de referência menor que {formatBRL(receitaSP)} por mês. {contra.acima} ficam acima{contra.iguais ? ` e ${contra.iguais} no mesmo valor` : ""}.</>}
          />
          {receita && maior && (
            <Indicador
              rotulo="Maior receita de referência (R$/mês)"
              valor={formatBRL(receita.max)}
              nota={<>{nomesComNatureza(receita.nomesMax, bairros).join(", ")}: {formatBRL(maior.dailyAvg)} × 30 × {formatDecimal(maior.avgOccupancy, 0)}%. A menor é {nomesComNatureza(receita.nomesMin, bairros).join(", ")}, com {formatBRL(receita.min)}.</>}
            />
          )}
          {ocupacao && (
            <Indicador
              rotulo="Ocupação média, maior e menor (%)"
              valor={<>{formatDecimal(ocupacao.max, 0)}% e {formatDecimal(ocupacao.min, 0)}%</>}
              nota={<>
                Da maior ({nomesComNatureza(ocupacao.nomesMax, bairros).join(", ")}) à menor ({nomesComNatureza(ocupacao.nomesMin, bairros).join(", ")}).
                {diaria && <> A diária varia mais: de {formatBRL(diaria.min)} ({nomesComNatureza(diaria.nomesMin, bairros).join(", ")}) a {formatBRL(diaria.max)} ({nomesComNatureza(diaria.nomesMax, bairros).join(", ")}).</>}
              </>}
            />
          )}
        </dl>
        <p className="mt-8 flex flex-wrap gap-x-6 text-[15px]">
          <Link to="/ranking" className="e-link inline-flex min-h-[44px] items-center">Ver o ranking dos {bairros.length} bairros</Link>
          <Link to="/mapa" className="e-link inline-flex min-h-[44px] items-center">Ver no mapa</Link>
          <Link to="/comparar" className="e-link inline-flex min-h-[44px] items-center">Comparar até três bairros</Link>
        </p>
      </Secao>

      <Secao id="metodo" rotulo="Método" titulo="A conta é a mesma para todos os bairros e para São Paulo">
        <div className="max-w-[720px]">
          <div className="overflow-x-auto"><FormulaReceita diaria={cidade.dailyAvg} ocupacaoPct={cidade.avgOccupancy} receita={receitaSP} /></div>
          <AvisoReceita className="mt-4" />
          <p className="mt-4 flex flex-wrap gap-x-6 text-[15px]">
            <Link to="/metodologia" className="e-link inline-flex min-h-[44px] items-center">Metodologia</Link>
            <a href="/dados/bairros.csv" download className="e-link inline-flex min-h-[44px] items-center">Baixar a base (CSV)</a>
            <Link to="/projecao" className="e-link inline-flex min-h-[44px] items-center">Simular custos e resultado</Link>
          </p>
          <LinkArtigoBewild artigo={ARTIGOS_BEWILD.melhoresBairros} prefixo="Quer a análise bairro a bairro? Leia" className="e-apoio" />
        </div>
      </Secao>

      <JornadaGuiada />
    </>
  );
}

/* ─── Jornada guiada (secundária): 8 etapas sobre a estimativa de mercado — base 2025 ─── */

const ETAPAS = ["Contexto", "Destaques", "Indicadores", "Aprendizados", "Compare", "Seu perfil", "Explore", "Recomendação"];

function JornadaGuiada() {
  const [aberta, setAberta] = useState(false);
  return (
    <Secao
      id="jornada"
      rotulo="Jornada guiada"
      titulo="Uma leitura em 8 etapas, com quiz de perfil e recomendação"
      lead="Parte da estimativa de mercado — base 2025, uma base à parte da coleta pública do Radar: preço do m², aluguel, liquidez e scores internos da Bewild. Use como leitura estratégica, não como verdade absoluta."
    >
      <p className="flex flex-wrap items-center gap-3">
        <Tag tipo="estimativa">{ROTULO_ESTIMATIVA_MERCADO}</Tag>
        <span className="e-legenda">{FONTE_BAIRROS_CURADOS}</span>
      </p>
      {!aberta ? (
        <Button variant="outline" className="mt-6 min-h-[44px] px-5 text-[15px] font-semibold" onClick={() => setAberta(true)} aria-expanded={false}>
          Começar a jornada
        </Button>
      ) : (
        <div id="jornada-conteudo" className="mt-6">
          <Jornada />
        </div>
      )}
    </Secao>
  );
}

function EtapaCarregando() {
  return <p className="e-apoio py-6" aria-busy="true">Carregando a etapa…</p>;
}

function Jornada() {
  const { data: bairros, isLoading, isError, refetch } = useBairrosData();
  const [etapa, setEtapa] = useState(1);
  const [respostas, setRespostas] = useState<QuizAnswers | null>(null);
  const [perfil, setPerfil] = useState<InvestorProfile | null>(null);
  const topo = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    topo.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [etapa]);

  if (isLoading) return <p className="e-apoio py-4" aria-busy="true">Carregando a estimativa de mercado — base 2025…</p>;
  if (isError) return <AvisoBase onTentar={() => void refetch()}>A estimativa de mercado — base 2025 não carregou agora. A base do Radar acima não foi afetada.</AvisoBase>;
  if (!bairros?.length) return <p className="e-apoio py-4">Não há estimativa de mercado para mostrar agora.</p>;

  const proxima = () => setEtapa((e) => Math.min(e + 1, ETAPAS.length));
  const concluirQuiz = (a: QuizAnswers, p: InvestorProfile) => { setRespostas(a); setPerfil(p); proxima(); };

  return (
    <div ref={topo} className="scroll-mt-20">
      <p className="e-legenda mb-3">{rotuloEstimativa(bairros[0])}. Etapa {etapa} de {ETAPAS.length}.</p>
      <nav aria-label="Etapas da jornada" className="overflow-x-auto">
        <ol className="flex min-w-max border-b border-foreground">
          {ETAPAS.map((rotulo, i) => {
            const n = i + 1;
            const ativa = etapa === n;
            return (
              <li key={rotulo}>
                <button
                  type="button"
                  onClick={() => setEtapa(n)}
                  aria-current={ativa ? "step" : undefined}
                  className={cn(
                    "-mb-px inline-flex min-h-[44px] items-center gap-1.5 border-b-[3px] px-3 text-[15px] transition-colors",
                    ativa ? "border-ciano font-semibold text-foreground" : "border-transparent text-tinta-70 hover:text-foreground",
                  )}
                >
                  <span className="tabular-nums">{n}</span>
                  <span className={cn(!ativa && "hidden sm:inline")}>{rotulo}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div key={etapa} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <Suspense fallback={<EtapaCarregando />}>
              {etapa === 1 && <Step1Context bairros={bairros} onNext={proxima} />}
              {etapa === 2 && <Step2Highlights bairros={bairros} onNext={proxima} />}
              {etapa === 3 && <Step3Learn onNext={proxima} />}
              {etapa === 4 && <Step4Learnings bairros={bairros} onNext={proxima} />}
              {etapa === 5 && <Step5Compare bairros={bairros} onNext={proxima} />}
              {etapa === 6 && <Step6Profile bairros={bairros} onComplete={concluirQuiz} />}
              {etapa === 7 && <Step7Explore bairros={bairros} onNext={proxima} />}
              {etapa === 8 && <Step8Recommendation bairros={bairros} profile={perfil} answers={respostas} />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      <details className="group e-fina mt-10 border-y">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          Fonte da diária e da ocupação de cada bairro
          <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
        </summary>
        <ul className="grid gap-x-8 gap-y-3 pb-6 sm:grid-cols-2 lg:grid-cols-3">
          {bairros.map((b) => (
            <li key={b.bairro} className="min-w-0">
              <span className="text-[15px] font-semibold">{b.bairro}</span>
              <FonteBairro nome={b.bairro} />
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
