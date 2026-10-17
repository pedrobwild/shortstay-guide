import { useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import OrcamentoButton from "@/components/OrcamentoButton";
import AppNavbar from "@/components/AppNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import LazyMapaBairrosEmbed from "@/components/mapa/LazyMapaBairrosEmbed";
import bwildLogo from "@/assets/bewild-logo.webp";
import { useGuideAnalytics, setGlobalTrack, setGlobalSessionId } from "@/hooks/useGuideAnalytics";
import { useScrollspy } from "@/hooks/useScrollspy";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import ScrollProgressBar from "@/components/guide/ScrollProgressBar";
import ResumeToast from "@/components/guide/ResumeToast";
import ClientOnly from "@/components/ClientOnly";
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
import FonteBairro from "@/components/guide/FonteBairro";
import FaixaQuartis from "@/components/guide/FaixaQuartis";
import { FONTE_BAIRROS_CURADOS, rotuloOcupacao } from "@/data/bairrosCurados";
import { notaFontesComplementares } from "@/lib/radarBase";

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
  const { trackEvent, sessionId } = useGuideAnalytics();
  const { bairros } = useBairroData();
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
      <AppNavbar />
      <ClientOnly><ScrollProgressBar percent={scrollPercent} /></ClientOnly>
      <ClientOnly><ResumeToast data={resumeData} onDismiss={dismissResume} /></ClientOnly>
      <TableOfContents activeId={activeId} visitedSections={visitedSections} />
      <MobileMenu activeId={activeId} sectionIndex={sectionIndex} sectionCount={sectionCount} />
      <MobileStickyBar />

      <main className="lg:ml-[60px] w-full lg:w-[calc(100%-60px)] flex flex-col items-center pb-24 lg:pb-8 pt-16 lg:pt-0">

        {/* ═══ HERO ═══ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10 py-0 lg:py-10">
            <HeroSection />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            BLOCO 1 — Onde investir
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(1)} />
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
                <Card className="border-border overflow-hidden mt-8 min-w-0 max-w-full">
                  <CardContent className="p-0">
                    <div className="min-w-0">
                      <table className="block lg:table w-full text-sm font-body">
                        <thead className="hidden lg:table-header-group bg-secondary">
                          <tr>
                            {["Bairro", "Diária média (ADR)", "Ocupação média", "Diária: 25% mais baratos", "Diária: mediana", "Diária: 25% mais caros"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left font-semibold text-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="block lg:table-row-group">
                          {bairros.map((b) => (
                            <tr key={b.name} className="grid grid-cols-3 lg:table-row border-t border-border hover:bg-muted/50 transition-colors">
                              <td className="block lg:table-cell col-span-3 px-4 py-3 font-medium text-foreground">{b.name}<FonteBairro nome={b.name} /></td>
                              <td className="block lg:table-cell col-span-2 px-4 py-3 text-muted-foreground"><span className="block lg:hidden text-xs">Diária média (ADR)</span>R$ {fmt(b.dailyAvg)}</td>
                              <td className="block lg:table-cell px-4 py-3 text-muted-foreground"><span className="block lg:hidden text-xs">Ocupação média</span>{rotuloOcupacao(b)}</td>
                              <td className="col-span-3 px-4 pb-4 lg:hidden">{b.dailyQuartiles ? <FaixaQuartis quartis={b.dailyQuartiles} /> : <span className="text-xs text-muted-foreground">Sem quartis publicados para este bairro.</span>}</td>
                              <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground"><span className="block lg:hidden text-xs">Diária: 25% mais baratos</span>{b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[0])}` : "—"}</td>
                              <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground"><span className="block lg:hidden text-xs">Diária: mediana</span>{b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[1])}` : "—"}</td>
                              <td className="hidden lg:table-cell px-4 py-3 font-semibold text-foreground"><span className="block lg:hidden text-xs">Diária: 25% mais caros</span>{b.dailyQuartiles ? `R$ ${fmt(b.dailyQuartiles[2])}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-col gap-1 px-4 py-3 border-t border-border sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">{FONTE_BAIRROS_CURADOS} {notaFontesComplementares(bairros)}</p>
                      <Link to="/comparar" className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-medium text-primary underline underline-offset-4">Comparar bairros lado a lado</Link>
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

        {/* ═══════════════════════════════════════════════════════
            BLOCO 2 — Como validar a conta
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(2)} />
            <PerfilInvestidorAtalho />
          </div>
        </div>

        {/* Escolha do Ativo */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <EscolhaAtivoSection />
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

        {/* CTA intermediário */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <MidPageCTA variant="slim" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            BLOCO 3 — O que faz um studio performar
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(3)} />
          </div>
        </div>

        {/* O que move reservas */}
        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <ReservasSection />
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
            BLOCO 4 — Como agir com confiança
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(4)} />
          </div>
        </div>

        {/* Anúncio e Precificação */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <AnuncioPrecificacaoSection />
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
              <img src={bwildLogo} alt="Bewild" className="h-6 w-auto mx-auto mb-3 opacity-60" />
              <Link to="/ferramentas" className="text-primary hover:underline mb-2 inline-block">Ferramentas do Investidor →</Link>
              <p>Um produto <a href="https://bewild.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">Bewild</a></p>
              <div className="flex flex-wrap justify-center items-center gap-4 mt-3">
                <a href="https://bewild.com.br/privacidade" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-primary underline">Política de privacidade</a>
                <OrcamentoButton local="rodape" variant="link" className="min-h-[44px]" />
              </div>
              <p>© 2026 Bewild · Guia do Investidor em Studios para Short Stay</p>
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}
