import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import sectionHeroStudio from "@/assets/section-hero-studio.jpg";
import { SAO_PAULO_REFERENCIA } from "@/data/bairrosCurados";
import { COLETA_GUESTFAVORITES, FONTES_GUIA } from "@/data/fontesGuia";
import FonteLink from "@/components/guide/FonteLink";
import Carimbo from "@/components/radar/Carimbo";
import NaturezaTag from "@/components/radar/NaturezaTag";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { formatDecimal, formatPercent } from "@/lib/numberFormat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBairroData } from "@/hooks/useBairroData";
import { caminhoComBairro, definirBairroAtual, useBairroAtual } from "@/lib/bairroAtual";
import { CAMINHOS_MOMENTO, definirMomento, type Momento } from "@/lib/momento";
import { slugifyBairro } from "@/lib/seo";

/**
 * Três entradas por momento do investidor (procurando → já tenho → vou reformar),
 * como uma prancha numerada. A escolha fica guardada (momento.ts) e muda o atalho
 * principal do celular; o bairro atual, quando existe, acompanha os links.
 */
const PORTAS: { num: string; momento: Momento; id: string }[] = [
  { num: "01", momento: "procurando", id: "porta_bairro" },
  { num: "02", momento: "tenho", id: "porta_conta" },
  { num: "03", momento: "reformar", id: "porta_reforma" },
];

/**
 * "Qual bairro você quer analisar?": a escolha vai para o mapa com o bairro
 * selecionado e fica guardada para o comparador e o simulador (bairroAtual.ts).
 * Seletor nativo: funciona no celular sem JavaScript extra e com 44px de toque.
 */
function SeletorBairro() {
  const { bairros } = useBairroData();
  const atual = useBairroAtual();
  const navigate = useNavigate();
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const slug = escolhido ?? atual?.slug ?? "";
  const bairro = bairros.find((b) => slugifyBairro(b.name) === slug);
  const ir = (destino: "/mapa" | "/projecao", e?: FormEvent) => {
    e?.preventDefault();
    if (!bairro) return;
    definirBairroAtual(bairro.name);
    trackGlobal("cta_clicked", { cta_id: destino === "/mapa" ? "hero_analisar_bairro" : "hero_simular_bairro", section: "hero", bairro: bairro.name });
    navigate(`${destino}?bairro=${encodeURIComponent(slugifyBairro(bairro.name))}`);
  };
  return (
    <form onSubmit={(e) => ir("/mapa", e)} className="mb-8 rounded-[4px] border border-border bg-card p-4 lg:mb-10 lg:p-5" aria-labelledby="seletor-bairro-titulo">
      <p id="seletor-bairro-titulo" className="font-display text-lg font-semibold leading-tight text-foreground">Qual bairro você quer analisar?</p>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">Escolha um bairro e veja os indicadores; a escolha acompanha o mapa, o comparador e o simulador.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="seletor-bairro">Bairro</label>
        <select
          id="seletor-bairro"
          value={slug}
          onChange={(e) => setEscolhido(e.target.value)}
          className="min-h-[44px] min-w-0 flex-1 rounded-[4px] border border-input bg-background px-3 text-base text-foreground"
        >
          <option value="">Selecionar bairro</option>
          {bairros.map((b) => <option key={b.name} value={slugifyBairro(b.name)}>{b.name}</option>)}
        </select>
        <Button type="submit" disabled={!bairro} className="min-h-[44px] px-5 font-semibold">Analisar</Button>
        <Button type="button" variant="outline" disabled={!bairro} onClick={() => ir("/projecao")} className="min-h-[44px] px-5 font-semibold">Simular</Button>
      </div>
    </form>
  );
}

/** Carimbo de referência: números de São Paulo da mesma coleta dos bairros (dado observado). */
function CarimboReferencia({ className }: { className?: string }) {
  const sp = SAO_PAULO_REFERENCIA;
  return (
    <Carimbo
      className={className}
      titulo="Referência · São Paulo"
      tag={<NaturezaTag tipo="observado">Observado</NaturezaTag>}
      celulas={[
        { rotulo: "Diária média", valor: `R$ ${formatDecimal(sp.dailyAvg, 0)}` },
        { rotulo: "Ocupação", valor: formatPercent(sp.avgOccupancy, 0) },
        { rotulo: "Anúncios", valor: formatDecimal(sp.activeListings, 0) },
      ]}
      rodape={
        <FonteLink
          fonte={{ ...FONTES_GUIA.guestfavoritesSP, title: `GuestFavorites · ${sp.period} · coleta de ${COLETA_GUESTFAVORITES}` }}
          className="flex w-full px-3 text-xs text-foreground-medium no-underline hover:underline min-[360px]:px-3.5"
        />
      }
    />
  );
}

export default function HeroSection() {
  const bairroAtual = useBairroAtual();
  return (
    <section id="hero" className="scroll-mt-24 grid gap-10 pb-12 pt-8 md:pt-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-16 lg:pb-20 lg:pt-16">
      <div className="min-w-0">
        <p className="rotulo-secao mb-4 lg:mb-5">Radar Bewild · Inteligência para investir em studios</p>
        <h1 className="mb-5 font-display text-[34px] font-bold leading-[1.1] tracking-[-0.01em] text-foreground sm:text-5xl lg:mb-6 lg:text-[60px] lg:leading-[1.06]">
          Quanto seu studio pode render?<br />Comece pelos dados.
        </h1>
        <p className="mb-6 max-w-[600px] text-[17px] leading-[1.55] text-foreground-medium text-pretty lg:mb-7 lg:text-[19px]">
          Compare bairros de São Paulo, simule receitas e custos e planeje o investimento na reforma. Reúna as informações para decidir onde comprar e como preparar seu studio para locação por temporada.
        </p>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="min-h-[48px] px-[22px] text-[15px] font-semibold">
            <Link to="/projecao" onClick={() => trackGlobal("cta_clicked", { cta_id: "hero_analisar", section: "hero" })}>Analisar meu investimento</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-[48px] px-[22px] text-[15px] font-semibold">
            <Link to="/mapa" onClick={() => trackGlobal("cta_clicked", { cta_id: "hero_explorar", section: "hero" })}>Explorar bairros</Link>
          </Button>
        </div>
        <p className="mb-6 text-sm text-muted-foreground lg:mb-8">Dados com fontes identificadas. Simulações com premissas ajustáveis.</p>

        <SeletorBairro />

        {/* Portas por momento: prancha numerada com régua de 2px. No celular viram linhas
            compactas (número, situação, texto e seta), para as três caberem na primeira tela. */}
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Em que momento você está?</p>
        <ol id="portas-hero" className="regua grid md:grid-cols-3">
          {PORTAS.map((p, i) => {
            const c = CAMINHOS_MOMENTO[p.momento];
            const conteudo = (
              <>
                <span className="col-start-1 row-span-2 row-start-1 pt-[5px] text-[13px] font-semibold tracking-[0.06em] text-accent-text md:pt-0">{p.num}</span>
                <span className="col-start-2 row-start-1 font-display text-xl font-semibold leading-[1.2] text-foreground md:text-[21px] lg:text-[23px]">{c.situacao}</span>
                <span className="col-start-2 row-start-2 text-sm leading-[1.45] text-muted-foreground md:text-[15px] md:leading-normal">{c.texto}</span>
                <span className="sr-only md:not-sr-only md:mt-auto md:inline-flex md:items-center md:gap-1 md:pt-2 md:text-sm md:font-semibold md:text-primary">
                  {c.acao}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <ArrowRight className="col-start-3 row-span-2 row-start-1 h-4 w-4 self-center text-primary md:hidden" aria-hidden="true" />
              </>
            );
            const classe = cn(
              "grid h-full w-full grid-cols-[28px_minmax(0,1fr)_16px] gap-x-3 gap-y-1 py-4 text-left transition-colors hover:bg-accent-light",
              "md:flex md:min-h-[200px] md:flex-col md:gap-2.5 md:py-5",
              i === 0 ? "md:pr-5" : "md:px-5",
            );
            const rastrear = () => { definirMomento(p.momento); trackGlobal("cta_clicked", { cta_id: p.id, section: "hero", momento: p.momento }); };
            const destino = c.destino.startsWith("#") ? c.destino : caminhoComBairro(c.destino, bairroAtual);
            return (
              <li key={p.num} className={cn("border-border", i > 0 && "border-t md:border-l md:border-t-0")}>
                {destino.startsWith("#")
                  ? <a href={destino} onClick={rastrear} className={classe}>{conteudo}</a>
                  : <Link to={destino} onClick={rastrear} className={classe}>{conteudo}</Link>}
              </li>
            );
          })}
        </ol>
        <p className="mt-1 text-sm text-muted-foreground">
          Quer ver o mercado antes?{" "}
          <Link to="/mercado" onClick={() => trackGlobal("cta_clicked", { cta_id: "hero_mercado", section: "hero" })} className="inline-flex min-h-[44px] items-center font-semibold text-primary underline underline-offset-4">
            Consultar dados de mercado
          </Link>
        </p>
      </div>

      {/* Foto com marcas de corte e o carimbo de referência */}
      <figure className="relative m-0 min-w-0">
        <img
          src={sectionHeroStudio}
          alt="Interior de um studio para short stay em São Paulo"
          className="block aspect-[3/2] w-full rounded-[4px] object-cover object-[62%_50%] lg:aspect-[4/5]"
          loading="eager"
          // React 18 não reconhece fetchPriority (aviso no SSR); o atributo em minúsculas chega ao HTML.
          {...{ fetchpriority: "high" }}
          width={1280}
          height={720}
        />
        <span aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 border-l-[1.5px] border-t-[1.5px] border-card" />
        <span aria-hidden="true" className="absolute right-4 top-4 h-5 w-5 border-r-[1.5px] border-t-[1.5px] border-card" />
        <span aria-hidden="true" className="absolute bottom-4 right-4 hidden h-5 w-5 border-b-[1.5px] border-r-[1.5px] border-card lg:block" />
        <CarimboReferencia className="relative -mt-10 ml-4 mr-4 sm:ml-6 sm:w-[360px] lg:absolute lg:bottom-10 lg:-left-10 lg:m-0" />
      </figure>
    </section>
  );
}
