import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Copy, Share2 } from "lucide-react";
import OrcamentoButton from "@/components/OrcamentoButton";
import NovaAba from "@/components/NovaAba";
import { VariacaoColetaBairro, useVariacoesVisiveis } from "@/components/guide/VariacaoColeta";
import { CabecalhoTela, Container, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import { Figura, TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import { NotaAmostra, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, FormulaReceita } from "@/components/estudo/Numeros";
import SeletorBairro from "@/components/estudo/SeletorBairro";
import FaixasDiaria, { LegendaFaixas } from "@/components/estudo/graficos/FaixasDiaria";
import AvisoBase from "@/components/radar/AvisoBase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { useBairroSelecionado } from "@/hooks/useBairroSelecionado";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";
import type { BairroItem } from "@/data/guide-data";
import { linkProjecaoBairro } from "@/data/navegacao";
import { periodoPrincipal, receitaDe, resumoColetas, temAmostraPequena } from "@/lib/estudo";
import { achadoComparacao, faixaMaisLarga, trocarNaComparacao, vizinhosMaisProximos } from "@/lib/estudoMapa";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { rotuloReferenciaBewild } from "@/lib/radarBase";
import { bairrosNaFrase, diferencasAteOMaior, fonteCurtaBairro, marcaNatureza, naturezaBairro, textoSemQuartis, type BairroBase } from "@/lib/radarUi";
import { bairroPath, slugifyBairro } from "@/lib/seo";
import { MAX_COMPARAR, caminhoComparar, lerComparar } from "@/lib/comparar";
import { cn } from "@/lib/utils";

/**
 * /comparar no redesign "Estudo aberto": até 3 bairros lado a lado com os números
 * da base aprovada. Tab. 1 com 8 linhas (diária, quartis, ocupação, receita de
 * referência, amostra e natureza/fonte), o maior valor de cada linha em negrito e a
 * diferença até ele; Fig. 1 com as faixas de diária no mesmo eixo (R$ 0 a 600).
 * A seleção vive na URL (?b=slug,slug) para ser compartilhada.
 */
export default function CompararBairros() {
  return (
    <BairroProvider>
      <PaginaEstudo>
        <Comparar />
      </PaginaEstudo>
    </BairroProvider>
  );
}

type Linha = {
  rotulo: string;
  unidade: string;
  valor: (b: BairroItem) => number | null;
  texto: (v: number | null) => string;
  /** Diferença até o maior da linha, por extenso (`de`/`que` vêm de bairrosNaFrase). */
  diferenca: (d: number, de: string, que: string) => string;
  /** Diferença curta, com sinal (celular). */
  curta: (d: number) => string;
};

const quartil = (i: 0 | 1 | 2) => (b: BairroItem) => b.dailyQuartiles?.[i] ?? null;
const reais = (v: number | null) => (v == null ? "—" : formatBRL(v));
const abaixoEmReais = (d: number, de: string) => `${formatBRL(d)} abaixo ${de}`;

const LINHAS: Linha[] = [
  { rotulo: "Diária média", unidade: "R$", valor: (b) => b.dailyAvg, texto: reais, diferenca: abaixoEmReais, curta: (d) => formatBRL(-d) },
  { rotulo: "P25 da diária", unidade: "R$ · 25% mais baratos", valor: quartil(0), texto: reais, diferenca: abaixoEmReais, curta: (d) => formatBRL(-d) },
  { rotulo: "Mediana da diária", unidade: "R$", valor: quartil(1), texto: reais, diferenca: abaixoEmReais, curta: (d) => formatBRL(-d) },
  { rotulo: "P75 da diária", unidade: "R$ · 25% mais caros", valor: quartil(2), texto: reais, diferenca: abaixoEmReais, curta: (d) => formatBRL(-d) },
  {
    rotulo: "Ocupação média", unidade: "%", valor: (b) => b.avgOccupancy, texto: (v) => (v == null ? "—" : `${formatDecimal(v, 0)}%`),
    diferenca: (d, de) => `${formatDecimal(d, 0)} p.p. abaixo ${de}`, curta: (d) => `−${formatDecimal(d, 0)} p.p.`,
  },
  {
    rotulo: "Receita de referência", unidade: "R$/mês · d × 30 × o, antes de custos", valor: (b) => receitaDe(b), texto: reais,
    diferenca: abaixoEmReais, curta: (d) => formatBRL(-d),
  },
  {
    rotulo: "Anúncios na amostra", unidade: "n", valor: (b) => (naturezaBairro(b) === "observado" ? b.activeListings : null),
    texto: (v) => (v == null ? "sem amostra própria" : formatDecimal(v, 0)),
    diferenca: (d, _de, que) => `${formatDecimal(d, 0)} anúncios a menos ${que}`, curta: (d) => `−${formatDecimal(d, 0)}`,
  },
];

/** Bairros padrão sem ?b=: o bairro selecionado (?bairro=, guardado ou Pinheiros) e os dois mais próximos no mapa. */
function padraoComparacao(bairros: BairroItem[], selecionado: BairroItem | null): string[] {
  if (!selecionado) return bairros.slice(0, MAX_COMPARAR).map((b) => slugifyBairro(b.name));
  const vizinhos = vizinhosMaisProximos(bairros, selecionado.name, MAX_COMPARAR - 1);
  return [selecionado, ...vizinhos].map((b) => slugifyBairro(b.name));
}

function Comparar() {
  const { bairros, isLoading, offline, recarregar } = useBaseEstudo();
  const { bairro: bairroSelecionado } = useBairroSelecionado(bairros, { naUrl: false });
  const [params, setParams] = useSearchParams();
  const [compartilharAberto, setCompartilharAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const variacoes = useVariacoesVisiveis();

  const slugsDisponiveis = useMemo(() => bairros.map((b) => slugifyBairro(b.name)), [bairros]);
  const slugs = params.get("b") === null ? padraoComparacao(bairros, bairroSelecionado) : lerComparar(params.get("b"), slugsDisponiveis);
  const selecionados = slugs
    .map((s) => bairros.find((b) => slugifyBairro(b.name) === s))
    .filter((b): b is BairroItem => Boolean(b));
  const temVariacao = selecionados.some((b) => variacoes.some((v) => v.bairro === b.name));

  const atualizar = (novos: string[]) => setParams({ b: novos.join(",") }, { replace: true, preventScrollReset: true });
  const trocar = (vaga: number, nome: string) => atualizar(trocarNaComparacao(slugs, vaga, slugifyBairro(nome), MAX_COMPARAR));
  const remover = (b: BairroItem) => atualizar(slugs.filter((s) => s !== slugifyBairro(b.name)));

  const link = () => `${window.location.origin}${caminhoComparar(slugs)}`;
  const texto = `Comparação de bairros para studio de short stay no Radar Bewild: ${selecionados.map((b) => b.name).join(", ")}.`;
  const registrar = (canal: string) => trackGlobal("comparacao_compartilhada", { canal, bairros: slugs.join(",") });
  const compartilhar = async () => {
    if (typeof navigator.share === "function" && window.matchMedia?.("(pointer: coarse)").matches) {
      try { await navigator.share({ title: "Comparação de bairros — Radar Bewild", text: texto, url: link() }); registrar("nativo"); return; }
      catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; }
    }
    setCopiado(false);
    setCompartilharAberto(true);
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(link()); setCopiado(true); registrar("copiar_link"); setTimeout(() => setCopiado(false), 2000); }
    catch { toast({ title: "Não foi possível copiar", description: "Selecione o link e copie manualmente." }); }
  };
  const simular = (b: BairroItem) => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "comparar", bairro: b.name });

  const marcaDoBairro = (nome: string) => {
    const b = selecionados.find((x) => x.name === nome);
    // Aproximação/estimativa e, para dado observado, a amostra pequena (Mooca, Bom Retiro, Lapa).
    return b ? marcaNatureza(b) ?? (temAmostraPequena(b) ? "amostra pequena" : null) : null;
  };
  const linhasCalculadas = LINHAS.map((l) => {
    const brutos = selecionados.map((b) => l.valor(b));
    // Diferença de cada bairro até o maior valor da linha (só com dois ou mais valores). O nome de
    // quem tem o maior leva a marca da natureza ("Brooklin (aproximação)").
    const diferencas = diferencasAteOMaior(selecionados.map((b, i) => ({ nome: b.name, valor: brutos[i] })));
    const maiores = diferencas.find((d) => d)?.maiores ?? null;
    const frase = (d: number) => (maiores ? l.diferenca(d, bairrosNaFrase(maiores, "de", marcaDoBairro), bairrosNaFrase(maiores, "que", marcaDoBairro)) : "");
    return { ...l, brutos, diferencas, maiores, frase };
  });

  const achado = achadoComparacao(selecionados.map((b) => ({ nome: b.name, valor: receitaDe(b) })));
  const comMarca = (nome: string) => { const m = marcaDoBairro(nome); return m ? `${nome} (${m})` : nome; };
  const titulo: ReactNode =
    achado.tipo === "maior" ? <>{achado.maiores.map(comMarca).join(" e ")} {achado.maiores.length > 1 ? "têm" : "tem"} a maior receita de referência: {formatBRL(achado.valor)} por mês, {formatBRL(achado.diferenca)} acima {bairrosNaFrase([achado.menor], "de", marcaDoBairro)}</>
    : achado.tipo === "empate" ? <>{achado.nomes.map(comMarca).join(" e ")} têm a mesma receita de referência: {formatBRL(achado.valor)} por mês</>
    : achado.tipo === "unico" ? <>{comMarca(achado.nome)}: receita de referência de {formatBRL(achado.valor)} por mês. Escolha mais bairros para comparar</>
    : "Escolha até três bairros para comparar";
  // O título da Fig. 1 não destaca a faixa de quem tem amostra pequena (o P25 de poucos anúncios distorce a largura).
  const larga = faixaMaisLarga(selecionados.filter((b) => !temAmostraPequena(b)));
  const temAprox = selecionados.some((b) => naturezaBairro(b) !== "observado");
  const comAmostraPequena = selecionados.filter(temAmostraPequena);

  return (
    <>
      <CabecalhoTela
        rotulo={`Comparar · até ${MAX_COMPARAR} bairros de São Paulo`}
        titulo={titulo}
        lead="Diária, quartis, ocupação e amostra lado a lado, com a fonte de cada bairro. Em cada linha, o maior valor está em negrito e os demais mostram a diferença até ele."
      >
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {Array.from({ length: MAX_COMPARAR }, (_, i) => {
            const b = selecionados[i] ?? null;
            return (
              <div key={i} className="min-w-0">
                <SeletorBairro
                  rotulo={`Bairro ${i + 1}`}
                  bairros={bairros}
                  valor={b?.name ?? null}
                  incluirVazio={b ? undefined : "Escolher bairro"}
                  onChange={(nome) => trocar(i, nome)}
                />
                {b && selecionados.length > 1 && (
                  <button type="button" onClick={() => remover(b)} className="e-link inline-flex min-h-[44px] items-center text-[13px]" aria-label={`Remover ${b.name} da comparação`}>
                    Remover
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {selecionados.length > 0 && (
          <Button variant="outline" className="mt-4 min-h-[44px] px-5 text-[15px] font-semibold" onClick={() => void compartilhar()}>
            <Share2 className="h-4 w-4" aria-hidden="true" />Compartilhar comparação
          </Button>
        )}
      </CabecalhoTela>

      {offline && (
        <Container className="mb-6">
          <AvisoBase tom="aviso" onTentar={recarregar}>A base do Radar não respondeu agora. Mostrando a reserva aprovada (coleta de {COLETA_GUESTFAVORITES}); nenhum número foi alterado.</AvisoBase>
        </Container>
      )}

      <Container>
        {isLoading && selecionados.length === 0 && <p className="e-apoio py-10" aria-busy="true">Carregando os bairros…</p>}
        {!isLoading && selecionados.length === 0 && (
          <p className="e-apoio e-fina border-y py-10">Nenhum bairro escolhido. Use os seletores acima para começar.</p>
        )}

        {selecionados.length > 0 && (
          <TabelaNumerada
            numero={1}
            titulo={<>{selecionados.length === 1 ? "Os números" : `Os ${selecionados.length === 2 ? "dois" : "três"} bairros`} em 8 linhas: o maior valor de cada linha em negrito</>}
            unidade={<>Diária em R$ por noite; ocupação em %; receita de referência em R$/mês (<span className="e-var">R</span> = <span className="e-var">d</span> × 30 × <span className="e-var">o</span>, antes de custos). Quartis de diária não são faixas de metragem. Fonte: GuestFavorites, {periodoPrincipal(selecionados) ?? "jan–set/2026"}{textoColeta(selecionados)}.</>}
            nota={
              <>
                {temAprox && <p>{TEXTO_APROXIMACAO} Por isso não têm amostra própria.</p>}
                {comAmostraPequena.length > 0 && <p className="mt-1">Amostra pequena (menos de 200 anúncios) em {comAmostraPequena.map((b) => b.name).join(" e ")}: leia com cautela.</p>}
                <p className="mt-1">A diferença (no celular, com sinal: “−R$ 60”) é contada até o bairro com o maior valor da linha, a partir dos números exibidos.</p>
              </>
            }
          >
            <thead>
              <tr>
                <th scope="col" className={cn(TH, "hidden w-[30%] min-w-[128px] md:table-cell")}>Indicador</th>
                {selecionados.map((b) => (
                  <th key={b.name} scope="col" className={cn(TH, "relative px-1 text-right md:min-w-[132px] md:px-2")}>
                    <span data-bairro className="block text-[15px] font-semibold md:text-[17px] normal-case leading-6 tracking-normal text-foreground">{b.name}</span>
                    <span className="mt-1 flex flex-wrap justify-end gap-x-2 gap-y-1 normal-case tracking-normal">
                      <TagBairro b={b} className="px-1 text-[11px] md:px-1.5 md:text-xs" />
                      <NotaAmostra b={b} curta />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasCalculadas.map((l) => (
                <Fragment key={l.rotulo}>
                {/* Celular: o indicador vira uma linha inteira acima dos valores, para os três bairros caberem. */}
                <tr className="md:hidden">
                  <th scope="colgroup" colSpan={selecionados.length} className="px-0 pb-0 pt-3 text-left font-normal">
                    <span className="font-semibold">{l.rotulo}</span> <span className="e-legenda">{l.unidade}</span>
                  </th>
                </tr>
                <tr>
                  <th scope="row" className={cn(TD, "relative hidden font-normal md:table-cell")}>
                    <span className="block font-semibold">{l.rotulo}</span>
                    <span className="e-legenda block">{l.unidade}</span>
                  </th>
                  {selecionados.map((b, i) => {
                    const v = l.brutos[i];
                    const dif = l.diferencas[i];
                    const maior = v != null && l.maiores != null && l.maiores.includes(b.name);
                    const aprox = naturezaBairro(b) !== "observado";
                    return (
                      <td key={b.name} className={cn(TD_NUM, "relative px-1 md:px-2", maior ? "font-bold" : "font-normal", v == null && "text-tinta-70")}>
                        <span className={cn("text-[15px] md:text-[17px]", v == null && "text-[13px]", aprox && v != null && "underline decoration-dashed decoration-neutro-500 underline-offset-4")}>{l.texto(v)}</span>
                        {maior && <span className="sr-only"> (maior da linha)</span>}
                        {dif && (
                          <>
                            <span className="e-legenda sr-only font-normal md:not-sr-only md:block">{l.frase(dif.diferenca)}</span>
                            <span className="e-legenda block font-normal md:hidden" aria-hidden="true">{l.curta(dif.diferenca)}</span>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
                </Fragment>
              ))}
              <tr className="md:hidden">
                <th scope="colgroup" colSpan={selecionados.length} className="px-0 pb-0 pt-3 text-left font-normal">
                  <span className="font-semibold">Natureza e fonte</span> <span className="e-legenda">fonte, período e coleta</span>
                </th>
              </tr>
              <tr>
                <th scope="row" className={cn(TD, "relative hidden font-normal md:table-cell")}>
                  <span className="block font-semibold">Natureza e fonte</span>
                  <span className="e-legenda block">fonte, período e coleta</span>
                </th>
                {selecionados.map((b) => (
                  <td key={b.name} className={cn(TD, "relative px-1 text-right md:px-2")}>
                    <span className="hidden flex-wrap justify-end gap-2 md:flex"><TagBairro b={b} /></span>
                    <NotaAmostra b={b} className="mt-1 block" />
                    <FonteDoBairro b={b} />
                  </td>
                ))}
              </tr>
            </tbody>
          </TabelaNumerada>
        )}

        {temVariacao && (
          <details className="group e-fina mt-8 border-y">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
              O que mudou nesta coleta
              <span aria-hidden="true" className="text-tinta-70 transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
            </summary>
            <div className="grid gap-4 pb-6 md:grid-cols-3">
              {selecionados.map((b) => <VariacaoColetaBairro key={b.name} bairro={b.name} className="p-3" />)}
            </div>
          </details>
        )}

        {selecionados.length > 0 && (
          <Figura
            numero={1}
            className="mt-14"
            titulo={larga
              ? <>{bairrosNaFrase([larga.bairro.name], null, marcaDoBairro).replace(/^./, (c) => c.toUpperCase())} tem a faixa central de diárias mais larga: de {formatBRL(larga.p25)} a {formatBRL(larga.p75)}</>
              : "Faixas de diária no mesmo eixo"}
            unidade="Diária em R$ por noite, eixo comum de R$ 0 a 600. Barra do P25 ao P75 (metade central das diárias), traço na mediana e ponto na média."
            legenda={
              <div className="grid gap-2">
                <LegendaFaixas comAproximacao={temAprox} />
                {selecionados.filter((b) => !b.dailyQuartiles).map((b) => <p key={b.name}>{b.name}: {textoSemQuartis(b)}</p>)}
                {comAmostraPequena.length > 0 && <p className="e-amostra">{comAmostraPequena.map((b) => b.name).join(" e ")}: amostra pequena, a faixa pode não representar o bairro.</p>}
              </div>
            }
            fonte={<>GuestFavorites, {periodoPrincipal(selecionados) ?? "jan–set/2026"}{temAprox ? "; aproximações pelo Itaim Bibi" : ""}.</>}
          >
            <FaixasDiaria bairros={selecionados} />
          </Figura>
        )}
      </Container>

      {selecionados.length > 0 && (
        <Secao id="proximo-passo" rotulo="Método e próximo passo" titulo="Simule a operação no bairro escolhido">
          <FormulaReceita />
          <AvisoReceita className="mt-4" />
          <div className="mt-8 flex flex-wrap gap-2">
            {selecionados.map((b, i) => (
              <Button key={b.name} asChild variant={i === 0 ? "default" : "outline"} className="min-h-[44px] px-5 text-[15px] font-semibold">
                <Link to={linkProjecaoBairro(slugifyBairro(b.name))} onClick={() => simular(b)}>Simular {b.name}</Link>
              </Button>
            ))}
          </div>
          <p className="mt-2 flex flex-wrap gap-x-6">
            {selecionados.map((b) => (
              <Link key={b.name} to={bairroPath(b.name)} className="e-link inline-flex min-h-[44px] items-center text-[15px]">Ver a página de {b.name}</Link>
            ))}
          </p>
          <div className="e-fina mt-8 flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
            <p className="e-corpo max-w-[560px]">Já escolheu o bairro? A Bewild orça a reforma completa do seu studio.</p>
            <OrcamentoButton local="comparar" rotulo="Solicitar orçamento" icone={false} className="min-h-[44px] shrink-0 px-5 text-[15px] font-semibold" />
          </div>
        </Secao>
      )}

      <Dialog open={compartilharAberto} onOpenChange={setCompartilharAberto}>
        <DialogContent className="max-w-[480px] gap-0 p-7 font-body">
          <DialogTitle className="e-h2 mb-2 pr-6">Compartilhar comparação</DialogTitle>
          <DialogDescription className="e-apoio mb-3.5">Quem abrir o link vê os mesmos bairros lado a lado.</DialogDescription>
          <Input readOnly value={compartilharAberto ? link() : ""} onFocus={(e) => e.currentTarget.select()} className="mb-3 min-h-[48px] text-base" aria-label="Link da comparação" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => void copiar()} className="min-h-[44px] text-[15px] font-semibold">
              {copiado ? <><Check className="h-4 w-4" aria-hidden="true" />Link copiado</> : <><Copy className="h-4 w-4" aria-hidden="true" />Copiar link</>}
            </Button>
            <Button asChild variant="outline" className="min-h-[44px] text-[15px] font-semibold">
              <a href={compartilharAberto ? `https://wa.me/?text=${encodeURIComponent(`${texto} ${link()}`)}` : "#"} target="_blank" rel="noopener noreferrer" onClick={() => registrar("whatsapp")}>
                Enviar no WhatsApp
              </a>
            </Button>
          </div>
          <Button variant="ghost" onClick={() => setCompartilharAberto(false)} className="mt-3 min-h-[44px] w-full text-sm font-medium">Fechar</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Fonte do bairro na Tab. 1: fonte, período e coleta com link para a página pública.
 * Na aproximação, a estimativa Bewild anterior aparece só como referência extra, fora das contas.
 */
function FonteDoBairro({ b }: { b: BairroBase }) {
  const aprox = naturezaBairro(b) === "aproximacao";
  const texto = `${fonteCurtaBairro(b)}${aprox ? " (Itaim Bibi)" : ""}`;
  // No celular a coluna é estreita: só o link "Fonte" (fonte, período e coleta estão na legenda da tabela).
  const curto = aprox ? "Fonte (Itaim Bibi)" : "Fonte";
  const rotulo = <><span className="md:hidden">{curto}</span><span className="hidden md:inline">{texto}</span></>;
  return (
    <span className="e-legenda mt-1 block">
      {b.sourceUrl
        ? <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" className="e-link inline-flex min-h-[44px] items-center justify-end break-words [overflow-wrap:anywhere]">{rotulo}<NovaAba /></a>
        : <span className="inline-flex min-h-[44px] items-center">{rotulo}</span>}
      {aprox && b.referenciaBewild && <span className="block text-left md:text-right">Referência extra, fora das contas: {rotuloReferenciaBewild(b.referenciaBewild)}.</span>}
    </span>
  );
}

/** ", coleta de 18/10/2026 (Moema: 13/10/2026)" a partir dos bairros comparados. */
function textoColeta(bairros: BairroBase[]): string {
  const c = resumoColetas(bairros);
  if (!c) return "";
  const exc = c.excecoes.map((e) => `${e.nomes.join(", ")}: ${e.data}`).join("; ");
  return `, coleta de ${c.principal}${exc ? ` (${exc})` : ""}`;
}
