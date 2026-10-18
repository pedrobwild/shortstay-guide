import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Download } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import FonteLink from "@/components/guide/FonteLink";
import NaturezaTag from "@/components/radar/NaturezaTag";
import OrcamentoButton from "@/components/OrcamentoButton";
import { Button } from "@/components/ui/button";
import { BAIRROS_CURADOS, SAO_PAULO_REFERENCIA, URL_ITAIM_BIBI } from "@/data/bairrosCurados";
import { DRE_LINHAS, DEDUCOES_PADRAO_PCT, TEXTO_INVESTIMENTO_TOTAL } from "@/data/dreGuia";
import { FONTES_GUIA } from "@/data/fontesGuia";
import { CONTRATOS_ANALISADOS, ESTUDO_REFORMA_DATA, ESTUDO_REFORMA_URL } from "@/data/provasBewild";
import { CAMINHO_CSV, CAMINHO_JSON, LICENCA_DADOS, LICENCA_DADOS_NOME, textoCitacao } from "@/lib/dadosAbertos";
import { coletasReserva, montarRegistro, useHistoricoRadar, type EntradaRegistro } from "@/lib/historicoRadar";
import { formatDecimal } from "@/lib/numberFormat";
import { textosFontes } from "@/lib/radarUi";
import { useBairroData } from "@/hooks/useBairroData";

const dataBR = (iso: string) => iso.split("-").reverse().join("/");
const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`);

function Bloco({ numero, titulo, children, id }: { numero: string; titulo: string; children: React.ReactNode; id: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-24 border-t border-border py-8 md:py-10">
      <p className="rotulo-secao mb-2">{numero}</p>
      <h2 id={`${id}-titulo`} className="mb-4 max-w-[720px] font-display text-[24px] font-bold leading-[1.15] text-foreground md:text-[30px]">{titulo}</h2>
      <div className="max-w-[760px] space-y-3 text-[15px] leading-[1.6] text-foreground-medium">{children}</div>
    </section>
  );
}

function Registro({ entradas, offline }: { entradas: EntradaRegistro[]; offline: boolean }) {
  if (!entradas.length) return <p>Nenhuma atualização registrada ainda.</p>;
  return (
    <ol className="space-y-3">
      {entradas.map((e) => (
        <li key={`${e.data}|${e.fonteId}`} className="rounded-lg border border-border bg-card p-3">
          <p className="font-semibold tabular-nums text-foreground">{dataBR(e.data)} · {e.fonteNome}</p>
          {e.novos.length > 0 && <p className="mt-1 text-sm">Entraram na base ({e.novos.length}): {juntar(e.novos)}.</p>}
          {e.atualizados.length > 0 && <p className="mt-1 text-sm">Atualizados ({e.atualizados.length}): {juntar(e.atualizados)}.</p>}
        </li>
      ))}
      {offline && <li className="text-xs text-muted-foreground">A base não respondeu; este registro vem da reserva offline (só a coleta em uso de cada bairro).</li>}
    </ol>
  );
}

/** Conteúdo da /metodologia (sem navbar/rodapé), também usado na pré-renderização estática. */
export function ConteudoMetodologia() {
  const { bairros } = useBairroData();
  const textos = textosFontes(bairros);
  const historico = useHistoricoRadar();
  const registro = montarRegistro(historico.data?.coletas ?? coletasReserva());
  const pequenas = BAIRROS_CURADOS.filter((b) => b.activeListings !== null && b.activeListings < 200).map((b) => `${b.name} (${formatDecimal(b.activeListings!, 0)})`);
  const aproximacoes = BAIRROS_CURADOS.filter((b) => b.ocupacaoFonte === "aproximacao").map((b) => b.name);
  const hoje = new Date().toISOString().slice(0, 10);
  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 pb-16 lg:px-10">
      <nav aria-label="Caminho" className="flex min-h-[44px] flex-wrap items-center gap-1.5 pt-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Guia do investidor</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-foreground">Metodologia e dados abertos</span>
      </nav>
      <header className="py-8 md:py-10">
        <p className="rotulo-secao mb-2.5">Metodologia</p>
        <h1 className="max-w-[820px] font-display text-[32px] font-bold leading-[1.1] text-foreground md:text-[44px]">De onde vêm os números do Radar Bewild</h1>
        <p className="mt-4 max-w-[760px] text-[17px] leading-[1.55] text-foreground-medium">
          Cada número do Radar tem origem, período e data de coleta. Esta página explica o que é dado observado, o que é aproximação, o que é hipótese de simulação, como a base é atualizada e como baixar e citar os dados.
        </p>
        <nav aria-label="Nesta página" className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {[["#fontes", "Fontes"], ["#leitura", "O que é lido"], ["#calculos", "Cálculos"], ["#reforma", "Reforma"], ["#atualizacao", "Atualização"], ["#dados-abertos", "Dados abertos"], ["#limites", "Limites"]].map(([h, t]) => (
            <a key={h} href={h} className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-4">{t}</a>
          ))}
        </nav>
      </header>

      <Bloco id="fontes" numero="01 · Fontes" titulo="Três tipos de número, sempre identificados">
        <div className="space-y-4">
          <div><NaturezaTag tipo="observado" /><p className="mt-2">{textos.observado}</p></div>
          {textos.aproximacao && <div><NaturezaTag tipo="aproximacao" /><p className="mt-2">{textos.aproximacao}</p></div>}
          <div><NaturezaTag tipo="estimativa" /><p className="mt-2">{textos.estimativa}</p></div>
          <div><NaturezaTag tipo="hipotese">Hipótese de simulação</NaturezaTag><p className="mt-2">{textos.hipotese}</p></div>
        </div>
        <p>Regra <strong>um bairro, um número</strong>: o site, o comparador e o assistente leem a mesma base; o mesmo bairro nunca aparece com valores diferentes. A referência da cidade (São Paulo: ocupação {SAO_PAULO_REFERENCIA.avgOccupancy}%, diária média R$ {formatDecimal(SAO_PAULO_REFERENCIA.dailyAvg, 0)}, {formatDecimal(SAO_PAULO_REFERENCIA.activeListings, 0)} anúncios, {SAO_PAULO_REFERENCIA.period}) vem da mesma fonte.</p>
        <p className="flex flex-wrap gap-x-4"><FonteLink fonte={FONTES_GUIA.guestfavoritesSP} /><FonteLink fonte={{ title: "Página do Itaim Bibi (base da aproximação de " + juntar(aproximacoes) + ")", url: URL_ITAIM_BIBI }} /></p>
      </Bloco>

      <Bloco id="leitura" numero="02 · O que é lido" titulo="O que a página pública de cada bairro informa">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Ocupação média</strong> (% das noites ocupadas no período) e <strong>diária média</strong> (ADR, em R$).</li>
          <li><strong>Quartis de diária</strong>: 25% mais baratos, mediana e 25% mais caros. Não são faixas de metragem.</li>
          <li><strong>Anúncios ativos</strong> no bairro, que o Radar usa como tamanho da amostra.</li>
          <li><strong>Período</strong> coberto (ex.: jan–set/2026) e <strong>data da coleta</strong> (quando a página foi lida). A fonte pode revisar os números dentro do mesmo período; por isso guardamos a data.</li>
        </ul>
        <p>Nada é arredondado nem derivado na leitura. Os números entram exatamente como a página mostra, com o link da página de origem guardado junto.</p>
        <p><strong>Amostra pequena.</strong> Fonte pública com menos de 200 anúncios recebe aviso em todas as telas: {juntar(pequenas)}.</p>
        <p><strong>Selo de confiança</strong> (critério interno, não estatística de mercado): <em>alta</em> com 1.000 anúncios ou mais e coleta de até 120 dias; <em>média</em> com 200 ou mais e até 240 dias; <em>baixa</em> nos demais casos. O filtro "Só dados observados" deixa aproximações e estimativas de fora.</p>
      </Bloco>

      <Bloco id="calculos" numero="03 · Cálculos" titulo="Como a receita e o resultado são calculados">
        <p><strong>Receita mensal de referência</strong> = diária média × 30 × ocupação. É uma referência de mercado, não a receita de um imóvel específico.</p>
        <p><strong>Resultado líquido do guia</strong> (hipóteses editáveis no simulador, nunca estatística de mercado): deduções de {formatDecimal(DEDUCOES_PADRAO_PCT, 0)}% da receita bruta no resumo —</p>
        <ul className="list-disc space-y-1 pl-5 tabular-nums">
          {DRE_LINHAS.map((l) => <li key={l.chave}><strong>{l.rotulo}</strong>: {formatDecimal(l.pct, 0)}% <span className="text-muted-foreground">({l.nota})</span></li>)}
        </ul>
        <p>No simulador, os quatro primeiros incidem em % sobre a receita bruta; condomínio, IPTU e contas entram em reais, informados pela pessoa.</p>
        <p><strong>Investimento total</strong> = {TEXTO_INVESTIMENTO_TOTAL}. <strong>Rentabilidade anual</strong> = líquido anual ÷ investimento total (yield). <strong>Prazo estimado de retorno</strong> = investimento total ÷ líquido anual (payback). O ITBI, quando usado, é hipótese de 3%.</p>
        <p>Níveis de decoração, sazonalidade mensal e multiplicadores são modelos ilustrativos, sempre rotulados como hipótese.</p>
      </Bloco>

      <Bloco id="reforma" numero="04 · Reforma" titulo="De onde vêm custo e prazo da reforma">
        <p>Os números de reforma (orçamento mediano, custo por m², composição e prazo) vêm do estudo Bewild de {ESTUDO_REFORMA_DATA}, com base em {CONTRATOS_ANALISADOS} contratos turnkey em São Paulo. Cada número aparece no site com a origem documentada.</p>
        <p><FonteLink fonte={{ title: `Estudo Bewild — quanto custa reformar um studio (${ESTUDO_REFORMA_DATA})`, url: ESTUDO_REFORMA_URL }} /></p>
      </Bloco>

      <Bloco id="atualizacao" numero="05 · Atualização" titulo="Como a base é atualizada">
        <p>Toda coleta é registrada com fonte, período, data, amostra e link. Uma coleta nova desativa a anterior do mesmo bairro, mas <strong>o histórico nunca é apagado</strong> — é ele que alimenta o "o que mudou" e o histórico de cada bairro.</p>
        <p>As páginas públicas são relidas periodicamente; o que mudou vira proposta e só entra na base depois de revisão humana. Nenhum número é alterado automaticamente.</p>
        <h3 className="pt-2 font-display text-lg font-semibold text-foreground">Registro de atualizações</h3>
        {historico.isLoading ? <p role="status">Carregando registro…</p> : <Registro entradas={registro} offline={!!historico.data?.offline} />}
      </Bloco>

      <Bloco id="dados-abertos" numero="06 · Dados abertos" titulo="Baixe e cite a base">
        <p>A base dos {BAIRROS_CURADOS.length} bairros, com natureza, fonte, período, data de coleta e link de origem em cada linha, está disponível para download. Os arquivos são gerados a cada publicação do site a partir da base aprovada.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-[44px]"><a href={CAMINHO_CSV} download><Download className="h-4 w-4" aria-hidden="true" /> Baixar CSV</a></Button>
          <Button asChild variant="outline" className="min-h-[44px]"><a href={CAMINHO_JSON} download><Download className="h-4 w-4" aria-hidden="true" /> Baixar JSON</a></Button>
        </div>
        <p><strong>Licença:</strong> <a href={LICENCA_DADOS} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">{LICENCA_DADOS_NOME}</a>. Os dados observados são de propriedade da fonte original; o Radar organiza, documenta e versiona.</p>
        <p><strong>Como citar:</strong></p>
        <blockquote className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">{textoCitacao(hoje)}</blockquote>
      </Bloco>

      <Bloco id="limites" numero="07 · Limites" titulo="O que estes números não dizem">
        <ul className="list-disc space-y-1 pl-5">
          <li>São médias de bairro (todos os tipos de anúncio da fonte), não o desempenho de um studio específico.</li>
          <li>O período coberto é o que a fonte publica (hoje jan–set/2026 em toda a base); quando bairros têm períodos diferentes, a comparação pode refletir sazonalidade.</li>
          <li>Receita de referência e simulações não incluem todos os custos e não são garantia de resultado.</li>
          <li>Quando não há dado, dizemos que não há — não estimamos para preencher a tabela.</li>
        </ul>
      </Bloco>

      <div className="regua flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-[22px] font-semibold leading-tight text-foreground">Próximo passo</p>
          <p className="mt-1 text-sm text-muted-foreground">Compare os bairros com estes números ou peça o orçamento da reforma.</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Button asChild className="min-h-[44px] px-[18px] font-semibold"><Link to="/ranking">Comparar bairros</Link></Button>
          <OrcamentoButton local="guia" variant="outline" className="min-h-[44px] px-[18px] font-semibold" />
        </div>
      </div>
      <Link to="/#fontes" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar ao guia</Link>
    </main>
  );
}

/** /metodologia: página pública de metodologia, registro de atualizações e dados abertos. */
export default function Metodologia() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar fixo={false} />
      <ConteudoMetodologia />
      <RodapeRadar />
    </div>
  );
}
