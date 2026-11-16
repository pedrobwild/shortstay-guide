import { Link, useLocation } from "react-router-dom";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { linkAtivo, VISOES_BAIRROS } from "@/data/navegacao";
import { cn } from "@/lib/utils";

/**
 * Seletor das visões da área Bairros (Lista · Mapa · Comparar), no topo de /ranking,
 * /mapa e /comparar. O item "Bairros" do menu abre a lista; daqui a pessoa troca de
 * visão sem voltar ao menu. O bairro escolhido segue pelo bairro atual (bairroAtual.ts).
 */
export default function VisoesBairros({ className }: { className?: string }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Visões dos bairros" className={cn("mb-6 inline-flex max-w-full rounded-[9px] bg-secondary p-[3px]", className)}>
      {VISOES_BAIRROS.map((v) => {
        const ativo = linkAtivo(v, pathname);
        return (
          <Link
            key={v.id}
            to={v.to}
            aria-current={ativo ? "page" : undefined}
            onClick={() => trackGlobal("cta_clicked", { cta_id: v.id, section: "visoes_bairros" })}
            className={cn(
              // Mesmo desenho do Segmentado (trilho cinza, opção ativa branca), com 44px de altura por ser link.
              "inline-flex min-h-[44px] min-w-[72px] items-center justify-center whitespace-nowrap rounded-[7px] px-4 text-sm font-medium transition-colors",
              ativo ? "bg-card text-foreground shadow-segmented" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
