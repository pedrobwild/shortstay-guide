import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PaginaEstudo } from "@/components/estudo/Estrutura";
import { CAMINHO_AREA_EXCLUSIVA, artigoExclusivoPorSlug, type SlugArtigoExclusivo } from "@/data/artigosExclusivos";

/** Cada artigo em um pedaço próprio do bundle: só carrega depois do login. */
const ARTIGOS: Record<SlugArtigoExclusivo, LazyExoticComponent<ComponentType>> = {
  pinheiros: lazy(() => import("@/components/exclusivo/ArtigoPinheiros")),
  brooklin: lazy(() => import("@/components/exclusivo/ArtigoBrooklin")),
};

export default function ArtigoExclusivo() {
  const { artigo: slug } = useParams();
  const artigo = artigoExclusivoPorSlug(slug);
  // Endereço desconhecido volta para a lista (a área é privada; não há página de erro indexável).
  if (!artigo) return <Navigate to={CAMINHO_AREA_EXCLUSIVA} replace />;
  const Artigo = ARTIGOS[artigo.slug];
  return (
    <PaginaEstudo>
      <Suspense fallback={<div role="status" className="flex min-h-[50vh] items-center justify-center gap-2 text-tinta-70"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />Carregando a análise…</div>}>
        <Artigo />
      </Suspense>
    </PaginaEstudo>
  );
}
