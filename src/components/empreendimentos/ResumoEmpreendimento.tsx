import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import NovaAba from "@/components/NovaAba";
import BairroNoRadar from "@/components/empreendimentos/BairroNoRadar";
import FotoPredio from "@/components/empreendimentos/FotoPredio";
import SeloBewild from "@/components/empreendimentos/SeloBewild";
import Metadados from "@/components/estudo/Metadados";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { caminhoEmpreendimento, itensFicha, textoFonte, type Empreendimento } from "@/lib/empreendimentos";

/** Resumo do empreendimento no catálogo (modal); "Ver página completa" leva à página do prédio. */
export default function ResumoEmpreendimento({ e, fechar }: { e: Empreendimento | null; fechar: () => void }) {
  return (
    <Dialog open={e !== null} onOpenChange={(aberto) => { if (!aberto) fechar(); }}>
      {e && (
        // Bloco (não grid): numa grade com altura máxima e rolagem, a linha da foto encolhia e a foto cobria o texto.
        <DialogContent className="block max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-2xl space-y-5 overflow-y-auto overscroll-contain rounded-[6px] p-5 sm:p-8">
          <DialogHeader className="space-y-2 pr-10 text-left">
            <p className="e-rotulo">Empreendimento · {e.bairro}</p>
            <DialogTitle className="e-h2 break-words text-left text-[1.5rem] leading-[1.875rem] tracking-normal">{e.nome}</DialogTitle>
            <DialogDescription className="e-apoio text-left">
              {e.resumo || `Prédio em ${e.bairro} onde a Bewild já atua.`}
            </DialogDescription>
          </DialogHeader>

          <FotoPredio e={e} credito />
          {e.selo_bewild && <SeloBewild comNota />}
          <Metadados itens={itensFicha(e)} compacto />

          {e.diferenciais.length > 0 && (
            <section aria-labelledby="resumo-diferenciais" className="space-y-2">
              <h3 id="resumo-diferenciais" className="e-h3">Diferenciais</h3>
              <ul className="list-disc space-y-1 pl-5 text-[15px] leading-[22px] text-tinta-78">
                {e.diferenciais.map((d) => <li key={d} className="break-words">{d}</li>)}
              </ul>
              <p className="e-legenda">Conforme {textoFonte(e)}.</p>
            </section>
          )}

          <section aria-labelledby="resumo-bairro" className="space-y-3 border-t border-border pt-5">
            <h3 id="resumo-bairro" className="e-h3">O bairro no Radar</h3>
            <BairroNoRadar bairro={e.bairro} compacto />
          </section>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
            <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold">
              <Link to={caminhoEmpreendimento(e.slug)}>Ver página completa</Link>
            </Button>
            {e.fonte_url && (
              <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold">
                <a href={e.fonte_url} target="_blank" rel="noopener noreferrer">
                  Ver a fonte<ArrowUpRight aria-hidden="true" className="ml-2 h-4 w-4" /><NovaAba />
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
