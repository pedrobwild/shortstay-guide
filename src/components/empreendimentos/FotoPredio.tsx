import { altFoto, type Empreendimento } from "@/lib/empreendimentos";
import { cn } from "@/lib/utils";

type Props = {
  e: Pick<Empreendimento, "nome" | "bairro" | "foto_url" | "foto_alt" | "foto_credito">;
  className?: string;
  /** Primeira dobra da página do prédio: carrega antes. */
  prioridade?: boolean;
  /** Mostra o crédito da foto abaixo da imagem. */
  credito?: boolean;
  /** Miniatura quadrada (card no celular): sem nome nem legenda sobre a ilustração. */
  miniatura?: boolean;
};

/**
 * Foto do prédio enviada pelo admin (fotos autorizadas: da Bewild ou cedidas pela
 * incorporadora). Sem foto, uma ilustração neutra com o nome — nunca uma imagem
 * copiada do site da incorporadora.
 */
export default function FotoPredio({ e, className, prioridade = false, credito = false, miniatura = false }: Props) {
  const proporcao = miniatura ? "aspect-square" : "aspect-[4/3]";
  if (e.foto_url) {
    return (
      <figure className={cn("min-w-0", className)}>
        <div className={cn(proporcao, "w-full overflow-hidden bg-neutro-100")}>
          <img
            src={e.foto_url}
            alt={altFoto(e)}
            loading={prioridade ? "eager" : "lazy"}
            decoding="async"
            {...(prioridade ? { fetchpriority: "high" } : {})}
            className="h-full w-full object-cover"
          />
        </div>
        {credito && e.foto_credito && <figcaption className="e-legenda mt-2">Foto: {e.foto_credito}</figcaption>}
      </figure>
    );
  }
  return (
    <div className={cn("relative w-full overflow-hidden bg-ciano-100", proporcao, className)} role="img" aria-label={`Ilustração do ${e.nome}; foto do prédio em breve`}>
      <svg aria-hidden="true" viewBox="0 0 240 180" preserveAspectRatio="xMidYMax meet" className="absolute inset-x-0 bottom-0 h-[78%] w-full text-ciano-700">
        <g fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.55">
          <path d="M20 180V110h40v70" />
          <path d="M70 180V36h70v144" />
          <path d="M150 180V78h55v102" />
          <path d="M8 180h224" />
        </g>
        <g fill="currentColor" opacity="0.22">
          {Array.from({ length: 9 }).map((_, linha) =>
            [80, 98, 116].map((x) => <rect key={`${linha}-${x}`} x={x} y={46 + linha * 14} width="10" height="7" />),
          )}
          {Array.from({ length: 6 }).map((_, linha) =>
            [160, 178].map((x) => <rect key={`d${linha}-${x}`} x={x} y={88 + linha * 14} width="12" height="7" />),
          )}
          {Array.from({ length: 4 }).map((_, linha) => <rect key={`e${linha}`} x="30" y={120 + linha * 14} width="20" height="7" />)}
        </g>
      </svg>
      {!miniatura && (
        <>
          <span aria-hidden="true" className="absolute left-4 top-4 max-w-[62%] font-display text-[15px] font-semibold leading-5 text-ciano-800">
            {e.nome}
          </span>
          <span aria-hidden="true" className="absolute right-4 top-4 text-[12px] leading-5 text-tinta-70">Foto em breve</span>
        </>
      )}
    </div>
  );
}
