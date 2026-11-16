import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OrcamentoButton from "@/components/OrcamentoButton";
import ComparacaoDecoracao from "@/components/estudo/ComparacaoDecoracao";
import { CabecalhoTela, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import { DECORATION_LEVELS } from "@/data/guide-data";
import { NotaAmostra, Tag, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import FonteBairro from "@/components/guide/FonteBairro";
import { BairroProvider } from "@/hooks/useBairroData";
import { useSimuladorReceita } from "@/hooks/useSimuladorReceita";
import { useBairroAtual } from "@/lib/bairroAtual";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { naturezaBairro } from "@/lib/radarUi";
import { indicadores } from "@/lib/simuladorReceita";
import { cn } from "@/lib/utils";

/**
 * /resumo — fechamento do estudo em 3 passos (decisão do Pedro, 16/11/2026): o bairro
 * escolhido, a conta e a reforma numa página, terminando no pedido de orçamento.
 * Não guarda nada novo: lê o bairro atual (bairroAtual.ts) e o rascunho do simulador
 * (useSimuladorReceita), os dois só neste navegador e lidos depois da montagem. Os
 * números são os mesmos de /projecao (short stay, sem ITBI). Passo que a pessoa ainda
 * não fez aparece como link para fazê-lo, sem número de exemplo no lugar.
 */
export default function ResumoEstudo() {
  return <BairroProvider><Resumo /></BairroProvider>;
}

function Resumo() {
  const sim = useSimuladorReceita();
  const bairroAtual = useBairroAtual();
  // O rascunho e o bairro atual chegam depois da montagem; até lá a tela não afirma nada.
  const [pronto, setPronto] = useState(false);
  useEffect(() => { setPronto(true); }, []);

  const bairro = sim.bairro;
  const escolheu = Boolean(bairro && (sim.p.bairro != null || bairroAtual != null));
  const r = sim.resultadoShortStay;
  const ind = r ? indicadores(r, sim.p.imovel.valorImovel, sim.reforma) : null;

  return (
    <PaginaEstudo>
      <CabecalhoTela
        rotulo="Resumo do estudo"
        titulo="O seu estudo em uma página"
        lead="O bairro, a conta e a reforma dos três passos. O estudo fica só neste navegador; o pedido de orçamento leva apenas o bairro e a faixa de área."
      />

      {!pronto ? (
        <Secao rotulo="Resumo"><p role="status" className="text-muted-foreground">Carregando o seu estudo…</p></Secao>
      ) : !escolheu || !bairro || !r ? (
        <>
          <Secao id="bairro" rotulo="Passo 1 · Bairro" titulo="Você ainda não escolheu um bairro" lead="O resumo parte do bairro: a conta e a reforma usam a diária e a ocupação dele.">
            <LinkPasso to="/ranking">Escolher o bairro</LinkPasso>
          </Secao>
          <Secao id="conta" rotulo="Passo 2 · Conta" titulo="A conta aparece aqui depois do bairro">
            <LinkPasso to="/projecao">Fazer a conta</LinkPasso>
          </Secao>
          <Secao id="reforma" rotulo="Passo 3 · Reforma" titulo="A reforma entra no investimento da conta">
            <LinkPasso to="/reformar">Planejar a reforma</LinkPasso>
          </Secao>
        </>
      ) : (
        <>
          <Secao id="bairro" rotulo="Passo 1 · Bairro" titulo={bairro.name}>
            <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
              <TagBairro b={bairro} />
              <NotaAmostra b={bairro} />
              {naturezaBairro(bairro) === "aproximacao" && <span className="e-legenda">{TEXTO_APROXIMACAO}</span>}
            </p>
            <GradeIndicadores className="lg:grid-cols-3">
              <Indicador pequeno rotulo="Diária média (R$)" valor={formatBRL(bairro.dailyAvg)} />
              <Indicador pequeno rotulo="Ocupação (%)" valor={`${formatDecimal(bairro.avgOccupancy, 0)}%`} />
              <Indicador pequeno className="col-span-2 lg:col-span-1" rotulo="Receita mensal de referência (R$)" valor={formatBRL(Math.round(bairro.dailyAvg * 30 * bairro.avgOccupancy / 100))} nota="diária × 30 × ocupação" />
            </GradeIndicadores>
            <div className="mt-6"><FonteBairro nome={bairro.name} /></div>
            <Links>
              <LinkPasso to="/ranking">Trocar de bairro</LinkPasso>
              {sim.slugBairro && <LinkPasso to={`/bairro/${sim.slugBairro}`}>Ver a página do bairro</LinkPasso>}
            </Links>
          </Secao>

          <Secao id="conta" rotulo="Passo 2 · Conta" titulo="Quanto sobra por mês, pelas suas hipóteses" lead="Short stay, com os custos da sua simulação. São hipóteses editáveis, não estatística de mercado.">
            <p className="mb-6"><Tag tipo="hipotese" titulo="Conta com hipóteses editáveis; não é promessa de resultado">Simulação</Tag></p>
            <GradeIndicadores>
              <Indicador pequeno rotulo="Receita bruta (R$/mês)" valor={formatBRL(r.receitaBruta)} nota={`${formatBRL(sim.diaria)} × 30 × ${formatDecimal(sim.ocupacao, 0)}%${sim.diariaAjustada || sim.ocupacaoAjustada ? " (ajustado por você)" : sim.diaria !== bairro.dailyAvg ? " (diária do nível de decoração escolhido, hipótese)" : ""}`} />
              <Indicador pequeno rotulo="Resultado líquido (R$/mês)" valor={<span className={cn(r.liquido < 0 && "e-negativo")}>{formatBRL(r.liquido)}</span>} nota="depois das deduções da simulação" />
              <Indicador pequeno rotulo="Rentabilidade anual (% ao ano)" valor={ind ? <span className={cn(ind.rentabilidadeAA < 0 && "e-negativo")}>{formatDecimal(ind.rentabilidadeAA, 1)}%</span> : "—"} nota={ind ? "líquido anual ÷ investimento total" : undefined} />
              <Indicador pequeno rotulo="Prazo estimado de retorno (anos)" valor={ind?.paybackAnos != null ? formatDecimal(ind.paybackAnos, 1) : "—"} nota={ind && ind.paybackAnos == null ? "sem resultado positivo, não há prazo" : ind ? "investimento total ÷ líquido anual" : undefined} />
            </GradeIndicadores>
            {sim.resultadoMediaBairro && (
              <ComparacaoDecoracao
                className="mt-6"
                nivel={(DECORATION_LEVELS.find((d) => d.value === sim.p.decoracao)?.label ?? "").toLowerCase()}
                bairro={bairro.name}
                diariaNivel={sim.diaria}
                diariaBairro={bairro.dailyAvg}
                liquidoNivel={r.liquido}
                liquidoBairro={sim.resultadoMediaBairro.liquido}
              />
            )}
            {!ind && <p className="e-apoio mt-6 max-w-[720px]">Informe o valor do imóvel no passo 2 para ver a rentabilidade anual e o prazo estimado de retorno.</p>}
            <Links><LinkPasso to="/projecao">Ajustar a conta</LinkPasso></Links>
          </Secao>

          <Secao id="reforma" rotulo="Passo 3 · Reforma" titulo="A reforma considerada na conta">
            <p className="mb-6"><Tag tipo="hipotese" titulo="Estimativa a partir do estudo Bewild, não é orçamento">Estimativa, não orçamento</Tag></p>
            <GradeIndicadores className="lg:grid-cols-2">
              <Indicador
                pequeno
                rotulo="Reforma completa (R$)"
                valor={formatBRL(sim.reforma)}
                nota={sim.reformaAjustada || !sim.sugestaoReforma ? "valor que você informou" : `sugestão do simulador: ${sim.sugestaoReforma.areaM2} m² × ${formatBRL(sim.sugestaoReforma.custoM2)}/m² (hipótese)`}
              />
              <Indicador pequeno rotulo="Investimento total (R$)" valor={ind ? formatBRL(ind.investimento) : "—"} nota={ind ? "valor do imóvel + reforma, sem ITBI" : "aparece com o valor do imóvel"} />
            </GradeIndicadores>
            <Links><LinkPasso to="/reformar">Estimar custo e prazo pela área exata</LinkPasso></Links>
          </Secao>
        </>
      )}

      <Secao id="orcamento" rotulo="Próximo passo" titulo="Leve o estudo para um orçamento do seu imóvel" lead="O orçamento parte do projeto do seu imóvel. Os números desta página são referência para a conversa, não promessa de resultado.">
        <OrcamentoButton
          local="resumo"
          contexto={pronto && escolheu && bairro ? { bairro: bairro.name, area: sim.p.area } : undefined}
          className="px-5 py-2 text-[15px] font-semibold"
        />
        <AvisoReceita className="mt-6" />
      </Secao>
    </PaginaEstudo>
  );
}

function Links({ children }: { children: ReactNode }) {
  return <p className="mt-6 flex flex-wrap gap-x-6 text-[15px]">{children}</p>;
}

function LinkPasso({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="e-link inline-flex min-h-[44px] items-center gap-2">
      {children}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </Link>
  );
}
