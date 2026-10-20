import type { BairroCurado } from "@/data/bairrosCurados";
import { FONTES_GUIA } from "@/data/fontesGuia";
import Metadados, { type ItemMetadado } from "@/components/estudo/Metadados";
import NovaAba from "@/components/NovaAba";
import { formatDecimal } from "@/lib/numberFormat";
import { periodoPrincipal, resumoColetas } from "@/lib/estudo";

/**
 * Metadados da base do Radar (fonte, período, coleta e amostra), montados a partir
 * dos bairros exibidos e da referência de São Paulo da mesma coleta.
 */
export default function MetadadosBase({
  bairros,
  cidade,
  compacto,
  className,
  extras = [],
}: {
  bairros: (BairroCurado & { coletadoEm?: string | null })[];
  cidade: { activeListings: number; period: string };
  compacto?: boolean;
  className?: string;
  extras?: ItemMetadado[];
}) {
  const coletas = resumoColetas(bairros);
  const periodo = periodoPrincipal(bairros) ?? cidade.period;
  const itens: ItemMetadado[] = [
    {
      rotulo: "Fonte",
      valor: (
        <a href={FONTES_GUIA.guestfavoritesSP.url} target="_blank" rel="noopener noreferrer" className="e-link">
          GuestFavorites<NovaAba />
        </a>
      ),
    },
    { rotulo: "Período", valor: periodo },
    {
      rotulo: "Coleta",
      valor: coletas ? (
        <>
          {coletas.principal}
          {coletas.excecoes.map((e) => <span key={e.data} className="text-tinta-70"> ({e.nomes.join(", ")}: {e.data})</span>)}
        </>
      ) : "sem data registrada",
    },
    { rotulo: "Amostra", valor: <>{bairros.length} bairros · <span className="e-var">n</span> = {formatDecimal(cidade.activeListings, 0)} anúncios em SP</> },
    ...extras,
  ];
  return <Metadados itens={itens} compacto={compacto} className={className} />;
}
