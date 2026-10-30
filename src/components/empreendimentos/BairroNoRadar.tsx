import { Link } from "react-router-dom";
import { NotaAmostra, TagBairro } from "@/components/estudo/Natureza";
import { AvisoReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import { linkProjecaoBairro } from "@/data/navegacao";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { bairroNaBase, textosBairroNoRadar } from "@/lib/empreendimentos";
import { receitaDe } from "@/lib/estudo";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { fonteCurtaBairro, naturezaBairro, type BairroBase } from "@/lib/radarUi";
import { slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * Números do bairro do prédio na base do Radar (mesmos do /bairro/*, com a natureza
 * do dado, o aviso de amostra e a aproximação do Itaim Bibi). Bairro fora da base:
 * diz que não há dado, sem trocar por bairro vizinho. Precisa de BairroProvider acima.
 */
export default function BairroNoRadar({ bairro, compacto = false, className }: { bairro: string; compacto?: boolean; className?: string }) {
  const { bairros } = useBaseEstudo();
  const b = bairroNaBase(bairro, bairros) as BairroBase | null;

  if (!b) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="e-apoio max-w-[640px]">{textosBairroNoRadar(bairro, null).foraDaBase}</p>
        <Link to="/ranking" className="e-link inline-flex min-h-[44px] items-center">Ver os bairros com dados no Radar</Link>
      </div>
    );
  }

  const slug = slugifyBairro(b.name);
  const textos = textosBairroNoRadar(b.name, naturezaBairro(b));
  const receita = receitaDe(b);
  return (
    <div className={cn("space-y-5", className)}>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <TagBairro b={b} />
        <span className="e-legenda">{fonteCurtaBairro(b)}</span>
        <NotaAmostra b={b} />
      </p>
      <GradeIndicadores className="max-[359px]:grid-cols-1 lg:grid-cols-3">
        <Indicador pequeno={compacto} rotulo="Diária média (R$)" valor={formatBRL(b.dailyAvg)} />
        <Indicador pequeno={compacto} rotulo="Ocupação média (%)" valor={`${formatDecimal(b.avgOccupancy, 0)}%`} />
        <Indicador pequeno={compacto} rotulo="Receita de referência (R$/mês)" valor={formatBRL(receita)} nota="Diária × 30 × ocupação, antes de custos" />
      </GradeIndicadores>
      {textos.aproximacao && <p className="e-legenda max-w-[640px]">{textos.aproximacao}</p>}
      <p className="e-legenda max-w-[640px]">{textos.media}</p>
      <div className="flex flex-wrap gap-x-6">
        <Link to={`/bairro/${slug}`} className="e-link inline-flex min-h-[44px] items-center">Ver {b.name} no Radar</Link>
        <Link to={linkProjecaoBairro(slug)} className="e-link inline-flex min-h-[44px] items-center">Simular um studio no bairro</Link>
      </div>
      <AvisoReceita />
    </div>
  );
}
