import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OrcamentoButton from "@/components/OrcamentoButton";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { bairrosReserva, useRadarBase } from "@/lib/radarBase";
import { slugifyBairro } from "@/lib/seo";
import { linkProjecaoBairro } from "@/data/navegacao";
import { caminhoComparar } from "@/lib/comparar";
import { SELO_BAIRROS, SELO_PROJETOS, SELO_REFORMAS, TEXTO_GARANTIA } from "@/data/provasBewild";

const PROVAS = [SELO_REFORMAS, SELO_PROJETOS, SELO_BAIRROS, TEXTO_GARANTIA];

/**
 * Fecho da página de bairro: leva ao simulador (/projecao) com o bairro já escolhido
 * (quando ele está na base do Radar) e ao pedido de orçamento, com a prova Bewild ao
 * lado. Números de prova vêm só de provasBewild.ts.
 */
export default function ProximoPassoBairro({ bairro }: { bairro: string }) {
  const { data } = useRadarBase();
  const slug = slugifyBairro(bairro);
  // O simulador só conhece os bairros da base do Radar; fora dela, abre sem pré-seleção.
  const noSimulador = useMemo(
    () => (data?.bairros ?? bairrosReserva()).some((b) => slugifyBairro(b.name) === slug),
    [data, slug],
  );
  const destino = noSimulador ? linkProjecaoBairro(slug) : "/projecao";

  return (
    <div className="min-w-0">
      <h3 className="e-h3">Próximo passo em {bairro}</h3>
      <p className="e-apoio mt-1 max-w-[720px]">Teste a conta com as premissas do seu studio ou peça à Bewild o orçamento da reforma completa.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold">
          <Link to={destino} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "bairro", bairro })}>
            {noSimulador ? `Simular receita em ${bairro}` : "Abrir o simulador"}
          </Link>
        </Button>
        <OrcamentoButton local="bairro" variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold" />
      </div>
      <Link to={caminhoComparar([slug])} className="e-link mt-2 inline-flex min-h-[44px] items-center text-[15px]">
        Comparar {bairro} com outros bairros
      </Link>
      <ul className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-[15px] text-tinta-78">
        {PROVAS.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </div>
  );
}
