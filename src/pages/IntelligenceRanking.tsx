import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CabecalhoTela, Container, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import { TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import MetadadosBase from "@/components/estudo/MetadadosBase";
import { NotaAmostra, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, FormulaReceita } from "@/components/estudo/Numeros";
import Segmentado from "@/components/radar/Segmentado";
import AvisoBase from "@/components/radar/AvisoBase";
import LinkArtigoBewild from "@/components/guide/LinkArtigoBewild";
import { ARTIGOS_BEWILD } from "@/data/artigosBewild";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { useBairroSelecionado } from "@/hooks/useBairroSelecionado";
import { useBairrosData, rotuloEstimativa } from "@/hooks/useIntelligenceData";
import { calculateInvestmentScore } from "@/lib/investmentScore";
import { definirBairroAtual } from "@/lib/bairroAtual";
import { contagemContra, receitaDe } from "@/lib/estudo";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { CRITERIOS_RANKING, naturezaBairro, ordenarRanking, type CriterioRanking } from "@/lib/radarUi";
import { bairroPath } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { BairroCurado } from "@/data/bairrosCurados";

/**
 * /ranking no redesign "Estudo aberto": Tab. 1 com os 28 bairros da base do Radar,
 * por critério (receita de referência, diária, ocupação, anúncios) e filtro de natureza
 * (todos ou só observados). Clicar abre o bairro. Os critérios internos da Bewild
 * (scores da estimativa de mercado — base 2025) seguem numa tabela recolhida.
 */
export default function IntelligenceRanking() {
  return (
    <BairroProvider>
      <PaginaEstudo>
        <Ranking />
      </PaginaEstudo>
    </BairroProvider>
  );
}

const UNIDADE: Record<CriterioRanking, string> = {
  receita: "Receita de referência (R$/mês)",
  diaria: "Diária média (R$)",
  ocupacao: "Ocupação média (%)",
  anuncios: "Anúncios na amostra (n)",
};

const TITULO_CRITERIO: Record<CriterioRanking, string> = {
  receita: "a maior receita de referência",
  diaria: "a maior diária média",
  ocupacao: "a maior ocupação média",
  anuncios: "a maior amostra de anúncios",
};

function formatar(valor: number, criterio: CriterioRanking) {
  if (criterio === "ocupacao") return `${formatDecimal(valor, 0)}%`;
  if (criterio === "anuncios") return formatDecimal(valor, 0);
  return formatBRL(valor);
}

function Ranking() {
  const { bairros, cidade, offline, recarregar } = useBaseEstudo();
  const { bairro: selecionado } = useBairroSelecionado(bairros, { naUrl: false });
  const navigate = useNavigate();
  const [criterio, setCriterio] = useState<CriterioRanking>("receita");
  const [filtro, setFiltro] = useState<"todos" | "observados">("todos");

  const linhas = useMemo(() => ordenarRanking(bairros, criterio, filtro === "observados"), [bairros, criterio, filtro]);
  // Anúncios: aproximações não têm contagem por bairro e ficam no fim, sem barra.
  const max = Math.max(...linhas.map((l) => l.valor), 1);
  const referenciaSP = criterio === "receita" ? receitaDe(cidade) : criterio === "diaria" ? cidade.dailyAvg : criterio === "ocupacao" ? cidade.avgOccupancy : null;
  const escala = Math.max(max, referenciaSP ?? 0);
  const primeiro = linhas[0];
  const abaixo = contagemContra(bairros, receitaDe, receitaDe(cidade));

  const abrir = (b: BairroCurado) => {
    definirBairroAtual(b.name);
    navigate(bairroPath(b.name));
  };

  return (
    <>
      <CabecalhoTela
        rotulo={`Ranking · ${bairros.length} bairros de São Paulo`}
        titulo={<>{abaixo.abaixo} de {abaixo.total} bairros ficam abaixo da receita de referência de São Paulo</>}
        lead={<>São Paulo: {formatBRL(receitaDe(cidade))} por mês ({formatBRL(cidade.dailyAvg)} × 30 × {formatDecimal(cidade.avgOccupancy, 0)}%). Ordene os bairros pelo critério que importa para a sua decisão e abra cada um para ver o detalhe.</>}
      >
        <MetadadosBase bairros={bairros} cidade={cidade} compacto />
      </CabecalhoTela>

      {offline && (
        <Container className="mb-6">
          <AvisoBase tom="aviso" onTentar={recarregar}>A base do Radar não respondeu agora. A tabela mostra a reserva aprovada (mesmos números da coleta de 18/10/2026).</AvisoBase>
        </Container>
      )}

      <Container>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:gap-10">
          <div className="min-w-0">
            <p className="e-rotulo mb-1.5">Critério</p>
            <Segmentado<CriterioRanking> rotulo="Critério de ordenação" valor={criterio} opcoes={CRITERIOS_RANKING} onChange={setCriterio} className="w-full max-w-[460px]" itemClassName="px-2.5 text-[15px]" />
          </div>
          <div className="min-w-0">
            <p className="e-rotulo mb-1.5">Dados</p>
            <Segmentado<"todos" | "observados">
              rotulo="Natureza do dado"
              valor={filtro}
              opcoes={[{ valor: "todos", rotulo: "Todos" }, { valor: "observados", rotulo: "Só observados" }]}
              onChange={setFiltro}
              className="w-full max-w-[300px]"
              itemClassName="px-2.5 text-[15px]"
            />
          </div>
        </div>

        <TabelaNumerada
          numero={1}
          titulo={primeiro ? <>{primeiro.bairro.name} tem {TITULO_CRITERIO[criterio]}: {formatar(primeiro.valor, criterio)}{criterio === "receita" ? " por mês" : ""}</> : "Nenhum bairro com esse filtro"}
          unidade={<>{UNIDADE[criterio]}. {linhas.length} bairros{filtro === "observados" ? ", só dados observados" : ""}.{referenciaSP != null && <> A linha vertical marca São Paulo ({formatar(referenciaSP, criterio)}).</>}</>}
          nota={
            <>
              <p>{TEXTO_APROXIMACAO} Aproximações não têm amostra própria: no critério “anúncios” ficam no fim, sem barra.</p>
              <p className="mt-1">Amostra pequena (menos de 200 anúncios) aparece em itálico: leia com cautela. Clique no nome para abrir o bairro.</p>
            </>
          }
        >
          <thead>
            <tr>
              <th scope="col" className={cn(TH, "w-10 text-right")}>Pos.</th>
              <th scope="col" className={TH}>Bairro</th>
              <th scope="col" className={cn(TH, "hidden w-[34%] md:table-cell")}><span className="sr-only">Barra</span></th>
              <th scope="col" className={cn(TH, "text-right")}>{criterio === "receita" ? "R$/mês" : criterio === "diaria" ? "R$" : criterio === "ocupacao" ? "%" : "n"}</th>
              <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}><span className="e-var normal-case">n</span></th>
              <th scope="col" className={cn(TH, "hidden lg:table-cell")}>Natureza</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => {
              const b = l.bairro;
              const sel = selecionado?.name === b.name;
              const aprox = naturezaBairro(b) !== "observado";
              const semBarra = criterio === "anuncios" && !b.activeListings;
              return (
                <tr key={b.name} className={cn("cursor-pointer transition-colors hover:bg-foreground/[0.03]", sel && "bg-magenta-100/60")} onClick={() => abrir(b)}>
                  <td className={cn(TD_NUM, "text-tinta-70")}>{i + 1}</td>
                  <td className={TD}>
                    <Link
                      to={bairroPath(b.name)}
                      onClick={(e) => { e.stopPropagation(); definirBairroAtual(b.name); }}
                      className={cn("inline-flex min-h-[28px] items-center font-semibold underline-offset-4 hover:underline", sel && "text-magenta-700")}
                    >
                      {b.name}
                    </Link>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 lg:hidden">
                      {aprox && <TagBairro b={b} />}
                      <NotaAmostra b={b} curta />
                    </span>
                    {sel && <span className="sr-only"> (bairro selecionado)</span>}
                  </td>
                  <td className={cn(TD, "hidden align-middle md:table-cell")}>
                    <div className="relative h-3" aria-hidden="true">
                      {!semBarra && (
                        <div
                          className={cn("absolute inset-y-0 left-0", aprox ? "border border-dashed border-neutro-600" : sel ? "bg-magenta" : "bg-ciano")}
                          style={{ width: `${(l.valor / escala) * 100}%` }}
                        />
                      )}
                      {referenciaSP != null && <div className="absolute -inset-y-1 w-px bg-foreground" style={{ left: `${(referenciaSP / escala) * 100}%` }} />}
                    </div>
                  </td>
                  <td className={cn(TD_NUM, "font-semibold")}>{semBarra ? "—" : formatar(l.valor, criterio)}</td>
                  <td className={cn(TD_NUM, "hidden text-tinta-78 sm:table-cell")}>
                    {b.activeListings != null ? formatDecimal(b.activeListings, 0) : "—"}
                  </td>
                  <td className={cn(TD, "hidden lg:table-cell")}>
                    <span className="flex flex-wrap items-center gap-2">
                      <TagBairro b={b} />
                      <NotaAmostra b={b} curta />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TabelaNumerada>
        <div className="mt-8 max-w-[720px]">
          {criterio === "receita" && <FormulaReceita />}
          <AvisoReceita className="mt-4" />
          <p className="mt-4 flex flex-wrap gap-x-6 text-[15px]">
            <a href="/dados/bairros.csv" download className="e-link inline-flex min-h-[44px] items-center">Baixar a base (CSV)</a>
            <Link to="/comparar" className="e-link inline-flex min-h-[44px] items-center">Comparar até três bairros</Link>
            <Link to="/metodologia" className="e-link inline-flex min-h-[44px] items-center">Metodologia</Link>
          </p>
          <LinkArtigoBewild artigo={ARTIGOS_BEWILD.melhoresBairros} prefixo="Quer a análise bairro a bairro? Leia" />
        </div>
      </Container>

      <Secao id="criterios-internos" rotulo="Critérios internos" titulo="Scores da Bewild, à parte da base" lead="Combinam a diária e a ocupação da base com preço do m², liquidez e crescimento de uma estimativa de mercado (base 2025). São critérios internos, não estatística de mercado, e cobrem só parte dos bairros.">
        <CriteriosInternos />
      </Secao>
    </>
  );
}

/** Tabela recolhida dos scores internos (bairro_airbnb_sp, estimativa de mercado — base 2025). */
function CriteriosInternos() {
  const { data, isLoading, isError, refetch } = useBairrosData();
  const todos = data ?? [];
  const scores = useMemo(() => new Map(todos.map((b) => [b.bairro, calculateInvestmentScore(b, todos)])), [todos]);
  const ordenados = [...todos].sort((a, b) => (scores.get(b.bairro)?.score ?? 0) - (scores.get(a.bairro)?.score ?? 0));
  return (
    <details className="group e-fina border-y">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
        Ver a tabela de critérios internos
        <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-6">
        {isLoading && <p className="e-apoio py-4" aria-busy="true">Carregando os critérios internos…</p>}
        {isError && <AvisoBase onTentar={() => void refetch()}>Os critérios internos não carregaram agora.</AvisoBase>}
        {!isLoading && !isError && !ordenados.length && <p className="e-apoio py-4">Não há critérios internos para mostrar.</p>}
        {ordenados.length > 0 && (
          <TabelaNumerada
            numero={2}
            titulo="Score de investimento (0–10) e seus pilares"
            unidade={`Critério interno. ${rotuloEstimativa(ordenados[0])}.`}
          >
            <thead>
              <tr>
                <th scope="col" className={TH}>Bairro</th>
                <th scope="col" className={cn(TH, "text-right")}>Score</th>
                <th scope="col" className={cn(TH, "text-right")}>Rentab.</th>
                <th scope="col" className={cn(TH, "text-right")}>Liquidez</th>
                <th scope="col" className={cn(TH, "text-right")}>Cresc.</th>
                <th scope="col" className={TH}>Confiança</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((b) => (
                <tr key={b.bairro}>
                  <td className={TD}><Link to={bairroPath(b.bairro)} className="e-link">{b.bairro}</Link></td>
                  <td className={cn(TD_NUM, "font-semibold")}>{formatDecimal(scores.get(b.bairro)?.score ?? 0, 1)}</td>
                  <td className={TD_NUM}>{formatDecimal(b.score_rentabilidade, 1)}</td>
                  <td className={TD_NUM}>{formatDecimal(b.score_liquidez, 1)}</td>
                  <td className={TD_NUM}>{formatDecimal(b.score_crescimento_potencial, 1)}</td>
                  <td className={TD}>{b.nivel_confianca_dados === "alto" ? "Alta" : b.nivel_confianca_dados === "medio" ? "Média" : "Baixa"}</td>
                </tr>
              ))}
            </tbody>
          </TabelaNumerada>
        )}
      </div>
    </details>
  );
}
