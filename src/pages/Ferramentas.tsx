import { Link } from "react-router-dom";
import { TAXAS_CONSULTADAS_EM } from "@/data/taxasFinanciamento";
import { CabecalhoTela, Container, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import AvisoBase from "@/components/radar/AvisoBase";
import FerramentaComprar from "@/components/financiamento/FerramentaComprar";
import FerramentaReformar from "@/components/ferramentas/FerramentaReformar";
import FerramentaOperar from "@/components/ferramentas/FerramentaOperar";
import DiagnosticoInvestidorSection from "@/components/guide/DiagnosticoInvestidorSection";
import RecomendacaoSection from "@/components/guide/RecomendacaoSection";
import PlanoAcaoSection from "@/components/guide/PlanoAcaoSection";
import { BairroProvider } from "@/hooks/useBairroData";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { PERFIS_RADAR } from "@/data/perfisRadar";
import { CONTRATOS_ANALISADOS } from "@/data/provasBewild";
import { COLETA_GUESTFAVORITES } from "@/data/fontesGuia";

/**
 * /ferramentas no redesign "Estudo aberto": uma ferramenta por perfil, na ordem dos
 * perfis da home (01 comprar, 02 reformar, 03 operar), com as âncoras #comprar,
 * #reformar e #operar que a home usa. Abaixo, em "Mais ferramentas", seguem a
 * autoavaliação, a recomendação e o plano de ação.
 */
export default function Ferramentas() {
  return (
    <BairroProvider>
      <GuideDecisionProvider>
        <PaginaEstudo>
          <FerramentasInner />
        </PaginaEstudo>
      </GuideDecisionProvider>
    </BairroProvider>
  );
}

const PERFIL = Object.fromEntries(PERFIS_RADAR.map((p) => [p.momento, p]));
const rotuloPerfil = (m: "procurando" | "reformar" | "tenho") => `${PERFIL[m].numero} · ${PERFIL[m].rotulo}`;

function FerramentasInner() {
  const { bairros, offline, recarregar } = useBaseEstudo();
  return (
    <>
      <CabecalhoTela
        rotulo="Ferramentas · uma por etapa"
        titulo="Faça a conta da sua etapa: financiamento, reforma ou operação."
        lead={<>Cada ferramenta usa uma fonte declarada: as taxas dos bancos consultadas em {TAXAS_CONSULTADAS_EM.split("-").reverse().join("/")}, o estudo de {CONTRATOS_ANALISADOS} contratos de reforma da Bewild e a base de {bairros.length} bairros do Radar. Premissas suas ficam marcadas como hipótese.</>}
      >
        <nav aria-label="Ferramentas nesta página">
          <ol className="grid gap-x-10 gap-y-2 border-t border-foreground pt-3 sm:grid-cols-3">
            {([
              ["comprar", "procurando", "Financiamento do imóvel"],
              ["reformar", "reformar", "Estimativa de reforma por área"],
              ["operar", "tenho", "Meu studio contra o bairro"],
            ] as const).map(([id, m, nome]) => (
              <li key={id}>
                <a href={`#${id}`} className="group flex min-h-[44px] flex-col justify-center py-1">
                  <span className="e-rotulo">{rotuloPerfil(m)}</span>
                  <span className="text-[16px] font-semibold leading-6 group-hover:underline">{nome}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </CabecalhoTela>

      {offline && (
        <Container className="mb-6">
          <AvisoBase tom="aviso" onTentar={recarregar}>A base do Radar não respondeu agora. As ferramentas usam a reserva aprovada (coleta de {COLETA_GUESTFAVORITES}).</AvisoBase>
        </Container>
      )}

      <Secao
        id="comprar"
        rotulo={rotuloPerfil("procurando")}
        titulo="Veja quanto custa financiar o imóvel antes de comprar"
        lead="Valor, entrada, prazo e o banco: o resumo mostra a entrada, o valor financiado, a 1ª e a última parcela no sistema SAC e os juros no prazo. Gere a simulação para o demonstrativo completo."
      >
        <FerramentaComprar />
      </Secao>

      <Secao
        id="reformar"
        rotulo={rotuloPerfil("reformar")}
        titulo="Estime a reforma completa pela área do seu imóvel"
        lead={`Faixa de custo e prazo em contrato a partir de ${CONTRATOS_ANALISADOS} contratos de reforma completa da Bewild em São Paulo. É uma estimativa do estudo, não um orçamento do seu projeto.`}
      >
        <FerramentaReformar />
      </Secao>

      <Secao
        id="operar"
        rotulo={rotuloPerfil("tenho")}
        titulo="Compare o seu studio com a média do bairro"
        lead="Informe a sua diária média e a sua ocupação média. A conta usa a mesma fórmula da base: diferença de receita em reais, ocupação em pontos percentuais e onde a sua diária fica nos quartis do bairro."
      >
        <FerramentaOperar bairros={bairros} />
      </Secao>

      <Secao
        id="mais-ferramentas"
        rotulo="Mais ferramentas"
        titulo="Autoavaliação, recomendação e plano de ação"
        lead={<>Três passos que usam critérios internos da Bewild (pesos e scores), não estatística de mercado. Para a conta do resultado líquido, use o <Link to="/projecao" className="e-link">simulador</Link>.</>}
      >
        <div className="space-y-16">
          <section id="diagnostico" aria-labelledby="diagnostico-titulo" className="scroll-mt-20">
            <h3 id="diagnostico-titulo" className="e-h3 mb-4">Autoavaliação do investidor: três perguntas</h3>
            <DiagnosticoInvestidorSection />
          </section>
          <section id="recomendacao" aria-labelledby="recomendacao-titulo" className="scroll-mt-20">
            <h3 id="recomendacao-titulo" className="e-h3 mb-4">Recomendação personalizada</h3>
            <RecomendacaoSection />
          </section>
          <section id="plano-acao" aria-labelledby="plano-acao-titulo" className="scroll-mt-20">
            <h3 id="plano-acao-titulo" className="e-h3 mb-4">Seu plano de ação</h3>
            <PlanoAcaoSection />
          </section>
        </div>
      </Secao>
    </>
  );
}
