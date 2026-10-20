import { useState } from "react";
import { Link } from "react-router-dom";
import SeletorBairro from "@/components/estudo/SeletorBairro";
import { NotaAmostra, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, Diferenca, FormulaReceita } from "@/components/estudo/Numeros";
import ReguaQuartis from "@/components/estudo/graficos/ReguaQuartis";
import CampoNumero from "@/components/ferramentas/CampoNumero";
import { linkProjecaoBairro } from "@/data/navegacao";
import type { BairroCurado } from "@/data/bairrosCurados";
import { useBairroSelecionado } from "@/hooks/useBairroSelecionado";
import { compararOperacao, faixaNosQuartis, receitaDe, TEXTO_FAIXA_QUARTIL } from "@/lib/estudo";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { naturezaBairro, textoSemQuartis } from "@/lib/radarUi";
import { bairroPath, slugifyBairro } from "@/lib/seo";

/**
 * Ferramenta 03 · Já opero (/ferramentas#operar), "Meu studio contra o bairro": a
 * diária e a ocupação médias que a pessoa informa contra as do bairro na base do
 * Radar, pela mesma fórmula (R = d × 30 × o). Diferença de receita em reais,
 * ocupação em pontos percentuais e a posição da diária nos quartis do bairro.
 * Nada é guardado nem enviado: a conta acontece só na tela.
 */
export default function FerramentaOperar({ bairros }: { bairros: BairroCurado[] }) {
  const { bairro, selecionar } = useBairroSelecionado(bairros, { naUrl: false });
  const [diaria, setDiaria] = useState<number | null>(null);
  const [ocupacao, setOcupacao] = useState<number | null>(null);

  if (!bairro) return <p className="e-apoio">A base de bairros ainda está carregando.</p>;

  const diariaOk = diaria != null && diaria > 0 && diaria <= 5000 ? diaria : null;
  const ocupacaoOk = ocupacao != null && ocupacao > 0 && ocupacao <= 100 ? ocupacao : null;
  const completo = diariaOk != null && ocupacaoOk != null;
  const c = completo ? compararOperacao({ diaria: diariaOk, ocupacaoPct: ocupacaoOk }, bairro) : null;
  const aprox = naturezaBairro(bairro) === "aproximacao";
  const faixa = diariaOk != null ? faixaNosQuartis(diariaOk, bairro.dailyQuartiles) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <fieldset className="min-w-0 space-y-6 border-0 p-0">
        <legend className="sr-only">Seu studio</legend>
        <div>
          <SeletorBairro rotulo="Bairro do studio" bairros={bairros} valor={bairro.name} onChange={selecionar} />
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <TagBairro b={bairro} />
            <NotaAmostra b={bairro} curta />
            <Link to={bairroPath(bairro.name)} className="e-link text-[13px]">Ver o bairro</Link>
          </p>
        </div>
        <CampoNumero rotulo="Sua diária média (R$)" prefixo="R$" valor={diaria} onChange={setDiaria} placeholder={formatDecimal(bairro.dailyAvg, 0)} ajuda="Média dos últimos meses, como no extrato da plataforma." />
        <CampoNumero rotulo="Sua ocupação média (%)" unidade="%" casas={1} valor={ocupacao} onChange={setOcupacao} placeholder={formatDecimal(bairro.avgOccupancy, 0)} ajuda="Noites vendidas ÷ noites disponíveis." />
        <p className="e-legenda">Os números ficam só nesta tela: nada é enviado nem guardado.</p>
      </fieldset>

      <div className="min-w-0" aria-live="polite">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-6 border-t border-foreground pt-4 sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="e-rotulo">Receita de referência (R$/mês)</dt>
            <dd className="m-0">
              <span className="e-numero-sm mt-1 block">{c ? formatBRL(c.receitaMinha) : "—"}</span>
              <span className="e-legenda mt-1 block">seu studio · bairro {formatBRL(c?.receitaBairro ?? receitaDe(bairro))}</span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="e-rotulo">Diferença de receita (R$/mês)</dt>
            <dd className="m-0">
              <span className="e-numero-sm mt-1 block">{c ? <Diferenca valor={c.difReceita} /> : "—"}</span>
              <span className="e-legenda mt-1 block">{c ? (c.difReceita >= 0 ? "acima" : "abaixo") + ` da média ${aprox ? "do Itaim Bibi (aproximação)" : "do bairro"}` : "informe diária e ocupação"}</span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="e-rotulo">Ocupação (p.p.)</dt>
            <dd className="m-0">
              <span className="e-numero-sm mt-1 block">{c ? <Diferenca valor={c.difOcupacaoPP} formato="pp" /> : "—"}</span>
              <span className="e-legenda mt-1 block">contra {formatDecimal(bairro.avgOccupancy, 0)}% de média no bairro</span>
            </dd>
          </div>
        </dl>

        <div className="mt-8">
          <p className="e-rotulo">Posição da sua diária nos quartis do bairro</p>
          <p className="e-h3 mt-1">
            {!bairro.dailyQuartiles
              ? textoSemQuartis(bairro)
              : diariaOk == null
                ? "Informe a sua diária média para ver a posição."
                : <>Sua diária de {formatBRL(diariaOk)} fica {faixa ? TEXTO_FAIXA_QUARTIL[faixa] : ""}.</>}
          </p>
        </div>

        {bairro.dailyQuartiles && (
          <figure className="m-0 mt-6">
            <figcaption className="mb-3">
              <span className="e-rotulo block">Fig. 5</span>
              <span className="e-h3 mt-1 block">Quartis de diária {aprox ? "do Itaim Bibi (aproximação para " + bairro.name + ")" : `de ${bairro.name}`}</span>
              <span className="e-legenda mt-1 block">Diária (R$). Faixa: do P25 ao P75 (metade dos anúncios); traço cheio: mediana; tracejado: média ({formatBRL(bairro.dailyAvg)}).</span>
            </figcaption>
            <ReguaQuartis quartis={bairro.dailyQuartiles} media={bairro.dailyAvg} minha={diariaOk} aproximacao={aprox} nomeBairro={bairro.name} />
            <p className="e-legenda mt-2">
              Fonte: GuestFavorites, {bairro.period ?? "período não informado"}{bairro.activeListings != null ? <>, <span className="e-var">n</span> = {formatDecimal(bairro.activeListings, 0)} anúncios</> : ""}. Quartis de diária não são faixas de metragem.
              {aprox && <> {TEXTO_APROXIMACAO}</>}
            </p>
            <NotaAmostra b={bairro} className="mt-1 block" />
          </figure>
        )}

        <div className="mt-8 max-w-[720px] space-y-3">
          <div className="overflow-x-auto"><FormulaReceita {...(c ? { diaria: diariaOk!, ocupacaoPct: ocupacaoOk!, receita: c.receitaMinha } : {})} /></div>
          <AvisoReceita />
          <p className="flex flex-wrap gap-x-6 text-[15px]">
            <Link to={linkProjecaoBairro(slugifyBairro(bairro.name))} className="e-link inline-flex min-h-[44px] items-center">Simular o resultado líquido</Link>
            <Link to="/guia/anuncio-e-precificacao" className="e-link inline-flex min-h-[44px] items-center">Anúncio e precificação</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
