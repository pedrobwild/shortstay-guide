import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CabecalhoTela, Container, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import { Figura, TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import MetadadosBase from "@/components/estudo/MetadadosBase";
import { NotaAmostra, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, FormulaReceita } from "@/components/estudo/Numeros";
import SeletorBairro from "@/components/estudo/SeletorBairro";
import MapaBairrosSvg from "@/components/estudo/graficos/MapaBairrosSvg";
import { CONTORNO, COR_CLASSE, textoIndicador } from "@/components/estudo/graficos/mapaSvgTextos";
import Segmentado from "@/components/radar/Segmentado";
import AvisoBase from "@/components/radar/AvisoBase";
import { Button } from "@/components/ui/button";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { useBairroSelecionado } from "@/hooks/useBairroSelecionado";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { DEMAND_FILTERS, NEIGHBORHOODS, type CityEvent } from "@/data/mapaBairrosData";
import { linkProjecaoBairro } from "@/data/navegacao";
import type { BairroCurado } from "@/data/bairrosCurados";
import { receitaDe, temAmostraPequena } from "@/lib/estudo";
import {
  INDICADORES_MAPA, centroSP, contagemClasses, direcaoDaClasse, pontosMapa, textoDirecao, valorIndicador, vizinhosMaisProximos,
  type IndicadorMapa,
} from "@/lib/estudoMapa";
import { caminhoComparar } from "@/lib/comparar";
import { temPerfil } from "@/lib/leiturasBairros";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { rotuloReferenciaBewild } from "@/lib/radarBase";
import { fonteCurtaBairro, naturezaBairro, type BairroBase } from "@/lib/radarUi";
import { bairroPath, slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";

// O mapa de ruas (MapLibre) e as leituras complementares pesam: só carregam quando a pessoa pede.
const ExploradorBairros = lazy(() => import("@/components/mapa/ExploradorBairros"));
const LeiturasComplementares = lazy(() => import("@/components/mapa/LeiturasComplementares"));

/**
 * /mapa no redesign "Estudo aberto": Fig. 1 em SVG próprio com as coordenadas reais
 * (bairrosGeo.ts), grade de latitude e longitude, escala de 2 km e norte; cor pelo
 * indicador em 4 classes por quartil e área pela amostra. A leitura do bairro
 * selecionado (?bairro=) fica num card ao lado. O explorador com mapa de ruas, metrô
 * e comparação (?b=) e as leituras complementares seguem numa seção abaixo, sob demanda.
 */
export default function MapaBairros() {
  return (
    <BairroProvider>
      <PaginaEstudo>
        <Mapa />
      </PaginaEstudo>
    </BairroProvider>
  );
}

const NOME: Record<IndicadorMapa, string> = {
  receita: "receita de referência",
  diaria: "diária média",
  ocupacao: "ocupação média",
};
const UNIDADE: Record<IndicadorMapa, string> = {
  receita: "Receita de referência (R$/mês)",
  diaria: "Diária média (R$)",
  ocupacao: "Ocupação média (%)",
};

function Mapa() {
  const { bairros, cidade, isLoading, offline, recarregar } = useBaseEstudo();
  const { bairro: selecionado, selecionar } = useBairroSelecionado(bairros);
  const [params] = useSearchParams();
  const [indicador, setIndicador] = useState<IndicadorMapa>("receita");
  // O explorador abre sozinho quando a URL já traz uma comparação (?b=), como antes.
  const [ruasAberto, setRuasAberto] = useState(() => params.has("b"));

  const { pontos, limites } = useMemo(() => pontosMapa(bairros, indicador), [bairros, indicador]);
  const contagem = useMemo(() => contagemClasses(bairros, indicador, limites), [bairros, indicador, limites]);
  const centro = useMemo(() => centroSP(), []);
  const achadoReceita = useMemo(() => direcaoDaClasse(pontosMapa(bairros, "receita").pontos, 4, centro), [bairros, centro]);
  const achado = direcaoDaClasse(pontos, 4, centro);

  const escolher = (nome: string) => {
    selecionar(nome);
    trackGlobal("cta_clicked", { cta_id: "mapa_selecionar_bairro", section: "mapa_fig1", bairro: nome });
  };

  const tituloFig = achado.n === 1
    ? <>O bairro de maior {NOME[indicador]} fica {textoDirecao(achado.direcao)}</>
    : <>Os {achado.n} bairros de maior {NOME[indicador]} ficam {textoDirecao(achado.direcao)}</>;

  return (
    <>
      <CabecalhoTela
        rotulo={`Mapa · ${bairros.length} bairros de São Paulo`}
        titulo={<>Os bairros de maior receita de referência ficam {textoDirecao(achadoReceita.direcao)}</>}
        lead="Cada círculo é um bairro na sua posição real. A cor mostra o indicador em quatro classes por quartil; a área, o tamanho da amostra. Selecione um bairro para ler os números e a fonte."
      >
        <MetadadosBase bairros={bairros} cidade={cidade} compacto />
      </CabecalhoTela>

      {offline && (
        <Container className="mb-6">
          <AvisoBase tom="aviso" onTentar={recarregar}>A base do Radar não respondeu agora. O mapa mostra a reserva aprovada (mesmos números da coleta de 18/10/2026).</AvisoBase>
        </Container>
      )}

      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-10">
          <div className="min-w-0">
            <p className="e-rotulo mb-1.5">Indicador</p>
            <Segmentado<IndicadorMapa> rotulo="Indicador da cor" valor={indicador} opcoes={INDICADORES_MAPA} onChange={setIndicador} className="w-full max-w-[360px]" itemClassName="px-2.5 text-[15px]" />
          </div>
          {selecionado && (
            <SeletorBairro className="sm:w-[280px]" rotulo="Bairro selecionado" bairros={bairros} valor={selecionado.name} onChange={escolher} />
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <Figura
            numero={1}
            titulo={tituloFig}
            unidade={<>Cor: {NOME[indicador]} ({indicador === "receita" ? "R$/mês" : indicador === "diaria" ? "R$" : "%"}), em 4 classes por quartil. Área: anúncios na amostra (<span className="e-var">n</span>). Projeção equirretangular a 23,6° S; grade em graus.</>}
            legenda={<LegendaMapa indicador={indicador} limites={limites} contagem={contagem} temAproximacao={pontos.some((p) => p.aproximacao)} amostraPequena={pontos.filter((p) => temAmostraPequena(p.bairro)).map((p) => p.bairro.name)} />}
            fonte={<>GuestFavorites, {cidade.period}. Posição: centro aproximado de cada bairro (bairrosGeo).</>}
          >
            {isLoading && !bairros.length ? (
              <p className="e-apoio py-10" aria-busy="true">Carregando os bairros…</p>
            ) : (
              <MapaBairrosSvg bairros={bairros} indicador={indicador} selecionado={selecionado?.name ?? null} onSelecionar={escolher} />
            )}
          </Figura>

          <div className="min-w-0 lg:pt-[92px]">
            {selecionado ? <LeituraBairro b={selecionado} bairros={bairros} indicador={indicador} /> : <p className="e-apoio">Selecione um bairro no mapa.</p>}
          </div>
        </div>

        <div className="mt-10 max-w-[720px]">
          {indicador === "receita" && <FormulaReceita />}
          <AvisoReceita className="mt-4" />
        </div>

        <TabelaEquivalente bairros={bairros} indicador={indicador} limites={limites} selecionado={selecionado?.name ?? null} />
      </Container>

      <SecaoRuas aberto={ruasAberto} onAbrir={() => { setRuasAberto(true); trackGlobal("cta_clicked", { cta_id: "mapa_abrir_ruas", section: "mapa" }); }} />
    </>
  );
}

/** Legenda da Fig. 1: as 4 classes com os limites, a área pela amostra, a aproximação e a seleção. */
function LegendaMapa({ indicador, limites, contagem, temAproximacao, amostraPequena }: { indicador: IndicadorMapa; limites: [number, number, number]; contagem: [number, number, number, number]; temAproximacao: boolean; amostraPequena: string[] }) {
  const t = (v: number) => textoIndicador(indicador === "ocupacao" ? Math.round(v * 10) / 10 : v, indicador);
  const faixas = [`até ${t(limites[0])}`, `${t(limites[0])} a ${t(limites[1])}`, `${t(limites[1])} a ${t(limites[2])}`, `acima de ${t(limites[2])}`];
  return (
    <div className="grid gap-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Classes por quartil">
        {([1, 2, 3, 4] as const).map((c, i) => (
          <li key={c} className="flex items-center gap-2 tabular-nums">
            <svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill={COR_CLASSE[c]} stroke={CONTORNO} /></svg>
            {faixas[i]} <span className="text-tinta-70">({contagem[i]})</span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        <li className="flex items-center gap-2">
          <svg width="30" height="18" aria-hidden="true"><circle cx="5" cy="13" r="4" fill="none" stroke={CONTORNO} /><circle cx="20" cy="9" r="8" fill="none" stroke={CONTORNO} /></svg>
          Área proporcional aos anúncios
        </li>
        {temAproximacao && (
          <li className="flex items-center gap-2">
            <svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="hsl(var(--ciano-400))" fillOpacity="0.28" stroke={CONTORNO} strokeDasharray="3 2" /></svg>
            Aproximação pelo Itaim Bibi (sem amostra própria, tamanho fixo)
          </li>
        )}
        <li className="flex items-center gap-2">
          <svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="hsl(var(--magenta))" stroke="hsl(var(--magenta-700))" strokeWidth="1.5" /></svg>
          Bairro selecionado
        </li>
      </ul>
      {amostraPequena.length > 0 && (
        <p className="e-amostra">* Amostra pequena (menos de 200 anúncios): {amostraPequena.join(", ")}. Leia com cautela.</p>
      )}
      <p>Classes calculadas sobre os bairros com dado próprio. {temAproximacao && TEXTO_APROXIMACAO}</p>
    </div>
  );
}

/** Leitura do bairro selecionado: card discreto ao lado do mapa (abaixo no celular). */
function LeituraBairro({ b, bairros, indicador }: { b: BairroBase; bairros: BairroBase[]; indicador: IndicadorMapa }) {
  const slug = slugifyBairro(b.name);
  const vizinhos = vizinhosMaisProximos(bairros, b.name, 2);
  const linkComparar = caminhoComparar([slug, ...vizinhos.map((v) => slugifyBairro(v.name))]);
  const aprox = naturezaBairro(b) !== "observado";
  const receita = receitaDe(b);
  const q = b.dailyQuartiles;
  const itens: { rotulo: string; valor: string; destaque?: boolean }[] = [
    { rotulo: "Diária média", valor: formatBRL(b.dailyAvg), destaque: indicador === "diaria" },
    { rotulo: "Ocupação média", valor: `${formatDecimal(b.avgOccupancy, 0)}%`, destaque: indicador === "ocupacao" },
    { rotulo: "Receita de referência", valor: `${formatBRL(receita)}/mês`, destaque: indicador === "receita" },
    { rotulo: "Anúncios (n)", valor: b.activeListings != null && !aprox ? formatDecimal(b.activeListings, 0) : "sem amostra própria" },
  ];
  return (
    <section aria-labelledby="leitura-bairro" aria-live="polite" className="e-fina border bg-card p-5">
      <p className="e-rotulo">Bairro selecionado</p>
      <h2 id="leitura-bairro" className="e-h2 mt-1 text-magenta-700">{b.name}</h2>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        <TagBairro b={b} />
        <NotaAmostra b={b} />
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
        {itens.map((i) => (
          <div key={i.rotulo} className="min-w-0">
            <dt className="e-rotulo">{i.rotulo}</dt>
            <dd className={cn("m-0 mt-1 tabular-nums", i.destaque ? "text-[22px] font-semibold leading-7" : "text-[17px] leading-6")}>{i.valor}</dd>
          </div>
        ))}
      </dl>
      <p className="e-legenda mt-3 tabular-nums">
        {formatBRL(receita)} = {formatBRL(b.dailyAvg)} × 30 × {formatDecimal(b.avgOccupancy / 100, 2)}, antes de custos.
        {q && <> Quartis da diária{aprox ? " do Itaim Bibi" : ""}: {formatBRL(q[0])} · {formatBRL(q[1])} · {formatBRL(q[2])}.</>}
      </p>
      <p className="e-legenda mt-2">Fonte: {fonteCurtaBairro(b)}{aprox ? " (Itaim Bibi)" : ""}.</p>
      {aprox && b.referenciaBewild && <p className="e-legenda mt-1">Referência extra, fora das contas: {rotuloReferenciaBewild(b.referenciaBewild)}.</p>}
      <div className="mt-5 grid gap-2">
        <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold">
          <Link to={linkProjecaoBairro(slug)} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "mapa", bairro: b.name })}>Simular {b.name}</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold">
          <Link to={linkComparar}>Comparar com vizinhos</Link>
        </Button>
      </div>
      {vizinhos.length > 0 && <p className="e-legenda mt-2">Com {vizinhos.map((v) => v.name).join(" e ")}, os mais próximos no mapa.</p>}
      <Link to={bairroPath(b.name)} className="e-link mt-2 inline-flex min-h-[44px] items-center text-[15px]">Ver a página de {b.name}</Link>
    </section>
  );
}

/** Tabela equivalente à Fig. 1 (recolhida): os mesmos números, ordenados pelo indicador. */
function TabelaEquivalente({ bairros, indicador, limites, selecionado }: { bairros: BairroBase[]; indicador: IndicadorMapa; limites: [number, number, number]; selecionado: string | null }) {
  const { pontos } = pontosMapa(bairros, indicador);
  const porNome = new Map(pontos.map((p) => [p.bairro.name, p]));
  const ordenados = [...bairros].sort((a, b) => valorIndicador(b, indicador) - valorIndicador(a, indicador) || a.name.localeCompare(b.name, "pt-BR"));
  return (
    <details className="group e-fina mt-10 border-y">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
        Ver a tabela equivalente ao mapa
        <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
      </summary>
      <div className="pb-6">
        <TabelaNumerada
          numero={1}
          titulo={<>Os {bairros.length} bairros do mapa, por {NOME[indicador]}</>}
          unidade={<>Classe 1 a 4 por quartil de {NOME[indicador]} (limites {textoIndicador(limites[0], indicador)}, {textoIndicador(limites[1], indicador)} e {textoIndicador(limites[2], indicador)}). Receita de referência em R$/mês.</>}
          nota={<p>{TEXTO_APROXIMACAO} Amostra pequena (menos de 200 anúncios) aparece em itálico.</p>}
        >
          <thead>
            <tr>
              <th scope="col" className={TH}>Bairro</th>
              <th scope="col" className={cn(TH, "text-right")}>Classe</th>
              <th scope="col" className={cn(TH, "text-right")}>Diária</th>
              <th scope="col" className={cn(TH, "text-right")}>Ocup.</th>
              <th scope="col" className={cn(TH, "text-right")}>R$/mês</th>
              <th scope="col" className={cn(TH, "text-right")}><span className="e-var normal-case">n</span></th>
              <th scope="col" className={cn(TH, "hidden md:table-cell")}>Natureza</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((b) => {
              const sel = b.name === selecionado;
              const p = porNome.get(b.name);
              const aprox = naturezaBairro(b) !== "observado";
              return (
                <tr key={b.name} className={cn(sel && "bg-magenta-100/60")}>
                  <td className={cn(TD, "relative")}>
                    <Link to={bairroPath(b.name)} className={cn("font-semibold underline-offset-4 hover:underline", sel && "text-magenta-700")}>{b.name}</Link>
                    {sel && <span className="sr-only"> (bairro selecionado)</span>}
                    <span className="mt-0.5 flex flex-wrap gap-2 md:hidden">
                      {aprox && <TagBairro b={b} />}
                      <NotaAmostra b={b} curta />
                    </span>
                  </td>
                  <td className={TD_NUM}>{p?.classe ?? "—"}</td>
                  <td className={TD_NUM}>{formatBRL(b.dailyAvg)}</td>
                  <td className={TD_NUM}>{formatDecimal(b.avgOccupancy, 0)}%</td>
                  <td className={cn(TD_NUM, "font-semibold")}>{formatBRL(receitaDe(b))}</td>
                  <td className={cn(TD_NUM, temAmostraPequena(b) && "e-amostra")}>{b.activeListings != null && !aprox ? formatDecimal(b.activeListings, 0) : "—"}</td>
                  <td className={cn(TD, "hidden md:table-cell")}>
                    <span className="flex flex-wrap items-center gap-2"><TagBairro b={b} /><NotaAmostra b={b} curta /></span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TabelaNumerada>
      </div>
    </details>
  );
}

/**
 * Mapa de ruas e metrô (MapLibre) com a comparação (?b=) e as leituras complementares
 * do mapa anterior (ranking interno, perfis de demanda, eventos). Carrega sob demanda.
 */
function SecaoRuas({ aberto, onAbrir }: { aberto: boolean; onAbrir: () => void }) {
  return (
    <Secao
      id="ruas"
      rotulo="Mapa de ruas e metrô"
      titulo="Para ver ruas, metrô e pontos de interesse, abra o mapa interativo"
      lead="O mapa de ruas mostra o raio de 600 m das estações, pontos de interesse e camadas de contexto, e monta a comparação de até três bairros. Perfil de demanda, eventos e o ranking interno ficam logo abaixo dele."
    >
      {aberto ? (
        <Suspense fallback={<p className="e-apoio py-10" aria-busy="true">Carregando o mapa de ruas…</p>}>
          <ConteudoRuas />
        </Suspense>
      ) : (
        <Button variant="outline" onClick={onAbrir} className="min-h-[44px] px-5 text-[15px] font-semibold">Abrir o mapa de ruas e metrô</Button>
      )}
    </Secao>
  );
}

function ConteudoRuas() {
  const { bairros } = useBaseEstudo();
  const [, setParams] = useSearchParams();
  const [evento, setEvento] = useState<CityEvent | null>(null);
  const [perfis, setPerfis] = useState<string[]>([]);
  const [pedidoCentralizar, setPedidoCentralizar] = useState<{ nome: string; n: number } | null>(null);
  const ancora = useRef<HTMLDivElement>(null);
  const nomesBase = new Set(bairros.map((b: BairroCurado) => b.name));

  // Destaque no mapa: o evento escolhido ou, sem evento, os bairros do perfil de demanda (só os da base).
  const nomesPerfil = perfis.length ? NEIGHBORHOODS.filter((n) => temPerfil(n, perfis)).map((n) => n.name) : [];
  const rotulosPerfil = DEMAND_FILTERS.filter((f) => perfis.includes(f.key)).map((f) => f.label).join(", ");
  const destaque = (evento ? evento.nearbyNeighborhoods : nomesPerfil).filter((n) => nomesBase.has(n));
  const rotuloDestaque = evento ? `Perto de: ${evento.name}` : perfis.length ? `Perfil: ${rotulosPerfil}` : undefined;
  const limparDestaque = () => { if (evento) setEvento(null); else setPerfis([]); };

  const selecionarNoMapa = (nome: string) => {
    if (!nomesBase.has(nome)) return;
    setParams((atual) => { const p = new URLSearchParams(atual); p.set("bairro", slugifyBairro(nome)); return p; }, { replace: true, preventScrollReset: true });
    setPedidoCentralizar((c) => ({ nome, n: (c?.n ?? 0) + 1 }));
    ancora.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={ancora} className="scroll-mt-20">
      <ExploradorBairros embutido destaque={destaque} rotuloDestaque={rotuloDestaque} onLimparDestaque={limparDestaque} pedidoCentralizar={pedidoCentralizar} />
      <LeiturasComplementares embutido eventoAtivo={evento} onEvento={setEvento} perfis={perfis} onPerfis={setPerfis} onSelecionarBairro={selecionarNoMapa} />
    </div>
  );
}
