import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Seo } from "@/components/RouteSeo";
import NovaAba from "@/components/NovaAba";
import { CabecalhoTela, ColunasComPainel, Container, GrupoCartoes, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import { Figura, TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import Metadados, { type ItemMetadado } from "@/components/estudo/Metadados";
import { NotaAmostra, Tag, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, Diferenca, FormulaReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import NestaPagina from "@/components/estudo/NestaPagina";
import SeletorBairro from "@/components/estudo/SeletorBairro";
import FaixaPosicao from "@/components/estudo/graficos/FaixaPosicao";
import { LegendaPontos } from "@/components/estudo/graficos/LegendaPontos";
import AvisoBase from "@/components/radar/AvisoBase";
import HistoricoBairro from "@/components/guide/HistoricoBairro";
import { VariacaoColetaBairro } from "@/components/guide/VariacaoColeta";
import LinkArtigoBewild from "@/components/guide/LinkArtigoBewild";
import FaixaQuartisBairro from "@/components/intelligence/FaixaQuartisBairro";
import BlocoReformaBairro from "@/components/intelligence/BlocoReformaBairro";
import ProximoPassoBairro from "@/components/intelligence/ProximoPassoBairro";
import EventosDoBairro from "@/components/intelligence/EventosDoBairro";
import BairroSomenteRadar from "@/components/intelligence/BairroSomenteRadar";
import EstimativaBairro from "@/components/intelligence/EstimativaBairro";
import PrecoImovelBairro from "@/components/intelligence/PrecoImovelBairro";
import OrcamentoButton from "@/components/OrcamentoButton";
import { useMomento } from "@/lib/momento";
import PedidoMaterial from "@/components/captacao/PedidoMaterial";
import { Button } from "@/components/ui/button";
import { ARTIGOS_BEWILD } from "@/data/artigosBewild";
import { ROTULO_ESTIMATIVA_MERCADO } from "@/data/bairrosCurados";
import { linkProjecaoBairro } from "@/data/navegacao";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { useBairroDetail, useBairrosData } from "@/hooks/useIntelligenceData";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { definirBairroAtual } from "@/lib/bairroAtual";
import { caminhoComparar } from "@/lib/comparar";
import { difPercentual, receitaDe, temAmostraPequena } from "@/lib/estudo";
import { frasePosicao, fraseContraSP, linhasDre, posicaoComEmpate, textoPosicao } from "@/lib/estudoMercado";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { rotuloReferenciaBewild } from "@/lib/radarBase";
import { ajusteManual, bairrosNaFrase, fonteCurtaBairro, naturezaBairro, type BairroBase } from "@/lib/radarUi";
import { bairroDescription, bairroPath, bairroTitle, SEO_BAIRROS, slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * /bairro/:bairro no redesign "Estudo aberto": o bairro contra São Paulo e contra os
 * outros bairros da base do Radar. Cabeçalho com seletor (trocar navega para o outro
 * bairro), resumo (% contra SP e posição), 4 indicadores com os quartis, Fig. 1 (posição
 * entre os bairros em diária e ocupação), Tab. 1 (fórmula e DRE do guia até o resultado
 * líquido, cada linha uma hipótese) e os botões Simular e Comparar. Depois: histórico de
 * coletas, reforma no bairro, próximo passo e, recolhidos, os critérios internos da
 * estimativa de mercado — base 2025 (só para bairros com essa base; os demais mostram
 * BairroSomenteRadar). Pré-renderizada como HTML estático e substituída ao abrir.
 */
export default function IntelligenceBairroDetail() {
  return (
    <BairroProvider>
      <PaginaEstudo>
        <PaginaBairro />
      </PaginaEstudo>
    </BairroProvider>
  );
}

const pct = (v: number) => `${formatDecimal(v, 0)}%`;

function PaginaBairro() {
  const { bairro: rawParam = "" } = useParams<{ bairro: string }>();
  const { search, hash } = useLocation();
  const navigate = useNavigate();
  let decoded = rawParam;
  try { decoded = decodeURIComponent(rawParam); } catch { /* valor bruto */ }
  const slug = slugifyBairro(decoded);

  const { bairros, cidade, offline, recarregar } = useBaseEstudo();
  const estimativas = useBairrosData();
  const b = bairros.find((x) => slugifyBairro(x.name) === slug) as BairroBase | undefined;
  // Nome exato: base do Radar, lista estática de SEO ou estimativa de mercado (base 2025).
  const nome =
    b?.name ??
    SEO_BAIRROS.find((n) => slugifyBairro(n) === slug) ??
    estimativas.data?.find((x) => slugifyBairro(x.bairro) === slug)?.bairro ??
    "";
  const estimativa = useBairroDetail(nome);

  // Lembra o último bairro visto (só no navegador), para as outras telas.
  useEffect(() => { if (nome) definirBairroAtual(nome); }, [nome]);

  const seoNome = nome || decoded;
  const seoHead = <Seo title={bairroTitle(seoNome)} description={bairroDescription(seoNome)} path={`/bairro/${slug}`} />;

  // Formato antigo (com acento/maiúsculas/espaços) → slug canônico.
  if (rawParam !== slug) return <Navigate to={`/bairro/${slug}${search}${hash}`} replace />;

  if (!nome && estimativas.isLoading) {
    return <>{seoHead}<Container className="py-16"><p className="e-apoio" aria-busy="true">Carregando o bairro…</p></Container></>;
  }

  if (!nome) {
    return (
      <>
        <Seo title="Bairro não encontrado | Radar Bewild" description="Bairro não encontrado." path={`/bairro/${slug}`} noindex />
        <CabecalhoTela rotulo="Bairro" titulo="Não há dados deste bairro no Radar" lead="Confira os bairros com dados no ranking ou no mapa. Se você já tem um imóvel nesse endereço, a Bewild pode orçar a reforma.">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold"><Link to="/ranking">Ver o ranking de bairros</Link></Button>
            <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold"><Link to="/mapa">Abrir o mapa</Link></Button>
            <OrcamentoButton local="bairro" variant="ghost" className="min-h-[44px] px-5 text-[15px] font-semibold" />
          </div>
        </CabecalhoTela>
      </>
    );
  }

  const trocar = (outro: string) => {
    definirBairroAtual(outro);
    trackGlobal("cta_clicked", { cta_id: "bairro_seletor", section: "bairro", bairro: outro });
    navigate(bairroPath(outro));
  };

  const seletor = (
    <SeletorBairro
      rotulo="Trocar de bairro"
      bairros={bairros}
      valor={b ? b.name : null}
      incluirVazio={b ? undefined : "Escolher bairro"}
      onChange={trocar}
    />
  );

  // A lista da estimativa de mercado carregou e não tem este bairro: página só com a base do Radar.
  const semEstimativa = Boolean(estimativas.data && !estimativas.data.some((x) => slugifyBairro(x.bairro) === slug));
  const criterios = (
    <Secao recolhida resumo="Scores da Bewild, à parte da base" id="criterios-internos" rotulo="Critérios internos" titulo="Scores da Bewild, à parte da base" lead={`Combinam a diária e a ocupação com preço do m², liquidez e crescimento da ${ROTULO_ESTIMATIVA_MERCADO.toLowerCase()}. São critérios internos, não estatística de mercado.`}>
      {estimativa.data ? (
        <details className="group e-fina border-y">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            Ver os critérios internos de {nome}
            <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
          </summary>
          <div className="pb-8 pt-4">
            <EstimativaBairro b={estimativa.data} todos={estimativas.data ?? [estimativa.data]} numeroInicial={2} />
          </div>
        </details>
      ) : semEstimativa ? (
        <BairroSomenteRadar nome={nome} />
      ) : estimativa.isError || estimativas.isError ? (
        <AvisoBase onTentar={() => { void estimativa.refetch(); void estimativas.refetch(); }}>Os critérios internos de {nome} não carregaram agora. Os números da base do Radar acima não foram afetados.</AvisoBase>
      ) : (
        <p className="e-apoio" aria-busy="true">Carregando os critérios internos…</p>
      )}
    </Secao>
  );
  const precoImovel = <Secao recolhida resumo="Preço médio por m² no bairro" id="preco-imovel" rotulo="Compra" titulo={`Preço médio por m² em ${nome}`}><PrecoImovelBairro bairro={nome} /></Secao>;

  // Bairro sem dado na base do Radar (ex.: só na lista de SEO): não publicamos números sem fonte.
  if (!b) {
    return (
      <>
        {seoHead}
        <CabecalhoTela rotulo="Bairro · São Paulo" titulo={nome} acao={seletor} lead={<>Ainda não há dado público de diária e ocupação para {nome} na base do Radar. Não publicamos números sem fonte.</>}>
          <p className="flex flex-wrap gap-x-6 text-[15px]">
            <Link to="/ranking" className="e-link inline-flex min-h-[44px] items-center">Ver os {bairros.length} bairros da base</Link>
            <Link to="/mapa" className="e-link inline-flex min-h-[44px] items-center">Abrir o mapa</Link>
          </p>
        </CabecalhoTela>
        <ChecklistCompra bairro={nome} />
        <Secao id="proximo-passo" rotulo="Próximo passo">
          <div className="space-y-10">
            <ProximoPassoBairro bairro={nome} />
            <BlocoReformaBairro bairro={nome} />
          </div>
        </Secao>
        {criterios}
        {precoImovel}
      </>
    );
  }

  const receita = receitaDe(b);
  const receitaSP = receitaDe(cidade);
  const dif = difPercentual(receita, receitaSP);
  const posReceita = posicaoComEmpate(bairros, b.name, "receita");
  const posDiaria = posicaoComEmpate(bairros, b.name, "diaria");
  const posOcupacao = posicaoComEmpate(bairros, b.name, "ocupacao");
  const natureza = naturezaBairro(b);
  const aproximacao = natureza === "aproximacao";
  const ajuste = ajusteManual(b);
  const itaim = bairros.find((x) => x.name === "Itaim Bibi");
  const dre = linhasDre(receita);
  const linkSimular = linkProjecaoBairro(slug);
  const linkComparar = caminhoComparar([slug]);
  const total = bairros.length;
  const deNome = bairrosNaFrase([b.name], "de");
  const dataColeta = b.coletadoEm ? b.coletadoEm.slice(0, 10).split("-").reverse().join("/") : null;

  const metadados: ItemMetadado[] = [
    {
      rotulo: "Fonte",
      valor: b.sourceUrl
        ? <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" className="e-link">{fonteCurtaBairro(b).split(" · ")[0]}<NovaAba /></a>
        : fonteCurtaBairro(b),
    },
    { rotulo: "Período", valor: b.period ?? "sem período publicado" },
    { rotulo: "Coleta", valor: dataColeta ?? "sem data registrada" },
    {
      rotulo: "Amostra",
      valor: b.activeListings != null
        ? <>{formatDecimal(b.activeListings, 0)} anúncios</>
        : aproximacao ? "sem contagem por bairro" : "sem amostra publicada",
    },
  ];

  const tituloPosicao = posReceita
    ? <>{b.name} é {frasePosicao(posReceita)} em receita de referência entre os {total} bairros</>
    : <>Posição de {b.name} entre os {total} bairros</>;

  return (
    <>
      {seoHead}
      <CabecalhoTela
        rotulo="Bairro · São Paulo"
        titulo={b.name}
        acao={seletor}
        lead={<>Receita de referência de {formatBRL(receita)} por mês, antes de custos: {fraseContraSP(dif)}.{posReceita && <> É {frasePosicao(posReceita)} entre os {total} bairros da base.</>}</>}
      >
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <TagBairro b={b} />
          <NotaAmostra b={b} />
          {aproximacao && <span className="e-legenda">{TEXTO_APROXIMACAO}</span>}
          {ajuste && <span className="e-legenda">Diária e ocupação com ajuste manual da Bewild sobre a base; sem quartis nem período publicados.</span>}
        </p>
        {/* Indicadores no cabeçalho (17/11/2026): a primeira tela já mostra diária, ocupação, receita e anúncios. A natureza do dado e o aviso de amostra vêm antes dos números. */}
        <div id="indicadores" className="mb-6 scroll-mt-20 border-t border-foreground pt-5">
          <GradeIndicadores className="max-[359px]:grid-cols-1">
            <Indicador rotulo="Diária média (R$)" valor={formatBRL(b.dailyAvg)} nota={<><Diferenca valor={b.dailyAvg - cidade.dailyAvg} /> contra São Paulo ({formatBRL(cidade.dailyAvg)})</>} />
            <Indicador rotulo="Ocupação média (%)" valor={pct(b.avgOccupancy)} nota={<><Diferenca valor={b.avgOccupancy - cidade.avgOccupancy} formato="pp" /> contra São Paulo ({pct(cidade.avgOccupancy)})</>} />
            <Indicador rotulo="Receita de referência (R$/mês)" valor={formatBRL(receita)} nota={<><Diferenca valor={dif} formato="pct" /> contra São Paulo ({formatBRL(receitaSP)})</>} />
            <Indicador
              rotulo="Anúncios (n)"
              valor={b.activeListings != null ? formatDecimal(b.activeListings, 0) : "—"}
              nota={
                b.activeListings != null
                  ? temAmostraPequena(b) ? <span className="e-amostra">Amostra pequena: leia com cautela</span> : "Anúncios ativos na amostra"
                  : aproximacao && itaim?.activeListings != null
                    ? <>Sem contagem por bairro; o distrito Itaim Bibi tem {formatDecimal(itaim.activeListings, 0)}</>
                    : "Sem contagem publicada"
              }
            />
          </GradeIndicadores>
        </div>
        <Metadados itens={metadados} compacto />
        {aproximacao && b.referenciaBewild && (
          <p className="e-legenda mt-4 max-w-[720px]">Referência extra, fora das contas: {rotuloReferenciaBewild(b.referenciaBewild)}.</p>
        )}
      </CabecalhoTela>
      <NestaPagina />

      {offline && (
        <Container className="mb-6">
          <AvisoBase tom="aviso" onTentar={recarregar}>A base do Radar não respondeu agora. Os números são da reserva aprovada (mesma coleta).</AvisoBase>
        </Container>
      )}

      <ColunasComPainel
        rotuloPainel={`${b.name} em resumo`}
        painel={
          <div className="rounded-b-lg border border-t-[3px] border-border border-t-primary bg-card p-5">
            <p className="e-rotulo">{b.name} em resumo</p>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="e-legenda">Receita de referência (R$/mês)</dt>
                <dd className="m-0"><span className="e-numero-sm block">{formatBRL(receita)}</span><TagBairro b={b} /></dd>
              </div>
              <div className="border-t border-border pt-4">
                <dt className="e-legenda">Resultado líquido de referência (R$/mês)</dt>
                <dd className="m-0"><span className={cn("e-numero-sm block", dre.liquido < 0 && "e-negativo")}>{formatBRL(dre.liquido)}</span><Tag tipo="hipotese">Simulação · hipótese</Tag></dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-3">
              <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold">
                <Link to={linkSimular} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "bairro_painel", bairro: b.name })}>Simular este bairro</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold">
                <Link to={linkComparar} onClick={() => trackGlobal("cta_clicked", { cta_id: "comparar_bairro", section: "bairro_painel", bairro: b.name })}>Comparar com outros bairros</Link>
              </Button>
            </div>
            <p className="mt-5 border-t border-border pt-4 text-[15px]">
              <span className="e-legenda block">Já tem o imóvel e quer planejar a reforma?</span>
              <OrcamentoButton local="bairro" variant="link" contexto={{ bairro: b.name }} className="min-h-[44px] px-0 text-[15px]" />
            </p>
            <AvisoReceita className="mt-2" />
          </div>
        }
      >
      <Secao
        id="conta"
        rotulo="Conta"
        titulo={<>Da receita de referência ao resultado líquido: {formatBRL(dre.liquido)} por mês com as hipóteses do guia</>}
        lead="A receita sai da base; os custos são hipóteses editáveis do guia, não estatística de mercado. Ajuste cada uma no simulador."
      >
        <div>
          <div className="overflow-x-auto">
            <FormulaReceita diaria={b.dailyAvg} ocupacaoPct={b.avgOccupancy} receita={receita} />
          </div>
          {/* Desktop: a tabela fica ao lado dos quartis da diária. */}
          <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start lg:gap-10">
          <TabelaNumerada
            numero={1}
            titulo={<>Resultado líquido de referência {deNome}</>}
            unidade={<>R$ por mês. Percentuais sobre a receita bruta; condomínio + IPTU e contas em reais.<span className="hidden lg:inline"> Todas as linhas de custo: <Tag tipo="hipotese" /></span></>}
            nota={<p>Valores em reais do exemplo do guia. Rentabilidade e prazo de retorno dependem do preço do imóvel e da reforma: calcule no simulador.</p>}
          >
            <thead>
              <tr>
                <th scope="col" className={TH}>Linha</th>
                <th scope="col" className={cn(TH, "hidden sm:table-cell")}>Base</th>
                <th scope="col" className={cn(TH, "text-right")}>R$/mês</th>
                <th scope="col" className={cn(TH, "hidden md:max-lg:table-cell")}>Natureza</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={cn(TD, "font-semibold")}>Receita de referência<span className="e-legenda block font-normal"><var className="e-var">R</var> = <var className="e-var">d</var> × 30 × <var className="e-var">o</var></span></th>
                <td className={cn(TD, "hidden sm:table-cell text-tinta-78")}>Base do Radar</td>
                <td className={cn(TD_NUM, "whitespace-nowrap font-semibold")}>{formatBRL(receita)}</td>
                <td className={cn(TD, "hidden md:max-lg:table-cell")}><TagBairro b={b} /></td>
              </tr>
              <LinhasCusto linhas={dre.linhas} total={receita - dre.liquido} />
              <tr>
                <th scope="row" className="border-t border-foreground py-3 pr-2 text-left font-semibold">Resultado líquido de referência</th>
                <td className="hidden border-t border-foreground sm:table-cell" />
                <td className={cn("whitespace-nowrap border-t border-foreground py-3 text-right font-semibold tabular-nums", dre.liquido < 0 && "e-negativo")}>{formatBRL(dre.liquido)}</td>
                <td className="hidden border-t border-foreground md:max-lg:table-cell" />
              </tr>
            </tbody>
          </TabelaNumerada>
          <FaixaQuartisBairro bairro={b.name} className="mt-8 lg:mt-0" />
          </div>
          <AvisoReceita className="mt-6" />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:hidden">
            <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold">
              <Link to={linkSimular} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "bairro_conta", bairro: b.name })}>Simular este bairro</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold">
              <Link to={linkComparar} onClick={() => trackGlobal("cta_clicked", { cta_id: "comparar_bairro", section: "bairro_conta", bairro: b.name })}>Comparar com outros bairros</Link>
            </Button>
          </div>
        </div>
      </Secao>

      <Secao
        recolhida
        resumo="Receita, diária e ocupação contra os outros bairros"
        id="posicao"
        rotulo={`Posição entre os ${total}`}
        titulo={tituloPosicao}
        lead={aproximacao ? <>Com os números do Itaim Bibi (aproximação), {b.name} empata com o distrito e com os outros bairros aproximados.</> : undefined}
      >
        <GradeIndicadores className="mb-12">
          <Indicador pequeno rotulo="Receita contra São Paulo (%)" valor={<Diferenca valor={dif} formato="pct" />} nota={fraseContraSP(dif)} />
          {posReceita && <Indicador pequeno rotulo={`Posição em receita (de ${total})`} valor={textoPosicao(posReceita)} nota={posReceita.empatados.length ? <>Empate com {posReceita.empatados.join(", ")}</> : "Maior receita = 1º"} />}
          {posDiaria && <Indicador pequeno rotulo={`Posição em diária (de ${total})`} valor={textoPosicao(posDiaria)} nota={posDiaria.empatados.length ? <>Empate com {posDiaria.empatados.join(", ")}</> : "Maior diária = 1º"} />}
          {posOcupacao && <Indicador pequeno rotulo={`Posição em ocupação (de ${total})`} valor={textoPosicao(posOcupacao)} nota={posOcupacao.empatados.length ? <>Empate com {posOcupacao.empatados.join(", ")}</> : "Maior ocupação = 1º"} />}
        </GradeIndicadores>

        <Figura
          numero={1}
          titulo={<>Onde {b.name} fica entre os {total} bairros em diária e em ocupação</>}
          unidade={<>Cada ponto é um bairro; a linha tracejada marca São Paulo. Toque num ponto para abrir o bairro.</>}
          legenda={
            <>
              <LegendaPontos bairros={bairros} selecionado={b.name} referencia={<>São Paulo: {formatBRL(cidade.dailyAvg)} de diária e {pct(cidade.avgOccupancy)} de ocupação</>} />
              <p className="mt-3">{TEXTO_APROXIMACAO}</p>
            </>
          }
          fonte={<>GuestFavorites, {b.period ?? cidade.period}. Cálculo do Radar Bewild.</>}
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
            <FaixaPosicao
              titulo="Diária média"
              unidade="R$ por noite"
              bairros={bairros}
              valor={(x) => x.dailyAvg}
              formatar={formatBRL}
              passo={50}
              referencia={{ valor: cidade.dailyAvg, rotulo: `SP ${formatBRL(cidade.dailyAvg)}` }}
              selecionado={b.name}
              hrefDe={(x) => bairroPath(x.name)}
              aoAbrir={(x) => definirBairroAtual(x.name)}
            />
            <FaixaPosicao
              titulo="Ocupação média"
              unidade="% das noites"
              bairros={bairros}
              valor={(x) => x.avgOccupancy}
              formatar={pct}
              passo={2}
              referencia={{ valor: cidade.avgOccupancy, rotulo: `SP ${pct(cidade.avgOccupancy)}` }}
              selecionado={b.name}
              hrefDe={(x) => bairroPath(x.name)}
              aoAbrir={(x) => definirBairroAtual(x.name)}
            />
          </div>
        </Figura>
        <p className="mt-6 flex flex-wrap gap-x-6 text-[15px]">
          <Link to="/ranking" className="e-link inline-flex min-h-[44px] items-center">Ver o ranking completo</Link>
          <Link to="/mercado" className="e-link inline-flex min-h-[44px] items-center">Ver o mercado</Link>
          <Link to={`/mapa?bairro=${slug}`} className="e-link inline-flex min-h-[44px] items-center">Ver no mapa</Link>
        </p>
      </Secao>

      <EventosDoBairro bairro={b.name} />

      <Secao id="proximo-passo" rotulo="Próximo passo">
        <div className="space-y-10">
          <ProximoPassoBairro bairro={b.name} comPainel />
          <BlocoReformaBairro bairro={b.name} />
          <LinkArtigoBewild artigo={ARTIGOS_BEWILD.melhoresBairros} prefixo="Quer a análise bairro a bairro? Leia" className="e-apoio" />
        </div>
      </Secao>

      {/* Desktop: três cartões lado a lado, que abrem no lugar; no celular, três linhas de toque. */}
      <GrupoCartoes rotulo="Compra e histórico">
        {precoImovel}
        <HistoricoBairro
          bairro={b.name}
          moldura={(historico) => (
            <Secao recolhida resumo="Cada coleta, com data, período e fonte" id="historico" rotulo="Histórico" titulo="Cada coleta fica registrada, com data, período e fonte" lead="Bairros com ajuste manual não mostram histórico, para o bairro ter um número só.">
              <SemCaixa>
                <VariacaoColetaBairro bairro={b.name} className="mb-8 border-0 bg-transparent p-0" />
              </SemCaixa>
              {historico}
              <Link to="/metodologia" className="e-link mt-2 inline-flex min-h-[44px] items-center text-[15px]">Registro de atualizações na metodologia</Link>
            </Secao>
          )}
        />
        {criterios}
      </GrupoCartoes>

      {/* O formulário do checklist fica no fim: no meio da página ele interrompia a leitura. */}
      <ChecklistCompra bairro={b.name} />

      <div className="px-4 pb-4 sm:px-6 lg:px-0">
        <AvisoReceita />
      </div>
      </ColunasComPainel>
    </>
  );
}

/**
 * Linhas de custo da Tab. 1. No celular ficam numa linha só ("Custos", com o total) que
 * abre com um toque (páginas curtas, 16/11/2026); a partir de sm aparecem todas, como sempre.
 */
function LinhasCusto({ linhas, total }: { linhas: ReturnType<typeof linhasDre>["linhas"]; total: number }) {
  const [abertas, setAbertas] = useState(false);
  return (
    <>
      <tr className="sm:hidden">
        <th scope="row" className={cn(TD, "font-normal")}>
          <button
            type="button"
            aria-expanded={abertas}
            onClick={() => { if (!abertas) trackGlobal("cta_clicked", { cta_id: "abrir_custos_bairro", section: "recolhivel" }); setAbertas(!abertas); }}
            className="e-recolhe-botao flex min-h-[44px] w-full flex-col items-start justify-center text-left"
          >
            <span className="e-link font-semibold">{abertas ? "Fechar os custos" : `Custos: ver as ${linhas.length} linhas`}</span>
            <span className="mt-1 block"><Tag tipo="hipotese" /></span>
          </button>
        </th>
        <td className={cn(TD_NUM, "whitespace-nowrap")}>{formatBRL(-total)}</td>
      </tr>
      {linhas.map((l) => (
        <tr key={l.chave} className={cn("e-recolhe-linha", !abertas && "hidden sm:table-row")}>
          <th scope="row" className={cn(TD, "font-normal")}>
            {l.rotulo}
            {/* Desktop: uma linha por custo; a explicação de cada um fica entre 640 e 1023px e no simulador. */}
            <span className="e-legenda block"><span className="lg:hidden">{l.nota}</span><span className="sm:hidden"> · {l.base.tipo === "pct" ? `${formatDecimal(l.base.pct, 0)}% da receita` : "valor em R$"}</span></span>
            <span className="mt-1 hidden sm:block md:hidden"><Tag tipo="hipotese" /></span>
          </th>
          <td className={cn(TD, "hidden whitespace-nowrap tabular-nums text-tinta-78 sm:table-cell")}>
            {l.base.tipo === "pct" ? `${formatDecimal(l.base.pct, 0)}% da receita` : "valor em R$"}
          </td>
          <td className={cn(TD_NUM, "whitespace-nowrap")}>{formatBRL(-l.valor)}</td>
          <td className={cn(TD, "hidden md:max-lg:table-cell")}><Tag tipo="hipotese" /></td>
        </tr>
      ))}
    </>
  );
}

/** Contêiner neutro para componentes compartilhados que ainda trazem moldura própria. */
function SemCaixa({ children }: { children: ReactNode }) {
  return <div className="[&_section]:rounded-none [&_section]:border-0 [&_section]:bg-transparent [&_section]:p-0">{children}</div>;
}

/**
 * Oferta do checklist de compra na página do bairro: vem depois da conta e da posição
 * (a pessoa vê primeiro o que o Radar entrega) e só para quem está comprando ou ainda
 * não escolheu a etapa; quem já tem o imóvel não recebe "antes de comprar".
 * A etapa é lida depois da montagem (momento.ts).
 */
function ChecklistCompra({ bairro }: { bairro: string }) {
  const momento = useMomento();
  if (momento && momento !== "procurando") return null;
  return (
    <Secao recolhida resumo="Checklist de compra, por e-mail" id="checklist-compra" rotulo="Antes de comprar">
      <PedidoMaterial material="checklist_compra" origem="bairro" bairro={bairro} />
    </Secao>
  );
}
