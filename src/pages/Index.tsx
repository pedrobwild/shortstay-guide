import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import OrcamentoButton from "@/components/OrcamentoButton";
import FonteLink from "@/components/guide/FonteLink";
import LinkArtigoBewild from "@/components/guide/LinkArtigoBewild";
import { FAQ_ITEMS } from "@/components/guide/FAQSection";
import { CabecalhoTela, Container, Secao } from "@/components/estudo/Estrutura";
import MetadadosBase from "@/components/estudo/MetadadosBase";
import { FormulaReceita, AvisoReceita } from "@/components/estudo/Numeros";
import { NotaAmostra, TagBairro } from "@/components/estudo/Natureza";
import SeletorBairro from "@/components/estudo/SeletorBairro";
import { Button } from "@/components/ui/button";
import { useGuideAnalytics, setGlobalTrack, setGlobalSessionId, trackGlobal } from "@/hooks/useGuideAnalytics";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { useBairroSelecionado } from "@/hooks/useBairroSelecionado";
import { PERFIS_RADAR, type PerfilRadar } from "@/data/perfisRadar";
import { TEMAS_GUIA, caminhoTema } from "@/data/temasGuia";
import {
  AREA_MEDIANA_M2, CONTRATOS_ANALISADOS, ESTUDO_REFORMA_DATA, ESTUDO_REFORMA_URL, ORCAMENTO_MEDIANO,
  SELO_BAIRROS, SELO_PROJETOS, SELO_REFORMAS,
} from "@/data/provasBewild";
import { definirMomento, useMomento } from "@/lib/momento";
import { extremos, receitaDe } from "@/lib/estudo";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { bairroPath } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { BairroCurado } from "@/data/bairrosCurados";
import NovaAba from "@/components/NovaAba";

/**
 * Home do Radar no redesign "Estudo aberto" (direção 2a, out/2026): porta de entrada
 * enxuta. Os três perfis (comprar, reformar, operar) com as perguntas que o Radar
 * responde, um número de referência e as ferramentas; a base de dados com fonte,
 * período, coleta e amostra; três achados. O conteúdo do guia vive nas páginas de
 * tema (/guia/<tema>) e nas ferramentas; o simulador e o case, em /projecao.
 * Pré-renderizada com SSR e hidratada: bairro e perfil guardados são lidos depois
 * da montagem.
 */
export default function Index() {
  return (
    <BairroProvider>
      <IndexInner />
    </BairroProvider>
  );
}

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

function IndexInner() {
  useMedicaoHome();
  useSimuladorAntigo();
  const { bairros, cidade } = useBaseEstudo();
  const { bairro, selecionar } = useBairroSelecionado(bairros, { naUrl: false });
  const momento = useMomento();
  const ativo = momento ?? "procurando";
  const ocupacao = extremos(bairros, (b) => b.avgOccupancy);
  const receitaSP = receitaDe(cidade);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <AppNavbar />
      <main id="conteudo" tabIndex={-1} className="pb-8 outline-none">
        <CabecalhoTela
          home
          rotulo="Radar Bewild · estudo aberto sobre studios em São Paulo"
          titulo="Dados para decidir cada etapa de um studio para short stay: comprar, reformar e operar."
          lead={<>Diária, ocupação e amostra de {bairros.length} bairros, o custo de {CONTRATOS_ANALISADOS} contratos de reforma e as contas do short stay, com fonte, período e método à vista.</>}
        />

        {/* Três perfis: cada um com perguntas, número de referência, ferramentas e um botão */}
        <section id="perfis" aria-labelledby="perfis-titulo" className="scroll-mt-20 pb-12 lg:pb-16">
          <Container>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="perfis-titulo" className="e-h2">Em que etapa você está?</h2>
              {bairro && (
                <SeletorBairro
                  className="sm:w-[280px]"
                  rotulo="Bairro em análise"
                  bairros={bairros}
                  valor={bairro.name}
                  onChange={(nome) => { selecionar(nome); trackGlobal("cta_clicked", { cta_id: "home_bairro", section: "perfis", bairro: nome }); }}
                />
              )}
            </div>
            <div className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
              {PERFIS_RADAR.map((p) => (
                <ColunaPerfil key={p.numero} perfil={p} ativo={p.momento === ativo} bairro={bairro} />
              ))}
            </div>
          </Container>
        </section>

        <Secao
          id="base"
          rotulo="Base de dados"
          titulo="Os números vêm de uma coleta pública, com data e amostra"
          lead="Cada bairro tem a sua página na GuestFavorites. O Radar registra a leitura, o período e o tamanho da amostra; nada entra na base sem aprovação."
        >
          <MetadadosBase bairros={bairros} cidade={cidade} />
          <div className="mt-8 max-w-[720px]">
            <p className="e-rotulo mb-2">Método</p>
            <FormulaReceita />
          </div>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
            <Link to="/metodologia" className="e-link inline-flex min-h-[44px] items-center">Metodologia completa</Link>
            <a href="/dados/bairros.csv" className="e-link inline-flex min-h-[44px] items-center" download>Baixar a base (CSV)</a>
            <a href="/dados/bairros.json" className="e-link inline-flex min-h-[44px] items-center">JSON</a>
          </p>
        </Secao>

        <Secao id="resumo" rotulo="Resumo" titulo="Três achados para começar">
          <dl className="grid gap-10 md:grid-cols-3 md:gap-8">
            <Achado
              valor={formatBRL(receitaSP)}
              rotulo="Receita de referência por mês em São Paulo"
              nota={<>{formatBRL(cidade.dailyAvg)} de diária × 30 × {formatDecimal(cidade.avgOccupancy, 0)}% de ocupação, {cidade.period}. Antes de custos.</>}
            />
            {ocupacao && (
              <Achado
                valor={`${formatDecimal(ocupacao.min, 0)}–${formatDecimal(ocupacao.max, 0)}%`}
                rotulo={`Ocupação média nos ${bairros.length} bairros`}
                nota={<>Da menor ({ocupacao.nomesMin.join(", ")}) à maior ({ocupacao.nomesMax.join(", ")}). A ocupação varia menos que a diária entre os bairros.</>}
              />
            )}
            <Achado
              valor={formatBRL(ORCAMENTO_MEDIANO)}
              rotulo={`Reforma completa mediana, ${formatDecimal(AREA_MEDIANA_M2, 1)} m²`}
              nota={<>{CONTRATOS_ANALISADOS} contratos turnkey em SP, estudo Bewild de {ESTUDO_REFORMA_DATA}. <a href={ESTUDO_REFORMA_URL} target="_blank" rel="noopener noreferrer" className="e-link">Ver o estudo<NovaAba /></a></>}
            />
          </dl>
          <AvisoReceita className="mt-8" />
        </Secao>

        <Secao id="guia" rotulo="Guia por tema" titulo="O que estudar antes de cada decisão">
          <ul className="e-fina border-t">
            {TEMAS_GUIA.map((t) => (
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
        </Secao>

        <Secao id="bewild" rotulo="Quem produz" titulo="O Radar é produzido pela Bewild, que reforma studios compactos em São Paulo">
          <p className="e-corpo max-w-[720px] text-tinta-78">
            Os dados de mercado vêm de fontes públicas identificadas; o custo e o prazo de reforma, dos contratos da própria Bewild.
            {" "}<a href="https://bewild.com.br" target="_blank" rel="noopener noreferrer" className="e-link">Conheça a Bewild<NovaAba /></a>
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
            <li>{SELO_REFORMAS}</li>
            <li>{SELO_PROJETOS}</li>
            <li>{SELO_BAIRROS}</li>
          </ul>
          <OrcamentoButton local="final" rotulo="Solicitar orçamento de reforma" variant="outline" className="mt-8 min-h-[44px] px-5 text-[15px] font-semibold" />
        </Secao>

        <Secao id="faq" rotulo="Perguntas frequentes" titulo="Respostas curtas, com a fonte de cada número">
          <div className="e-fina border-t">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="group e-fina border-b">
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
            ))}
          </div>
        </Secao>
      </main>
      <RodapeRadar />
    </div>
  );
}

function Achado({ valor, rotulo, nota }: { valor: string; rotulo: string; nota: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="e-rotulo">{rotulo}</dt>
      <dd className="m-0">
        <span className="e-numero mt-2 block">{valor}</span>
        <span className="e-apoio mt-2 block">{nota}</span>
      </dd>
    </div>
  );
}

/** Número de referência de cada perfil, a partir do bairro em análise e do estudo de reforma. */
function referenciaPerfil(p: PerfilRadar, bairro: BairroCurado | null) {
  if (p.momento === "reformar") {
    return {
      rotulo: `Reforma mediana · ${formatDecimal(AREA_MEDIANA_M2, 1)} m²`,
      valor: formatBRL(ORCAMENTO_MEDIANO),
      nota: `${CONTRATOS_ANALISADOS} contratos turnkey em SP · estudo Bewild, ${ESTUDO_REFORMA_DATA}`,
    };
  }
  if (!bairro) return null;
  if (p.momento === "procurando") {
    return {
      rotulo: `Receita de referência · ${bairro.name}`,
      valor: `${formatBRL(receitaDe(bairro))}/mês`,
      nota: `${formatBRL(bairro.dailyAvg)} × 30 × ${formatDecimal(bairro.avgOccupancy, 0)}%, antes de custos`,
    };
  }
  return {
    rotulo: `Diária média e ocupação · ${bairro.name}`,
    valor: `${formatBRL(bairro.dailyAvg)} · ${formatDecimal(bairro.avgOccupancy, 0)}%`,
    nota: bairro.period ? `Média do bairro, ${bairro.period}` : "Média do bairro",
  };
}

function ColunaPerfil({ perfil, ativo, bairro }: { perfil: PerfilRadar; ativo: boolean; bairro: BairroCurado | null }) {
  const ref = referenciaPerfil(perfil, bairro);
  const idTitulo = `perfil-${perfil.numero}`;
  const escolher = (cta: string) => {
    definirMomento(perfil.momento);
    trackGlobal("cta_clicked", { cta_id: cta, section: "perfis", momento: perfil.momento });
  };
  const comBairroDeDados = perfil.momento !== "reformar" && bairro;
  return (
    <article
      aria-labelledby={idTitulo}
      className={cn("flex min-w-0 flex-col pt-6", ativo ? "border-t-[3px] border-ciano" : "border-t border-foreground")}
    >
      <p className="e-rotulo" id={idTitulo}>
        <span className="tabular-nums">{perfil.numero}</span> · {perfil.rotulo}
      </p>
      <h3 className="e-h3 mt-2">{perfil.situacao}</h3>

      <p className="e-rotulo mt-6">O Radar responde</p>
      <ul className="mt-2 space-y-1.5">
        {perfil.perguntas.map((q) => <li key={q} className="e-apoio">{q}</li>)}
      </ul>

      {ref && (
        <dl className="e-fina mt-6 border-t pt-4">
          <dt className="e-rotulo">{ref.rotulo}</dt>
          <dd className="m-0">
            <span className="e-numero-sm mt-1 block">{ref.valor}</span>
            <span className="e-legenda mt-1 block">{ref.nota}</span>
            {comBairroDeDados && (
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <TagBairro b={bairro} />
                <NotaAmostra b={bairro} curta />
                <Link to={bairroPath(bairro.name)} className="e-link text-[13px]">Ver o bairro</Link>
              </span>
            )}
          </dd>
        </dl>
      )}

      <p className="e-rotulo mt-6">Ferramentas</p>
      <ul className="mt-1">
        {perfil.ferramentas.map((f) => (
          <li key={f.to}>
            <Link to={f.to} onClick={() => escolher(`perfil_${perfil.numero}_ferramenta`)} className="e-link inline-flex min-h-[44px] items-center text-[15px]">
              {f.rotulo}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Button asChild variant={ativo ? "default" : "outline"} className="min-h-[44px] w-full px-5 text-[15px] font-semibold sm:w-auto">
          <Link to={perfil.acao.to} onClick={() => escolher(`perfil_${perfil.numero}`)}>{perfil.acao.rotulo}</Link>
        </Button>
      </div>
    </article>
  );
}
