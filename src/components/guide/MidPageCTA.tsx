import { Button } from "@/components/ui/button";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { Link } from "react-router-dom";
import { caminhoComBairro, useBairroAtual } from "@/lib/bairroAtual";
import { CAMINHOS_MOMENTO, useMomento } from "@/lib/momento";

/** Chamada no meio do guia: bloco aberto por régua de 2px, sem gradiente. O botão principal segue o momento da pessoa. */
export default function MidPageCTA({ variant = "default" }: { variant?: "default" | "slim" }) {
  const isSlim = variant === "slim";
  const momento = useMomento();
  const bairroAtual = useBairroAtual();
  const caminho = momento ? CAMINHOS_MOMENTO[momento] : null;
  const principal = caminho
    ? { rotulo: caminho.acao, destino: caminho.destino.startsWith("#") ? caminho.destino : caminhoComBairro(caminho.destino, bairroAtual), id: `momento_${momento}` }
    : { rotulo: "Simular agora", destino: "/projecao", id: "simular_agora" };
  return (
    <div className={isSlim ? "py-4" : "py-8"}>
      <div className="regua flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-[22px] font-semibold leading-tight text-foreground">Quer saber quanto seu studio pode render?</p>
          {!isSlim && <p className="mt-1 text-base text-muted-foreground font-body">Compare cenários, simule receita e descubra o potencial real do seu imóvel.</p>}
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Button asChild className="min-h-[44px] px-[18px] font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: principal.id, section: `midpage_${variant}` })}>
            {principal.destino.startsWith("#") ? <a href={principal.destino}>{principal.rotulo}</a> : <Link to={principal.destino}>{principal.rotulo}</Link>}
          </Button>
          <Button asChild variant="outline" className="min-h-[44px] px-[18px] font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "ferramentas", section: `midpage_${variant}` })}>
            <Link to="/ferramentas">Ferramentas</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
