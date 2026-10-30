import FotoPredio from "@/components/empreendimentos/FotoPredio";
import SeloBewild from "@/components/empreendimentos/SeloBewild";
import { TEXTO_SELO_BEWILD, textoSituacao, type Empreendimento } from "@/lib/empreendimentos";

/** Card do catálogo: abre o resumo (modal). Mostra até 3 diferenciais. */
export default function CardEmpreendimento({ e, abrir }: { e: Empreendimento; abrir: (e: Empreendimento, origem: HTMLElement) => void }) {
  const situacao = textoSituacao(e);
  const extras = e.diferenciais.length - 3;
  return (
    <button
      type="button"
      onClick={(ev) => abrir(e, ev.currentTarget)}
      aria-haspopup="dialog"
      aria-label={`${e.nome}, ${e.bairro}${e.selo_bewild ? `. ${TEXTO_SELO_BEWILD}` : ""}. Ver resumo`}
      className="group grid h-full w-full min-w-0 grid-cols-[88px_minmax(0,1fr)] items-start gap-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex sm:flex-col sm:gap-0"
    >
      {/* Celular: miniatura ao lado do texto (lista mais curta); a partir de 640px, card com a foto em cima. */}
      <FotoPredio e={e} miniatura decorativa className="sm:hidden" />
      <FotoPredio e={e} decorativa className="hidden transition-opacity duration-200 group-hover:opacity-90 motion-reduce:transition-none sm:block" />
      <span className="flex h-full min-w-0 flex-1 flex-col gap-2 sm:mt-4">
        <span className="e-rotulo">{e.bairro}</span>
        <span className="e-h3 break-words text-tinta group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{e.nome}</span>
        {(e.incorporadora || situacao) && (
          <span className="e-legenda break-words">{[e.incorporadora, situacao].filter(Boolean).join(" · ")}</span>
        )}
        {e.diferenciais.length > 0 && (
          <span className="text-[15px] leading-[22px] text-tinta-78 break-words">
            {e.diferenciais.slice(0, 3).join(" · ")}
            {extras > 0 && <span className="text-tinta-70"> · +{extras}</span>}
          </span>
        )}
        <span className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          {e.selo_bewild ? <SeloBewild /> : <span />}
          <span className="text-[14px] font-semibold text-ciano-700">Ver resumo</span>
        </span>
      </span>
    </button>
  );
}
