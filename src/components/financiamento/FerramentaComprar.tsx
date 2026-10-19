import type { RefObject } from "react";
import { Tag } from "@/components/estudo/Natureza";
import { Button } from "@/components/ui/button";
import FonteLink from "@/components/guide/FonteLink";
import {
  FinancingSimulatorForm, FinancingSimulatorResults, useFinancingSimulatorController,
} from "@/components/financiamento/SimuladorFinanciamento";
import { FONTES_GUIA } from "@/data/fontesGuia";
import { BRL, PCT_PT } from "@/lib/financiamento";
import { resumoFinanciamento } from "@/lib/estudoFerramentas";
import { formatDecimal } from "@/lib/numberFormat";

/**
 * Ferramenta 01 · Vou comprar (/ferramentas#comprar): o simulador de financiamento
 * existente (mesmo controlador: premissas, link, rascunho, captura anônima só com
 * consentimento, ao gerar) com um resumo ao vivo no padrão do direcionamento —
 * entrada, valor financiado, 1ª e última parcela no SAC e juros no prazo — calculado
 * pelo mesmo motor (financiamento.ts) a partir dos campos preenchidos.
 */
export default function FerramentaComprar() {
  const ctl = useFinancingSimulatorController({ modo: "busca", idPrefix: "busca" });
  const snap = ctl.currentSnap;
  const resumo = resumoFinanciamento({
    valor: snap.propertyValue,
    entrada: snap.downPayment,
    prazoMeses: snap.termMonths,
    jurosAA: snap.annualRate,
    tipoTaxa: snap.annualRateType,
    idade: snap.buyerAge,
    sistema: "SAC",
  });
  const faltam = [
    !(snap.propertyValue > 0) && "valor do imóvel",
    !(snap.termMonths >= 12) && "prazo",
    !(snap.annualRate > 0) && "banco ou juros",
  ].filter(Boolean) as string[];

  return (
    <div id="simulador-financiamento">
    <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
      <div ref={ctl.formRef as RefObject<HTMLDivElement>} className="min-w-0 scroll-mt-24">
        <FinancingSimulatorForm ctl={ctl} />
      </div>

      <div className="min-w-0 space-y-10">
        <section aria-labelledby="resumo-financiamento" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="resumo-financiamento" className="e-h3">Resumo no sistema SAC</h3>
            <Tag tipo="hipotese">Simulação · hipótese</Tag>
          </div>
          <p className="e-legenda mt-1">
            {resumo
              ? <>Imóvel de {BRL(snap.propertyValue)} · entrada de {formatDecimal(resumo.entradaPct, 0)}% · {snap.termMonths} meses · juros de {PCT_PT(snap.annualRate)} ao ano ({snap.annualRateType}{snap.indexer && snap.indexer !== "fixa" ? ` + ${snap.indexer}` : ""}).</>
              : <>Preencha {faltam.length ? faltam.join(", ") : "a entrada (menor que o valor do imóvel)"} para ver o resumo.</>}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-foreground pt-4 md:grid-cols-3">
            <Item rotulo="Entrada (R$)" valor={resumo ? BRL(resumo.entrada) : "—"} nota={resumo ? `${formatDecimal(resumo.entradaPct, 0)}% do valor${snap.fgts > 0 ? ", com FGTS" : ""}` : undefined} />
            <Item rotulo="Valor financiado (R$)" valor={resumo ? BRL(resumo.valorFinanciado) : "—"} />
            <Item rotulo="Juros no prazo (R$)" valor={resumo ? BRL(resumo.jurosNoPrazo) : "—"} nota={resumo ? "soma dos juros de todas as parcelas" : undefined} />
            <Item rotulo="1ª parcela (R$/mês)" valor={resumo ? BRL(resumo.primeiraParcela) : "—"} nota={resumo ? "com seguros e tarifa (estimados)" : undefined} destaque />
            <Item rotulo="Última parcela (R$/mês)" valor={resumo ? BRL(resumo.ultimaParcela) : "—"} nota={resumo ? "no SAC a parcela cai mês a mês" : undefined} />
            <Item rotulo="Total pago (R$)" valor={resumo ? BRL(resumo.totalPago) : "—"} nota={resumo ? "parcelas cheias no prazo, sem a entrada" : undefined} />
          </dl>
          <p className="e-legenda mt-4 max-w-[720px]">
            Taxas das instituições consultadas em 19/07/2026 (<FonteLink fonte={FONTES_GUIA.taxasFinanciamento} className="text-[13px]" />). Seguros MIP e DFI, tarifa e custos de aquisição são estimativas; a proposta oficial é sempre do banco. Gere a simulação para o demonstrativo completo, o comparativo entre bancos e o relatório.
          </p>
          {!ctl.snapshot && (
            <Button variant="outline" className="mt-4 min-h-[44px] px-5 text-[15px] font-semibold" onClick={ctl.handleGenerate}>
              Gerar o demonstrativo completo
            </Button>
          )}
        </section>

      </div>
    </div>
      {/* Demonstrativo completo na largura toda: composição, gráficos, bancos e relatório. */}
      <div ref={ctl.resultsRef} className="mt-12 min-w-0 scroll-mt-6 space-y-4">
        {ctl.snapshot && <p className="e-rotulo">Demonstrativo da simulação gerada</p>}
        <FinancingSimulatorResults ctl={ctl} showEmpty={false} />
      </div>
    </div>
  );
}

function Item({ rotulo, valor, nota, destaque = false }: { rotulo: string; valor: string; nota?: string; destaque?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="e-rotulo">{rotulo}</dt>
      <dd className="m-0">
        <span className={destaque ? "e-numero-sm mt-1 block whitespace-nowrap text-ciano-700" : "e-numero-sm mt-1 block whitespace-nowrap"}>{valor}</span>
        {nota && <span className="e-legenda mt-1 block">{nota}</span>}
      </dd>
    </div>
  );
}
