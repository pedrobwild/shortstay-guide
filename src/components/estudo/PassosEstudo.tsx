import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { destinoDoPasso, PASSOS_ESTUDO, passoDaRota, proximoPasso } from "@/data/passosEstudo";
import { useBairroAtual } from "@/lib/bairroAtual";
import { cn } from "@/lib/utils";

/**
 * Faixa "Passo n de 3" no topo das telas do estudo (bairro → conta → reforma): diz onde
 * a pessoa está, deixa voltar ou avançar e mostra o passo seguinte. Não aparece nas
 * outras telas. O bairro atual é lido depois da montagem (bairroAtual.ts), então o HTML
 * pré-renderizado sai sem ele e a hidratação coincide.
 */
export default function PassosEstudo() {
  const { pathname } = useLocation();
  const atual = useBairroAtual();
  const passo = passoDaRota(pathname);
  if (!passo) return null;
  const seguinte = proximoPasso(passo);

  return (
    <div className="border-b border-border bg-secondary/60">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-[72px]">
        <nav aria-label="Passos do estudo" className="min-w-0">
          <p className="e-rotulo">Passo {passo.numero} de {PASSOS_ESTUDO.length} · {passo.rotulo}</p>
          <ol className="m-0 mt-1 flex list-none flex-wrap items-center gap-x-0 gap-y-1 p-0 sm:gap-2">
            {PASSOS_ESTUDO.map((p) => {
              const emCurso = p.numero === passo.numero;
              return (
                <li key={p.numero} className="flex items-center gap-1 sm:gap-2">
                  {p.numero > 1 && <span aria-hidden="true" className="hidden h-px w-6 bg-input sm:block" />}
                  <Link
                    to={destinoDoPasso(p, atual?.slug)}
                    aria-current={emCurso ? "step" : undefined}
                    onClick={() => trackGlobal("cta_clicked", { cta_id: `passo_${p.numero}`, section: "passos_estudo" })}
                    className={cn(
                      "inline-flex min-h-[44px] items-center gap-1.5 rounded-[7px] px-1.5 text-sm font-medium transition-colors sm:gap-2 sm:px-3",
                      emCurso ? "bg-card text-foreground shadow-segmented" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                        emCurso ? "bg-primary text-primary-foreground" : "border border-input",
                      )}
                    >
                      {p.numero}
                    </span>
                    <span><span className="sr-only">Passo {p.numero}: </span>{p.curto}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
        {seguinte && (
          <Link
            to={destinoDoPasso(seguinte, atual?.slug)}
            onClick={() => trackGlobal("cta_clicked", { cta_id: `passo_seguinte_${seguinte.numero}`, section: "passos_estudo" })}
            className="e-link inline-flex min-h-[44px] shrink-0 items-center gap-2 text-sm font-medium"
          >
            Próximo passo: {seguinte.rotulo.charAt(0).toLowerCase() + seguinte.rotulo.slice(1)}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
