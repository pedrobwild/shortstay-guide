import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Calculator, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OrcamentoButton from "@/components/OrcamentoButton";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { bairrosReserva, useRadarBase } from "@/lib/radarBase";
import { slugifyBairro } from "@/lib/seo";
import { linkSimuladorBairro } from "@/data/navegacao";
import { caminhoComparar } from "@/lib/comparar";
import { SELO_BAIRROS, SELO_PROJETOS, SELO_REFORMAS, TEXTO_GARANTIA } from "@/data/provasBewild";

const PROVAS = [SELO_REFORMAS, SELO_PROJETOS, SELO_BAIRROS, TEXTO_GARANTIA];

/**
 * Fecho da página de bairro: leva ao simulador da home com o bairro já
 * escolhido (quando ele está na base do simulador) e ao pedido de orçamento,
 * com a prova Bewild ao lado. Números de prova vêm só de provasBewild.ts.
 */
export default function ProximoPassoBairro({ bairro }: { bairro: string }) {
  const { data } = useRadarBase();
  const slug = slugifyBairro(bairro);
  // O simulador da home só conhece os bairros da base do Radar; fora dela, abre sem pré-seleção.
  const noSimulador = useMemo(
    () => (data?.bairros ?? bairrosReserva()).some((b) => slugifyBairro(b.name) === slug),
    [data, slug],
  );
  const destino = noSimulador ? linkSimuladorBairro(slug) : "/#simulador";

  return (
    <Card className="border-primary/20 bg-secondary/40">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Próximo passo em {bairro}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Teste a conta com as premissas do seu studio ou peça à Bewild o orçamento da reforma completa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="min-h-[44px] sm:flex-1">
            <Link to={destino} onClick={() => trackGlobal("cta_clicked", { cta_id: "simular_bairro", section: "bairro", bairro })}>
              <Calculator className="mr-2 h-4 w-4 shrink-0" />
              {noSimulador ? `Simular receita em ${bairro}` : "Abrir o simulador"}
            </Link>
          </Button>
          <OrcamentoButton local="bairro" variant="outline" className="min-h-[44px] sm:flex-1" />
        </div>
        <Link to={caminhoComparar([slug])} className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary underline underline-offset-4">
          Comparar {bairro} com outros bairros
        </Link>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {PROVAS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {p}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
