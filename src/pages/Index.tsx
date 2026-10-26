import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import OrcamentoButton from "@/components/OrcamentoButton";
import FonteLink from "@/components/guide/FonteLink";
import LinkArtigoBewild from "@/components/guide/LinkArtigoBewild";
import { FAQ_ITEMS } from "@/components/guide/FAQSection";
import { Container, Secao } from "@/components/estudo/Estrutura";
import { Figura } from "@/components/estudo/Figura";
import MetadadosBase from "@/components/estudo/MetadadosBase";
import { AvisoReceita, Diferenca, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import { NotaAmostra, TagBairro } from "@/components/estudo/Natureza";
import SeletorBairro from "@/components/estudo/SeletorBairro";
import FaixaPosicao from "@/components/estudo/graficos/FaixaPosicao";
import { LegendaPontos } from "@/components/estudo/graficos/LegendaPontos";
import { Button } from "@/components/ui/button";
import { useGuideAnalytics, setGlobalTrack, setGlobalSessionId, trackGlobal } from "@/hooks/useGuideAnalytics";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { useBairroSelecionado } from "@/hooks/useBairroSelecionado";
import { PERFIS_RADAR, type PerfilRadar } from "@/data/perfisRadar";
import { TEMAS_GUIA, caminhoTema, type SlugTemaGuia } from "@/data/temasGuia";
import { linkSimuladorBairro } from "@/data/navegacao";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";
import {
  AREA_MEDIANA_M2, CONTRATOS_ANALISADOS, CUSTO_M2_P25, CUSTO_M2_P75, ESTUDO_REFORMA_DATA, ESTUDO_REFORMA_URL,
  GARANTIA_ANOS, ORCAMENTO_MEDIANO, PRAZO_DIAS_UTEIS_MAX, PRAZO_DIAS_UTEIS_MIN, SELO_BAIRROS, SELO_PROJETOS, SELO_REFORMAS,
} from "@/data/provasBewild";
import { definirMomento, useMomento } from "@/lib/momento";
import { definirBairroAtual } from "@/lib/bairroAtual";
import { receitaDe } from "@/lib/estudo";
import { naturezaBairro } from "@/lib/radarUi";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { bairroPath, slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { BairroCurado } from "@/data/bairrosCurados";
import NovaAba from "@/components/NovaAba";

/**
 * Home do Radar (reestruturação de 26/10/2026, sobre o "Estudo aberto"): uma ideia por
 * bloco e cada número uma vez só.
 *  1. Hero: o bairro em análise com diária, ocupação e receita de referência contra São
 *     Paulo, a natureza do dado e um botão principal (simular este bairro).
 *  2. Três portas (comprar, reformar, operar): uma frase e um botão cada; as listas de
 *     ferramentas vivem em /ferramentas.
 *  3. Fig. 1: os bairros num olhar (receita de referência), com o bairro em análise.
 *  4. Reforma: custo, faixa por m², prazo e garantia do estudo Bewild.
 *  5. Guia por tema (destaques + os demais em <details>).
 *  6. Quem produz e de onde vêm os números (fonte, período, coleta, dados abertos).
 *  7. Perguntas frequentes (as cinco primeiras abertas à leitura, as demais em "Mais perguntas").
 * Pré-renderizada com SSR e hidratada: bairro e perfil guardados são lidos depois da montagem.
 */
export default function Index() {
  return (
    <BairroProvider>
      <IndexInner />
    </BairroProvider>
  );
}

/** Temas do guia em destaque na home; os demais ficam em "Ver os outros temas". */
const TEMAS_DESTAQUE: SlugTemaGuia[] = ["escolha-do-ativo", "rentabilidade", "reforma", "anuncio-e-precificacao"];
/** Perguntas visíveis de cara; as demais ficam em "Mais perguntas" (continuam no HTML). */
const FAQ_VISIVEIS = 5;

function useMedicaoHome() {
  const { trackEvent, sessionId } = useGuideAnalytics();
  const marcos = useRef(new Set<string>());
  useEffect(() => {
    setGlobalTrack(trackEvent);
    setGlobalSessionId(sessionId);
    return () => {
      setGlobalTrack(null);
      setGlobalSessionId(null);
    };
  }, [trackEvent, sessionId]);
  useEffect(() => {
    trackEvent("page_view", { referrer: document.referrer, ua: navigator.userAgent });
  }, [trackEvent]);
  useEffect(() => {
    const aoRolar = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.round((window.scrollY / total) * 100);
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !marcos.current.has(`scroll_${m}`)) {
          marcos.current.add(`scroll_${m}`);
          trackEvent(`scroll_${m}`, {});
        }
      }
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [trackEvent]);
}

/** Links antigos para o simulador da home (/?bairro=x#simulador, compartilhados antes do redesign) seguem para /projecao. */
function useSimuladorAntigo() {
  const { hash, search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (hash === "#simulador") navigate(`/projecao${search}`, { replace: true });
  }, [hash, search, navigate]);
}

const pct = (v: number) => `${formatDecimal(v, 0)}%`;

function IndexInner() {
  useMedicaoHome();
  useSimuladorAntigo();
  const { bairros, cidade, isLoading, offline } = useBaseEstudo();
  const { bairro, selecionar } = useBairroSelecionado(bairros, { naUrl: false });
  const momento = useMomento();
  const ativo = momento ?? "procurando";
  const receitaSP = receitaDe(cidade);
  const destaques = TEMAS_DESTAQUE.map((s) => TEMAS_GUIA.find((t) => t.slug === s)).filter((t): t is (typeof TEMAS_GUIA)[number] => !!t);
  const demaisTemas = TEMAS_GUIA.filter((t) => !TEMAS_DESTAQUE.includes(t.slug));
  const faqVisiveis = FAQ_ITEMS.slice(0, FAQ_VISIVEIS);
  const faqDemais = FAQ_ITEMS.slice(FAQ_VISIVEIS);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <AppNavbar />
      <main id="conteudo" tabIndex={-1} className="pb-8 outline-none">
        {/* 1 · Hero: o bairro em análise, com os três números e a natureza do dado */}
        <section aria-labelledby="hero-titulo">
          <Container className="pb-12 pt-8 lg:pb-16 lg:pt-14">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-start lg:gap-16">
              <div className="min-w-0">
                <p className="e-rotulo mb-3">Radar Bewild · estudo aberto</p>
                <h1 id="hero-titulo" className="e-h1-home text-balance">Studios para short stay em São Paulo, bairro a bairro</h1>
                <p className="e-lead mt-4 max-w-[620px] text-pretty lg:mt-5">
                  Diária, ocupação e receita de referência de {bairros.length} bairros, com fonte e data, e o custo de {CONTRATOS_ANALISADOS} reformas de studio da Bewild.
                </p>
              </div>
              <PainelBairro
                bairro={bairro}
                bairros={bairros}
                cidade={cidade}
                receitaSP={receitaSP}
                carregando={isLoading && !bairros.length}
                offline={offline}
                onSelecionar={(nome) => { selecionar(nome); trackGlobal("cta_clicked", { cta_id: "home_bairro", section: "hero", bairro: nome }); }}
              />
            </div>
          </Container>
        </section>

        {/* 2 · Três portas: uma frase e um botão cada */}
        <section id="perfis" aria-labelledby="perfis-titulo" className="scroll-mt-20 pb-12 lg:pb-16">
          <Container>
            <h2 id="perfis-titulo" className="e-h2 mb-6 lg:mb-8">Em que etapa você está?</h2>
            <div className="grid gap-8 md:grid-cols-3 md:gap-8 lg:gap-12">
              {PERFIS_RADAR.map((p) => (
                <PortaPerfil key={p.numero} perfil={p} ativo={p.momento === ativo} />
              ))}
            </div>
          </Container>
        </section>

        {/* 3 · Os bairros num olhar */}
        {bairro && (
          <Secao id="bairros" rotulo={`Os ${bairros.length} bairros`} titulo={<>Onde {bairro.name} fica entre os {bairros.length} bairros em receita de referência</>}>
            <Figura
              numero={1}
              titulo="Receita de referência por mês, antes de custos"
              unidade="Toque num ponto para abrir o bairro."
              legenda={<LegendaPontos bairros={bairros} selecionado={bairro.name} referencia={<>São Paulo: {formatBRL(receitaSP)} por mês ({formatBRL(cidade.dailyAvg)} × 30 × {pct(cidade.avgOccupancy)})</>} />}
              fonte={<>GuestFavorites, {bairro.period ?? cidade.period}. Cálculo do Radar Bewild.</>}
            >
              <FaixaPosicao
                titulo="Um ponto por bairro"
                unidade="R$ por mês"
                bairros={bairros}
                valor={(x) => receitaDe(x)}
                formatar={formatBRL}
                passo={1000}
                referencia={{ valor: receitaSP, rotulo: `SP ${formatBRL(receitaSP)}` }}
                selecionado={bairro.name}
                hrefDe={(x) => bairroPath(x.name)}
                aoAbrir={(x) => { definirBairroAtual(x.name); trackGlobal("cta_clicked", { cta_id: "home_fig_bairro", section: "bairros", bairro: x.name }); }}
                sufixoSelecionado=" (bairro em análise)"
              />
            </Figura>
            <p className="mt-6 flex flex-wrap gap-x-6 text-[15px]">
              <Link to="/ranking" className="e-link inline-flex min-h-[44px] items-center">Ver o ranking completo</Link>
              <Link to={`/mapa?bairro=${slugifyBairro(bairro.name)}`} className="e-link inline-flex min-h-[44px] items-center">Ver no mapa</Link>
              <Link to="/comparar" className="e-link inline-flex min-h-[44px] items-center">Comparar bairros</Link>
            </p>
            <AvisoReceita className="mt-4" />
          </Secao>
        )}

        {/* 4 · Reforma: o estudo Bewild em quatro números */}
        <Secao
          id="reforma"
          rotulo="Reforma"
          titulo={<>Reforma completa de um studio: {formatBRL(ORCAMENTO_MEDIANO)} na mediana, de {PRAZO_DIAS_UTEIS_MIN} a {PRAZO_DIAS_UTEIS_MAX} dias úteis</>}
          lead={<>Estudo Bewild com {CONTRATOS_ANALISADOS} contratos turnkey em São Paulo ({ESTUDO_REFORMA_DATA}): projeto, obra, marcenaria sob medida, mobiliário, eletrodomésticos e enxoval.</>}
        >
          <GradeIndicadores className="lg:grid-cols-3">
            <Indicador
              className="col-span-2 lg:col-span-1"
              pequeno
              rotulo={`Orçamento mediano · ${formatDecimal(AREA_MEDIANA_M2, 1)} m²`}
              valor={formatBRL(ORCAMENTO_MEDIANO)}
              nota={<>Metade dos contratos entre {formatBRL(CUSTO_M2_P25)} e {formatBRL(CUSTO_M2_P75)} por m²</>}
            />
            <Indicador pequeno rotulo="Prazo (dias úteis)" valor={<>{PRAZO_DIAS_UTEIS_MIN}–{PRAZO_DIAS_UTEIS_MAX}</>} nota="Em contrato, pela metragem e sacada" />
            <Indicador pequeno rotulo="Garantia" valor={<>{GARANTIA_ANOS} anos</>} nota="Contrato com multa por dia de atraso" />
          </GradeIndicadores>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
            <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold">
              <Link to="/ferramentas#reformar" onClick={() => { definirMomento("reformar"); trackGlobal("cta_clicked", { cta_id: "home_reforma_estimar", section: "reforma" }); }}>
                Estimar a reforma pela área
              </Link>
            </Button>
            <a href={ESTUDO_REFORMA_URL} target="_blank" rel="noopener noreferrer" className="e-link inline-flex min-h-[44px] items-center text-[15px]">
              Ler o estudo completo<NovaAba />
            </a>
            <OrcamentoButton local="final" rotulo="Solicitar orçamento de reforma" variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold" />
          </div>
        </Secao>

        {/* 5 · Guia por tema: quatro destaques e o resto recolhido (links no HTML) */}
        <Secao id="guia" rotulo="Guia por tema" titulo="O que estudar antes de cada decisão">
          <ListaTemas temas={destaques} />
          {demaisTemas.length > 0 && (
            <details className="group mt-2">
              <summary className="e-link inline-flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-[15px] [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Ver os outros {demaisTemas.length} temas</span>
                <span className="hidden group-open:inline">Mostrar menos</span>
              </summary>
              <ListaTemas temas={demaisTemas} semBordaTopo />
            </details>
          )}
        </Secao>

        {/* 6 · Quem produz e de onde vêm os números (âncora #base mantida para links antigos) */}
        <Secao
          id="base"
          rotulo="Quem produz"
          titulo="Um estudo aberto da Bewild, com fonte e data em cada número"
          lead="Os dados de mercado vêm da GuestFavorites, lidos página a página e aprovados antes de entrar na base. O custo e o prazo de reforma vêm dos contratos da Bewild, que reforma studios compactos em São Paulo."
        >
          <MetadadosBase bairros={bairros} cidade={cidade} compacto />
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
            <li>{SELO_REFORMAS}</li>
            <li>{SELO_PROJETOS}</li>
            <li>{SELO_BAIRROS}</li>
          </ul>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
            <Link to="/metodologia" className="e-link inline-flex min-h-[44px] items-center">Metodologia completa</Link>
            <a href="/dados/bairros.csv" className="e-link inline-flex min-h-[44px] items-center" download>Baixar a base (CSV)</a>
            <a href="/dados/bairros.json" className="e-link inline-flex min-h-[44px] items-center">JSON</a>
            <a href="https://bewild.com.br" target="_blank" rel="noopener noreferrer" className="e-link inline-flex min-h-[44px] items-center">Conheça a Bewild<NovaAba /></a>
          </p>
        </Secao>

        {/* 7 · Perguntas frequentes */}
        <Secao id="faq" rotulo="Perguntas frequentes" titulo="Respostas curtas, com a fonte de cada número">
          <div className="e-fina border-t">
            {faqVisiveis.map((item) => <PerguntaFaq key={item.q} item={item} />)}
          </div>
          {faqDemais.length > 0 && (
            <details className="group/mais mt-2">
              <summary className="e-link inline-flex min-h-[44px] cursor-pointer list-none items-center text-[15px] [&::-webkit-details-marker]:hidden">
                <span className="group-open/mais:hidden">Mais {faqDemais.length} perguntas</span>
                <span className="hidden group-open/mais:inline">Mostrar menos</span>
              </summary>
              <div className="e-fina border-t">
                {faqDemais.map((item) => <PerguntaFaq key={item.q} item={item} />)}
              </div>
            </details>
          )}
        </Secao>
      </main>
      <RodapeRadar />
    </div>
  );
}

/**
 * Painel do hero: seletor do bairro, diária e ocupação lado a lado, a receita de
 * referência em destaque com a diferença contra São Paulo, a natureza do dado e a
 * fonte em uma linha, e o botão principal da página (simular este bairro).
 */
function PainelBairro({
  bairro, bairros, cidade, receitaSP, carregando, offline, onSelecionar,
}: {
  bairro: BairroCurado | null;
  bairros: BairroCurado[];
  cidade: { dailyAvg: number; avgOccupancy: number; period: string };
  receitaSP: number;
  carregando: boolean;
  offline: boolean;
  onSelecionar: (nome: string) => void;
}) {
  if (carregando || !bairro) {
    return (
      <div className="min-w-0 border-t-[3px] border-ciano pt-5" aria-busy="true">
        <p className="e-apoio py-10">Carregando os bairros…</p>
      </div>
    );
  }
  const receita = receitaDe(bairro);
  const aproximacao = naturezaBairro(bairro) === "aproximacao";
  const slug = slugifyBairro(bairro.name);
  return (
    <div className="min-w-0 border-t-[3px] border-ciano pt-5">
      <SeletorBairro rotulo="Bairro em análise" bairros={bairros} valor={bairro.name} onChange={onSelecionar} />

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
        <Indicador pequeno rotulo="Diária média" valor={formatBRL(bairro.dailyAvg)} nota={<>SP: {formatBRL(cidade.dailyAvg)}</>} />
        <Indicador pequeno rotulo="Ocupação média" valor={pct(bairro.avgOccupancy)} nota={<>SP: {pct(cidade.avgOccupancy)}</>} />
        <Indicador
          className="col-span-2"
          rotulo="Receita de referência por mês"
          valor={formatBRL(receita)}
          nota={
            <>
              {formatBRL(bairro.dailyAvg)} × 30 × {pct(bairro.avgOccupancy)}, antes de custos ·{" "}
              <Diferenca valor={receita - receitaSP} /> contra São Paulo ({formatBRL(receitaSP)})
            </>
          }
        />
      </dl>

      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <TagBairro b={bairro} />
        <NotaAmostra b={bairro} curta />
        <span className="e-legenda">
          {aproximacao ? <>Números do Itaim Bibi, {bairro.period ?? cidade.period}</> : (
            <>
              GuestFavorites, {bairro.period ?? cidade.period}
              {bairro.activeListings != null && <> · <span className="e-var">n</span> = {formatDecimal(bairro.activeListings, 0)} anúncios</>}
            </>
          )}
        </span>
      </p>
      {offline && <p className="e-legenda mt-2">A base não respondeu agora: números da reserva aprovada (coleta de {COLETA_GUESTFAVORITES}).</p>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold">
          <Link to={linkSimuladorBairro(slug)} onClick={() => trackGlobal("cta_clicked", { cta_id: "home_simular_bairro", section: "hero", bairro: bairro.name })}>
            Simular este bairro
          </Link>
        </Button>
        <Link to={bairroPath(bairro.name)} className="e-link inline-flex min-h-[44px] items-center text-[15px]">Ver a página do bairro</Link>
      </div>
    </div>
  );
}

/** Porta de um perfil: rótulo, situação, uma frase e um botão. */
function PortaPerfil({ perfil, ativo }: { perfil: PerfilRadar; ativo: boolean }) {
  const idTitulo = `perfil-${perfil.numero}`;
  return (
    <article aria-labelledby={idTitulo} className={cn("flex min-w-0 flex-col", ativo ? "border-t-[3px] border-ciano pt-5" : "border-t border-foreground pt-[22px]")}>
      <p className="e-rotulo">
        <span className="tabular-nums">{perfil.numero}</span> · {perfil.rotulo}
      </p>
      <h3 id={idTitulo} className="e-h3 mt-2">{perfil.situacao}</h3>
      <p className="e-apoio mt-2">{perfil.resumo}</p>
      <div className="mt-auto pt-5">
        <Button asChild variant={ativo ? "default" : "outline"} className="min-h-[44px] w-full px-5 text-[15px] font-semibold sm:w-auto">
          <Link
            to={perfil.acao.to}
            onClick={() => { definirMomento(perfil.momento); trackGlobal("cta_clicked", { cta_id: `perfil_${perfil.numero}`, section: "perfis", momento: perfil.momento }); }}
          >
            {perfil.acao.rotulo}
          </Link>
        </Button>
      </div>
    </article>
  );
}

function ListaTemas({ temas, semBordaTopo = false }: { temas: (typeof TEMAS_GUIA)[number][]; semBordaTopo?: boolean }) {
  return (
    <ul className={cn("e-fina", !semBordaTopo && "border-t")}>
      {temas.map((t) => (
        <li key={t.slug} className="e-fina border-b">
          <Link
            to={caminhoTema(t.slug)}
            onClick={() => trackGlobal("cta_clicked", { cta_id: "tema_guia", section: t.slug })}
            className="group grid min-h-[44px] gap-1 py-4 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)] sm:gap-8"
          >
            <span className="text-[17px] font-semibold leading-6 group-hover:underline">{t.titulo}</span>
            <span className="e-apoio">{t.resumo}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PerguntaFaq({ item }: { item: (typeof FAQ_ITEMS)[number] }): ReactNode {
  return (
    <details className="group e-fina border-b">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[17px] font-semibold leading-6 hover:underline [&::-webkit-details-marker]:hidden">
        {item.q}
        <span aria-hidden="true" className="shrink-0 text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
      </summary>
      <div className="max-w-[720px] pb-5">
        <p className="e-apoio">{item.a}</p>
        {item.source && <FonteLink fonte={item.source} />}
        {item.artigo && <LinkArtigoBewild artigo={item.artigo} />}
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="e-link inline-flex min-h-[44px] items-center text-[15px]">
            Ver a análise completa<NovaAba />
          </a>
        )}
      </div>
    </details>
  );
}
