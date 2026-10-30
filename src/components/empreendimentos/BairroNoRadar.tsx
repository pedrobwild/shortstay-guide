import { Link } from "react-router-dom";
import { NotaAmostra, TagBairro, TEXTO_APROXIMACAO } from "@/components/estudo/Natureza";
import { AvisoReceita, GradeIndicadores, Indicador } from "@/components/estudo/Numeros";
import { linkProjecaoBairro } from "@/data/navegacao";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { bairroNaBase } from "@/lib/empreendimentos";
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
        <p className="e-apoio max-w-[640px]">
          O Radar ainda não tem diária e ocupação de {bairro}: o bairro não está entre os da base. Os números de bairros próximos não são usados no lugar.
        </p>
        <Link to="/ranking" className="e-link inline-flex min-h-[44px] items-center">Ver os bairros com dados no Radar</Link>
      </div>
    );
  }

  const slug = slugifyBairro(b.name);
  const aproximacao = naturezaBairro(b) === "aproximacao";
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
      {aproximacao && <p className="e-legenda max-w-[640px]">{TEXTO_APROXIMACAO}</p>}
      <p className="e-legenda max-w-[640px]">Média dos anúncios do bairro no Airbnb, não deste prédio.</p>
      <div className="flex flex-wrap gap-x-6">
        <Link to={`/bairro/${slug}`} className="e-link inline-flex min-h-[44px] items-center">Ver {b.name} no Radar</Link>
        <Link to={linkProjecaoBairro(slug)} className="e-link inline-flex min-h-[44px] items-center">Simular um studio no bairro</Link>
      </div>
      <AvisoReceita />
    </div>
  );
}
