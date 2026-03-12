import { useEffect, useRef, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import LazyMapaBairrosEmbed from "@/components/mapa/LazyMapaBairrosEmbed";
import bwildLogo from "@/assets/bwild-logo.png";
import { useGuideAnalytics, setGlobalTrack } from "@/hooks/useGuideAnalytics";
import { useScrollspy } from "@/hooks/useScrollspy";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import ScrollProgressBar from "@/components/guide/ScrollProgressBar";
import ResumeToast from "@/components/guide/ResumeToast";
import { BairroProvider, useBairroData } from "@/hooks/useBairroData";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import { SECTIONS, PHASES, fmt } from "@/data/guide-data";

// Guide section components
import HeroSection from "@/components/guide/HeroSection";
import TableOfContents from "@/components/guide/TableOfContents";
import MobileMenu from "@/components/guide/MobileMenu";
import MobileStickyBar from "@/components/guide/MobileStickyBar";
import SectionIntro from "@/components/guide/SectionIntro";
import PhaseHeader from "@/components/guide/PhaseHeader";
import ReservasSection from "@/components/guide/ReservasSection";
import MercadoSection from "@/components/guide/MercadoSection";
import SimuladorSection from "@/components/guide/SimuladorSection";
import ProjetoSection from "@/components/guide/ProjetoSection";
import EscolhaAtivoSection from "@/components/guide/EscolhaAtivoSection";
import RentabilidadeSection from "@/components/guide/RentabilidadeSection";
import AnuncioPrecificacaoSection from "@/components/guide/AnuncioPrecificacaoSection";
import DiagnosticoInvestidorSection from "@/components/guide/DiagnosticoInvestidorSection";
import RecomendacaoSection from "@/components/guide/RecomendacaoSection";
import PlanoAcaoSection from "@/components/guide/PlanoAcaoSection";
import MidPageCTA from "@/components/guide/MidPageCTA";
import ReformaSection from "@/components/guide/ReformaSection";
import AntiChecklistSection from "@/components/guide/AntiChecklistSection";
import DecoracaoSection from "@/components/guide/DecoracaoSection";
import CaseStudySection from "@/components/guide/CaseStudySection";
import ChecklistSection from "@/components/guide/ChecklistSection";
import TrustSignals from "@/components/guide/TrustSignals";
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

function IndexInner() {
  const sectionIds = SECTIONS.map((s) => s.id);
  const activeId = useScrollspy(sectionIds);
  const { trackEvent } = useGuideAnalytics();
  const { bairros } = useBairroData();
  const scrollMilestones = useRef(new Set<string>());
  const { scrollPercent, visitedSections, sectionIndex, sectionCount, resumeData, dismissResume } = useReadingProgress(activeId);

  useEffect(() => {
    setGlobalTrack(trackEvent);
    return () => setGlobalTrack(null);
  }, [trackEvent]);

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
      <AppNavbar />
      <ScrollProgressBar percent={scrollPercent} />
      <ResumeToast data={resumeData} onDismiss={dismissResume} />
      <TableOfContents activeId={activeId} visitedSections={visitedSections} />
      <MobileMenu activeId={activeId} sectionIndex={sectionIndex} sectionCount={sectionCount} />
      <MobileStickyBar />

      <main className="lg:ml-[60px] w-full flex flex-col items-center pb-24 lg:pb-8 pt-16 lg:pt-0">

        {/* ═══════════════════════════════════════════════════════
            FASE 1 — Entender o jogo
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10 py-0 lg:py-10">
            <HeroSection />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FASE 2 — Escolher onde investir
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(2)} />
          </div>
        </div>

        {/* Mapa de Bairros */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <section id="mapa-bairros" className="scroll-mt-24 py-16 md:py-20">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5 }}>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Mapa de Bairros Rentáveis</h2>
                <p className="text-muted-foreground text-lg mb-6">Analise demanda, compare bairros, simule ROI e identifique os melhores investimentos em studios.</p>
                <LazyMapaBairrosEmbed />
                <Card className="border-border overflow-hidden mt-8">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm font-body">
                        <thead className="bg-secondary">
                          <tr>
                            {["Bairro", "Diária mín.", "Ocupação média", "20–25 m²", "26–35 m²", "36–50 m²"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left font-semibold text-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bairros.map((b) => (
                            <tr key={b.name} className="border-t border-border hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                              <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.dailyMin)}</td>
                              <td className="px-4 py-3 text-muted-foreground">{b.avgOccupancy}%</td>
                              <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.avgBySize["20–25 m²"])}</td>
                              <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.avgBySize["26–35 m²"])}</td>
                              <td className="px-4 py-3 font-semibold text-foreground">R$ {fmt(b.avgBySize["36–50 m²"])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </section>
          </div>
        </div>

        {/* Mercado e Precificação */}
        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <MercadoSection />
          </div>
        </div>

        {/* Diagnóstico do Investidor */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <DiagnosticoInvestidorSection />
          </div>
        </div>

        {/* Intelligence CTA */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <MidPageCTA variant="slim" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FASE 3 — Avaliar o ativo
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(3)} />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <EscolhaAtivoSection />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FASE 4 — Validar a conta
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(4)} />
          </div>
        </div>

        {/* Rentabilidade didática */}
        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <RentabilidadeSection />
          </div>
        </div>

        {/* Simulador de Receita */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <SimuladorSection />
          </div>
        </div>

        {/* Recomendação Personalizada */}
        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <RecomendacaoSection />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FASE 5 — Construir o produto
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(5)} />
          </div>
        </div>

        {/* Reservas — o que move reservas */}
        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <ReservasSection />
          </div>
        </div>

        {/* Projeto Arquitetônico */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <ProjetoSection />
          </div>
        </div>

        {/* Reforma inteligente */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <ReformaSection />
          </div>
        </div>

        {/* Anti-checklist */}
        <div className="w-full bg-destructive/[0.02]">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <AntiChecklistSection />
          </div>
        </div>

        {/* Decoração estratégica */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <DecoracaoSection />
          </div>
        </div>

        {/* Tendências */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <Suspense fallback={<div className="py-16"><div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto" /></div>}>
              <TendenciasSection />
            </Suspense>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FASE 6 — Capturar receita
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(6)} />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <AnuncioPrecificacaoSection />
          </div>
        </div>

        {/* MidPageCTA between Fase 6 and 7 */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <MidPageCTA variant="slim" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FASE 7 — Agir com confiança
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(7)} />
          </div>
        </div>

        {/* Plano de Ação */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PlanoAcaoSection />
          </div>
        </div>

        {/* Case Study */}
        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <CaseStudySection />
          </div>
        </div>

        {/* Checklist */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <SectionIntro icon={CheckSquare} text="Avalie se você está pronto para dar o próximo passo" />
            <ChecklistSection />
          </div>
        </div>

        {/* Trust + FAQ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <TrustSignals />
            <FAQSection />
          </div>
        </div>

        {/* Final CTA */}
        <div className="w-full bg-hero-gradient">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <FinalCTASection />
          </div>
        </div>

        {/* Footer */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <footer className="text-center py-8 text-sm text-muted-foreground font-body">
              <img src={bwildLogo} alt="Bwild" className="h-6 w-auto mx-auto mb-3 opacity-60" />
              © 2026 Bwild · Guia do Investidor em Studios para Short Stay
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}
