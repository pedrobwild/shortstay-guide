import { useEffect, useRef, lazy, Suspense, type ReactNode } from "react";
import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import { CheckSquare } from "lucide-react";
import { useGuideAnalytics, setGlobalTrack, setGlobalSessionId } from "@/hooks/useGuideAnalytics";
import { useScrollspy } from "@/hooks/useScrollspy";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import ScrollProgressBar from "@/components/guide/ScrollProgressBar";
import ResumeToast from "@/components/guide/ResumeToast";
import ClientOnly from "@/components/ClientOnly";
import { BairroProvider } from "@/hooks/useBairroData";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import { SECTIONS, PHASES } from "@/data/guide-data";
import { cn } from "@/lib/utils";

// Guide section components
import HeroSection from "@/components/guide/HeroSection";
import PreviaDadosSection from "@/components/guide/PreviaDadosSection";
import FontesAtualizacaoSection from "@/components/guide/FontesAtualizacaoSection";
import FaixaBewild from "@/components/guide/FaixaBewild";
import TableOfContents from "@/components/guide/TableOfContents";
import MenuSecoesGuia from "@/components/guide/MobileMenu";
import MobileStickyBar from "@/components/guide/MobileStickyBar";
import SectionIntro from "@/components/guide/SectionIntro";
import PhaseHeader from "@/components/guide/PhaseHeader";
import ReservasSection from "@/components/guide/ReservasSection";
import MercadoSection from "@/components/guide/MercadoSection";
import SimuladorSection from "@/components/guide/SimuladorSection";
import EscolhaAtivoSection from "@/components/guide/EscolhaAtivoSection";
import RentabilidadeSection from "@/components/guide/RentabilidadeSection";
import AnuncioPrecificacaoSection from "@/components/guide/AnuncioPrecificacaoSection";
import MidPageCTA from "@/components/guide/MidPageCTA";
import ReformaSection from "@/components/guide/ReformaSection";
import AntiChecklistSection from "@/components/guide/AntiChecklistSection";
import DecoracaoSection from "@/components/guide/DecoracaoSection";
import CaseStudySection from "@/components/guide/CaseStudySection";
import ChecklistSection from "@/components/guide/ChecklistSection";
import TrustSignals from "@/components/guide/TrustSignals";
import PerfilInvestidorAtalho from "@/components/guide/PerfilInvestidorAtalho";
import FAQSection from "@/components/guide/FAQSection";
import FinalCTASection from "@/components/guide/FinalCTASection";

const TendenciasSection = lazy(() => import("@/components/guide/TendenciasSection"));

export default function Index() {
  return (
    <BairroProvider>
      <GuideDecisionProvider>
        <IndexInner />
      </GuideDecisionProvider>
    </BairroProvider>
  );
}

/** Faixa de conteúdo: até 1280px com margens de 40px; `branca` vira superfície com linhas finas em cima e embaixo. */
function Faixa({ children, branca = false }: { children: ReactNode; branca?: boolean }) {
  return (
    <div className={cn("w-full", branca && "border-y border-border bg-card")}>
      <div className="mx-auto max-w-[1280px] px-5 lg:px-10">{children}</div>
    </div>
  );
}

function IndexInner() {
  const sectionIds = SECTIONS.map((s) => s.id);
  const activeId = useScrollspy(sectionIds);
  const { trackEvent, sessionId } = useGuideAnalytics();
  const scrollMilestones = useRef(new Set<string>());
  const { scrollPercent, visitedSections, sectionIndex, sectionCount, resumeData, dismissResume } = useReadingProgress(activeId);

  useEffect(() => {
    setGlobalTrack(trackEvent);
    setGlobalSessionId(sessionId);
    return () => {
      setGlobalTrack(null);
      setGlobalSessionId(null);
    };
  }, [trackEvent, sessionId]);

  useEffect(() => {
    trackEvent("page_view", { referrer: document.referrer, ua: navigator.userAgent });
  }, [trackEvent]);

  useEffect(() => {
    const handler = () => {
      const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !scrollMilestones.current.has(`scroll_${m}`)) {
          scrollMilestones.current.add(`scroll_${m}`);
          trackEvent(`scroll_${m}`, {});
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [trackEvent]);

  const phase = (n: number) => PHASES[n - 1];

  return (
    <>
      <AppNavbar
        comTrilhoGuia
        menuGuia={(fechar) => <MenuSecoesGuia activeId={activeId} onNavegar={fechar} />}
        progressoGuia={`Guia do investidor · seção ${sectionIndex} de ${sectionCount}`}
      />
      <ClientOnly><ScrollProgressBar percent={scrollPercent} /></ClientOnly>
      <ClientOnly><ResumeToast data={resumeData} onDismiss={dismissResume} /></ClientOnly>
      <TableOfContents activeId={activeId} visitedSections={visitedSections} />
      <MobileStickyBar />

      <main id="conteudo" tabIndex={-1} className="flex w-full flex-col items-center pb-24 lg:ml-[60px] lg:w-[calc(100%-60px)] lg:pb-0">

        {/* ═══ HERO: três portas (bairro → conta → reforma) e carimbo de referência ═══ */}
        <Faixa><HeroSection /></Faixa>

        {/* ═══════════════════════════════════════════════════════
            BLOCO 1 — Onde investir (01 · Escolher o bairro)
        ═══════════════════════════════════════════════════════ */}
        <PreviaDadosSection />
        <Faixa><FontesAtualizacaoSection /></Faixa>

        {/* Quem produz o Radar: autoridade perto das decisões, provas oficiais */}
        <FaixaBewild />

        {/* Fase 1 do guia (a prévia acima é a porta de entrada): mercado e indicadores */}
        <Faixa><PhaseHeader {...phase(1)} /></Faixa>

        {/* Mercado e Precificação */}
        <Faixa branca><MercadoSection /></Faixa>

        {/* ═══════════════════════════════════════════════════════
            BLOCO 2 — Como validar a conta
        ═══════════════════════════════════════════════════════ */}
        <Faixa>
          <PhaseHeader {...phase(2)} />
          <PerfilInvestidorAtalho />
        </Faixa>

        {/* Escolha do Ativo */}
        <Faixa><EscolhaAtivoSection /></Faixa>

        {/* Rentabilidade didática */}
        <Faixa branca><RentabilidadeSection /></Faixa>

        {/* Simulador de Receita */}
        <Faixa><SimuladorSection /></Faixa>

        {/* Case de operação ao lado da análise: evidência junto do tema */}
        <Faixa branca><CaseStudySection /></Faixa>

        {/* CTA intermediário */}
        <Faixa><MidPageCTA variant="slim" /></Faixa>

        {/* ═══════════════════════════════════════════════════════
            BLOCO 3 — O que faz um studio performar
        ═══════════════════════════════════════════════════════ */}
        <Faixa><PhaseHeader {...phase(3)} /></Faixa>

        {/* O que influencia a escolha do hóspede */}
        <Faixa branca><ReservasSection /></Faixa>

        {/* Reforma inteligente */}
        <Faixa><ReformaSection /></Faixa>

        {/* Anti-checklist */}
        <Faixa branca><AntiChecklistSection /></Faixa>

        {/* Decoração estratégica */}
        <Faixa><DecoracaoSection /></Faixa>

        {/* Tendências */}
        <Faixa>
          <Suspense fallback={<div className="py-16"><div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" /></div>}>
            <TendenciasSection />
          </Suspense>
        </Faixa>

        {/* ═══════════════════════════════════════════════════════
            BLOCO 4 — Como agir com confiança
        ═══════════════════════════════════════════════════════ */}
        <Faixa><PhaseHeader {...phase(4)} /></Faixa>

        {/* Anúncio e Precificação */}
        <Faixa><AnuncioPrecificacaoSection /></Faixa>

        {/* Checklist */}
        <Faixa>
          <SectionIntro icon={CheckSquare} text="Avalie se você está pronto para dar o próximo passo" />
          <ChecklistSection />
        </Faixa>

        {/* Trust + FAQ */}
        <Faixa>
          <TrustSignals />
          <FAQSection />
        </Faixa>

        {/* Próximo passo: preparar a reforma */}
        <div className="w-full border-t border-border bg-card">
          <div className="mx-auto max-w-[1280px] px-5 lg:px-10"><FinalCTASection /></div>
        </div>

        <RodapeRadar />
      </main>
    </>
  );
}
