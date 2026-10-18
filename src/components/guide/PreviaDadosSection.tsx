import { Fragment, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import FonteBairro from "@/components/guide/FonteBairro";
import FaixaQuartis from "@/components/guide/FaixaQuartis";
import FonteLink from "@/components/guide/FonteLink";
import AvisoBase from "@/components/radar/AvisoBase";
import Segmentado from "@/components/radar/Segmentado";
import { Switch } from "@/components/ui/switch";
import { useBairroData } from "@/hooks/useBairroData";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { FONTE_BAIRROS_CURADOS, SAO_PAULO_REFERENCIA, rotuloOcupacao } from "@/data/bairrosCurados";
import { COLETA_GUESTFAVORITES, FONTES_GUIA } from "@/data/fontesGuia";
import { fmt } from "@/data/guide-data";
import { notaFontesComplementares } from "@/lib/radarBase";
import {
  CRITERIOS_RANKING, RECEITA_REFERENCIA_SP, avisoAmostraBairro, corEscalaReceita, descricaoNatureza, estiloMarcador, marcaNatureza, naturezaBairro, notaEstimativas, ordenarRanking, posicoesEsquema, type CriterioRanking,
} from "@/lib/radarUi";
import { formatBRL, formatPercent } from "@/lib/numberFormat";
import { slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * A home é pré-renderizada e hidratada: enquanto a base carrega, o ranking usa a
 * reserva offline (mesmos números aprovados) para o HTML do servidor e o da
 * hidratação baterem. O esqueleto de carregamento só aparece quando a página foi
 * montada direto no navegador (desenvolvimento ou navegação sem pré-renderização).
 */
// No servidor (pré-renderização) vale como pré-renderizada: o HTML sai com a lista, igual ao da hidratação.
const HOME_PRE_RENDERIZADA = typeof document === "undefined" || document.getElementById("root")?.getAttribute("data-ssr-path") === "/";

const linkMapa = (nome: string) => `/mapa?bairro=${encodeURIComponent(slugifyBairro(nome))}`;
const linkSimular = (nome: string) => `/projecao?bairro=${encodeURIComponent(slugifyBairro(nome))}`;

/** Rótulo e formato do valor exibido em cada critério do ranking. */
const VALOR_CRITERIO: Record<CriterioRanking, { titulo: string; descricao: string; formatar: (v: number) => string }> = {
  receita: { titulo: "Receita mensal de referência por bairro", descricao: "Diária média × 30 × ocupação média, antes de custos. Serve para comparar bairros; não é lucro nem garantia de resultado.", formatar: (v) => formatBRL(v) },
  diaria: { titulo: "Diária média por bairro", descricao: "Diária média (ADR) observada na coleta. Serve para comparar bairros; a receita depende também da ocupação.", formatar: (v) => formatBRL(v) },
  ocupacao: { titulo: "Ocupação média por bairro", descricao: "Ocupação média observada na coleta. Serve para comparar bairros; a receita depende também da diária.", formatar: (v) => formatPercent(v, 0) },
  anuncios: { titulo: "Anúncios ativos por bairro", descricao: "Tamanho da amostra na coleta (anúncios ativos). Mais anúncios = número mais confiável, não necessariamente melhor investimento.", formatar: (v) => (v > 0 ? formatDecimalInteiro(v) : "—") },
};
const formatDecimalInteiro = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

/**
 * 01 · Escolher o bairro: ranking em pirulito + mapa compacto. A pessoa escolhe o
 * critério (receita de referência por padrão), pode deixar só dados observados e
 * cada bairro tem a ação de simular. A maior receita bruta não é indicação de melhor
 * investimento: o texto diz isso e o comparador e o simulador fazem a conta.
 */
export default function PreviaDadosSection() {
  const { bairros, isLoading, offline, recarregar } = useBairroData();
  const [criterio, setCriterio] = useState<CriterioRanking>("receita");
  const [soObservados, setSoObservados] = useState(false);
  const ranking = useMemo(() => ordenarRanking(bairros, criterio, soObservados), [bairros, criterio, soObservados]);
  const maior = ranking[0]?.valor ?? 1;
  const valorCriterio = VALOR_CRITERIO[criterio];
  const posicoes = useMemo(() => posicoesEsquema(bairros.map((b) => b.name)), [bairros]);
  const nota = notaEstimativas(bairros);
  const fontesObservadas = [...new Set(bairros.filter((b) => naturezaBairro(b) === "observado").map((b) => (b.ocupacaoFonte === "airdna" ? "AirDNA" : "GuestFavorites")))].join(" e ");
  const temAproximacao = !soObservados && bairros.some((b) => naturezaBairro(b) === "aproximacao");
  const temEstimativa = !soObservados && bairros.some((b) => naturezaBairro(b) === "estimativa");
  const carregando = isLoading && !HOME_PRE_RENDERIZADA;
  const sp = SAO_PAULO_REFERENCIA;

  return (
    <section id="mapa-bairros" aria-labelledby="mapa-bairros-titulo" className="w-full scroll-mt-24 border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:px-10 lg:py-[72px]">
        <div className="min-w-0">
          <p className="rotulo-secao mb-2.5">01 · Escolher o bairro</p>
          <h2 id="mapa-bairros-titulo" className="mb-3 font-display text-[28px] font-bold leading-[1.15] text-foreground md:text-[36px]">{valorCriterio.titulo}</h2>
          <p className="mb-5 max-w-[620px] text-base leading-[1.55] text-muted-foreground">{valorCriterio.descricao}</p>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Segmentado valor={criterio} opcoes={CRITERIOS_RANKING} onChange={(v) => { setCriterio(v); trackGlobal("cta_clicked", { cta_id: "ranking_criterio", section: "home_previa", criterio: v }); }} rotulo="Ordenar o ranking por" className="w-full sm:w-auto" itemClassName="px-2.5 sm:px-3.5" />
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-foreground-medium">
              <Switch checked={soObservados} onCheckedChange={(v) => { setSoObservados(v); trackGlobal("cta_clicked", { cta_id: "ranking_so_observados", section: "home_previa", ativo: v }); }} aria-label="Só dados observados" />
              Só dados observados
            </label>
          </div>
          <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-foreground-medium">
            <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-escala-4" />Dado observado{fontesObservadas ? ` (${fontesObservadas})` : ""}</span>
            {temAproximacao && <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full border-[1.5px] border-dashed border-accent-text" />Aproximação pelo Itaim Bibi</span>}
            {temEstimativa && <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full border-[1.5px] border-dashed border-estimate" />Estimativa Bewild (sem fonte pública atualizada)</span>}
          </div>

          {offline && (
            <AvisoBase className="mb-4" onTentar={recarregar}>
              A base do Radar não respondeu. Mostrando a reserva offline (coleta de {COLETA_GUESTFAVORITES}).
            </AvisoBase>
          )}

          {carregando ? (
            <div aria-busy="true" aria-label="Carregando bairros" className="grid gap-2.5">
              {[92, 80, 74, 66, 60].map((w) => <div key={w} className="h-7 rounded-[4px] bg-secondary" style={{ width: `${w}%` }} />)}
            </div>
          ) : (
            <>
              {ranking.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nenhum bairro com dado observado na base agora.</p>}
              <ol className="m-0 list-none p-0" aria-label={`Bairros por ${valorCriterio.titulo.toLowerCase()}, do maior para o menor`}>
                {ranking.map(({ bairro: b, receita, valor }) => {
                  const natureza = naturezaBairro(b);
                  const aviso = avisoAmostraBairro(b);
                  const marca = marcaNatureza(b) ?? (aviso ? "amostra pequena" : null);
                  const largura = `${(maior > 0 ? (valor / maior) * 100 : 0).toFixed(1)}%`;
                  return (
                    <li key={b.name} className="flex items-stretch border-b border-trilho">
                      <Link
                        to={linkMapa(b.name)}
                        onClick={() => trackGlobal("cta_clicked", { cta_id: "ranking_bairro", section: "home_previa", bairro: b.name })}
                        aria-label={`${b.name}: ${valorCriterio.formatar(valor)}${criterio === "receita" ? " por mês" : ""}${descricaoNatureza(b)}${aviso ? `, ${aviso}` : ""}. Abrir no mapa`}
                        className="grid min-h-[44px] min-w-0 flex-1 grid-cols-[104px_minmax(0,1fr)_76px] items-center gap-3 px-1 text-left text-foreground transition-colors hover:bg-background sm:grid-cols-[150px_minmax(0,1fr)_92px] sm:gap-4 sm:px-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium sm:text-[15px]">{b.name}</span>
                          {marca && <span className={cn("block truncate text-[11px] leading-tight", natureza === "aproximacao" ? "text-accent-text" : "text-estimate-text")} title={aviso ?? undefined}>{marca}</span>}
                        </span>
                        <span className="relative h-3" aria-hidden="true">
                          <span
                            className={cn("absolute left-0 top-[5px] h-0.5", natureza === "estimativa" ? "bg-estimativa-tracejada" : natureza === "aproximacao" ? "bg-aproximacao-tracejada" : "bg-escala-2")}
                            style={{ width: largura }}
                          />
                          <span
                            className="absolute top-0 -ml-1.5 box-border h-3 w-3 rounded-full"
                            style={{
                              left: largura,
                              background: natureza === "observado" ? corEscalaReceita(receita) : "hsl(var(--card))",
                              border: natureza === "estimativa" ? "1.5px dashed hsl(var(--estimate))" : natureza === "aproximacao" ? "1.5px dashed hsl(var(--accent-text))" : "none",
                            }}
                          />
                        </span>
                        <span className="text-right text-sm font-semibold tabular-nums sm:text-[15px]" title={criterio === "receita" ? undefined : `Receita de referência: ${formatBRL(receita)}/mês`}>{valorCriterio.formatar(valor)}</span>
                      </Link>
                      <Link
                        to={linkSimular(b.name)}
                        onClick={() => trackGlobal("cta_clicked", { cta_id: "ranking_simular", section: "home_previa", bairro: b.name })}
                        aria-label={`Simular um studio em ${b.name}`}
                        className="flex min-h-[44px] shrink-0 items-center px-2 text-[13px] font-semibold text-primary underline-offset-4 hover:underline sm:px-3 sm:text-sm"
                      >
                        Simular
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-[13px] leading-normal text-muted-foreground">
                São Paulo, referência geral: {formatBRL(RECEITA_REFERENCIA_SP)}/mês ({formatBRL(sp.dailyAvg)} × 30 × {formatPercent(sp.avgOccupancy, 0)}).{nota ? ` ${nota}` : ""} A maior receita bruta não indica, sozinha, o melhor investimento: compare custos e capital necessário no <Link to="/comparar" className="font-medium text-primary underline underline-offset-4">comparador</Link> e no simulador.
              </p>
              <FonteLink fonte={{ ...FONTES_GUIA.guestfavoritesSP, title: `GuestFavorites · São Paulo · ${sp.period} · coleta de ${COLETA_GUESTFAVORITES}` }} />
            </>
          )}
        </div>

        <div className="min-w-0">
          <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Exploração por bairros</p>
          {/* No celular o esquema fica baixo e vira um atalho único para o mapa: os pontos não têm nome
              e ficariam pequenos para tocar, e o ranking acima já leva a cada bairro. Ali os pontos são só
              desenho (fora do teclado e do leitor de tela); a partir de 640px cada ponto volta a ser link. */}
          <div className="mapa-esquema relative h-[200px] overflow-hidden rounded-[4px] sm:h-[440px]" style={{ "--grade": "44px" } as CSSProperties}>
            {/* No celular os pontos ficam acima de uma faixa de 44px com o atalho e a legenda. */}
            <div className="absolute inset-x-0 bottom-11 top-0 sm:bottom-0">
              {bairros.map((b) => {
                const p = posicoes.get(b.name);
                if (!p) return null;
                const estilo = { left: `${p.x}%`, top: `${p.y}%`, ...estiloMarcador(b, 0.7) };
                return (
                  <Fragment key={b.name}>
                    <Link
                      to={linkMapa(b.name)}
                      aria-label={`${b.name}: diária ${formatBRL(b.dailyAvg)}, ocupação ${formatPercent(b.avgOccupancy, 0)}${descricaoNatureza(b)}${avisoAmostraBairro(b) ? `, ${avisoAmostraBairro(b)}` : ""}`}
                      title={b.name}
                      className="absolute box-border hidden -translate-x-1/2 -translate-y-1/2 rounded-full shadow-marcador transition-transform hover:scale-125 before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:content-[''] sm:block"
                      style={estilo}
                    />
                    <span aria-hidden="true" className="absolute box-border -translate-x-1/2 -translate-y-1/2 rounded-full shadow-marcador sm:hidden" style={estilo} />
                  </Fragment>
                );
              })}
            </div>
            <Link
              to="/mapa"
              onClick={() => trackGlobal("cta_clicked", { cta_id: "abrir_mapa_esquema", section: "home_previa" })}
              className="absolute inset-0 z-[1] flex items-end justify-start p-1.5 sm:hidden"
            >
              <span className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-card px-3 text-[13px] font-semibold text-primary shadow-marcador">
                Toque para abrir o mapa<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
            <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 text-xs text-muted-foreground sm:hidden">Esquema</span>
            <span className="absolute bottom-2.5 left-3 hidden text-xs text-muted-foreground sm:inline">Esquema · tamanho = anúncios na amostra</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="min-h-[44px] px-[18px] text-[15px] font-semibold">
              <Link to="/mapa" onClick={() => trackGlobal("cta_clicked", { cta_id: "abrir_mapa", section: "home_previa" })}>Abrir o mapa</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px] px-[18px] text-[15px] font-semibold">
              <Link to="/comparar" onClick={() => trackGlobal("cta_clicked", { cta_id: "comparar_bairros", section: "home_previa" })}>Comparar bairros</Link>
            </Button>
          </div>
        </div>

        {/* Todos os números por bairro, com quartis e fonte (mantém a tabela do guia indexável) */}
        <details className="group min-w-0 border-t border-border lg:col-span-2">
          <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 py-2 text-[15px] font-semibold text-primary [&::-webkit-details-marker]:hidden">
            Ver a tabela completa: diária, ocupação, quartis e fonte de cada bairro
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="min-w-0 overflow-hidden rounded-md border border-border">
            <table className="block w-full text-sm lg:table">
              <thead className="hidden bg-background lg:table-header-group">
                <tr>
                  {["Bairro", "Diária média (ADR)", "Ocupação média", "Diária: 25% mais baratos", "Diária: mediana", "Diária: 25% mais caros"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[13px] font-semibold text-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="block lg:table-row-group">
                {bairros.map((b) => (
                  <tr key={b.name} className="grid grid-cols-3 border-t border-border lg:table-row">
                    <td className="col-span-3 block px-4 py-3 font-medium text-foreground lg:table-cell">{b.name}<FonteBairro nome={b.name} /></td>
                    <td className="col-span-2 block px-4 py-3 tabular-nums text-foreground-medium lg:table-cell"><span className="block text-xs lg:hidden">Diária média (ADR)</span>R$ {fmt(b.dailyAvg)}</td>
                    <td className="block px-4 py-3 tabular-nums text-foreground-medium lg:table-cell"><span className="block text-xs lg:hidden">Ocupação média</span>{rotuloOcupacao(b)}</td>
                    <td className="col-span-3 px-4 pb-4 lg:hidden">{b.dailyQuartiles ? <FaixaQuartis quartis={b.dailyQuartiles} /> : <span className="text-xs text-muted-foreground">Sem quartis publicados para este bairro.</span>}</td>
                    <td className="hidden px-4 py-3 tabular-nums text-foreground-medium lg:table-cell">{b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[0])}` : "—"}</td>
                    <td className="hidden px-4 py-3 tabular-nums text-foreground-medium lg:table-cell">{b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[1])}` : "—"}</td>
                    <td className="hidden px-4 py-3 font-semibold tabular-nums text-foreground lg:table-cell">{b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[2])}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col gap-1 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{FONTE_BAIRROS_CURADOS} {notaFontesComplementares(bairros)}</p>
              <Link to="/comparar" className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-medium text-primary underline underline-offset-4">Comparar bairros lado a lado</Link>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
