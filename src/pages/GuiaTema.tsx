import type { ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import NotFound from "@/pages/NotFound";
import OrcamentoButton from "@/components/OrcamentoButton";
import { ModoPaginaGuia } from "@/components/guide/modoPaginaGuia";
import ReservasSection from "@/components/guide/ReservasSection";
import AntiChecklistSection from "@/components/guide/AntiChecklistSection";
import DecoracaoSection from "@/components/guide/DecoracaoSection";
import AnuncioPrecificacaoSection from "@/components/guide/AnuncioPrecificacaoSection";
// Carregada junto com a página (na home é sob demanda): a pré-renderização estática precisa do conteúdo pronto.
import TendenciasSection from "@/components/guide/TendenciasSection";
import EscolhaAtivoSection from "@/components/guide/EscolhaAtivoSection";
import RentabilidadeSection from "@/components/guide/RentabilidadeSection";
import ReformaSection from "@/components/guide/ReformaSection";
import ChecklistSection from "@/components/guide/ChecklistSection";
import { BairroProvider } from "@/hooks/useBairroData";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import { Button } from "@/components/ui/button";
import { TEMAS_GUIA, temaPorSlug, type SlugTemaGuia } from "@/data/temasGuia";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import ClientOnly from "@/components/ClientOnly";
import PedidoMaterial from "@/components/captacao/PedidoMaterial";


/** Seção do guia que cada tema renderiza por completo (mesmo componente da home, em modo página). */
const SECOES: Record<SlugTemaGuia, ComponentType> = {
  hospede: ReservasSection,
  "anti-checklist": AntiChecklistSection,
  decoracao: DecoracaoSection,
  tendencias: TendenciasSection,
  "anuncio-e-precificacao": AnuncioPrecificacaoSection,
  "escolha-do-ativo": EscolhaAtivoSection,
  rentabilidade: RentabilidadeSection,
  reforma: ReformaSection,
  checklist: ChecklistSection,
};

/** Temas que terminam com a oferta do checklist por e-mail (captura leve, P0.2). */
const TEMAS_COM_CHECKLIST: ReadonlySet<SlugTemaGuia> = new Set<SlugTemaGuia>(["checklist", "escolha-do-ativo"]);

/**
 * Conteúdo da página de um tema (sem navbar e rodapé), também usado pela
 * pré-renderização estática: a seção completa, o caminho de volta ao guia e
 * os próximos passos. Em modo página a seção ignora `resumido`.
 */
export function ConteudoTema({ slug }: { slug: SlugTemaGuia }) {
  const tema = temaPorSlug(slug)!;
  const Secao = SECOES[slug];
  const indice = TEMAS_GUIA.findIndex((t) => t.slug === slug);
  const proximo = TEMAS_GUIA[(indice + 1) % TEMAS_GUIA.length];
  return (
    <BairroProvider>
    <GuideDecisionProvider>
    <ModoPaginaGuia.Provider value>
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-[72px]">
        <nav aria-label="Caminho" className="flex min-h-[44px] flex-wrap items-center gap-1.5 pt-6 text-xs text-muted-foreground">
          <Link to="/#guia" className="hover:text-foreground">Guia por tema</Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="text-foreground">{tema.titulo}</span>
        </nav>
        <Secao />
        {/* Fora do HTML estático: o formulário só funciona com o app carregado (e nunca põe o e-mail na URL). */}
        {TEMAS_COM_CHECKLIST.has(slug) && (
          <ClientOnly>
            <div className="py-6">
              <PedidoMaterial material="checklist_compra" origem="guia" />
            </div>
          </ClientOnly>
        )}
        <div className="regua flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="e-h3">Próximo passo</p>
            <p className="mt-1 text-sm text-muted-foreground">Leve o que leu para a conta do seu studio ou peça o orçamento da reforma.</p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Button asChild className="min-h-[44px] px-[18px] font-semibold" onClick={() => trackGlobal("cta_clicked", { cta_id: "simular", section: `guia_${slug}` })}>
              <Link to="/projecao">Simular meu studio</Link>
            </Button>
            <OrcamentoButton local="guia" variant="outline" className="min-h-[44px] px-[18px] font-semibold" />
          </div>
        </div>
        <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link to="/#guia" className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-primary underline underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Todos os temas</Link>
          <Link to={`/guia/${proximo.slug}`} className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-primary underline underline-offset-4">Próximo tema: {proximo.titulo}<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </main>
    </ModoPaginaGuia.Provider>
    </GuideDecisionProvider>
    </BairroProvider>
  );
}

/** /guia/<tema>: página própria do conteúdo educativo do guia. */
export default function GuiaTema() {
  const { tema = "" } = useParams<{ tema: string }>();
  const t = temaPorSlug(tema);
  // Tema inexistente é um 404 de verdade (noindex pelo RouteSeo), não um redirecionamento para a home.
  if (!t) return <NotFound />;
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar fixo={false} />
      <ConteudoTema slug={t.slug} />
      <RodapeRadar />
    </div>
  );
}
