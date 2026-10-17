import AppNavbar from "@/components/AppNavbar";
import { useState, useMemo, lazy, Suspense } from "react";
import { useBairrosData, rotuloEstimativa } from "@/hooks/useIntelligenceData";
import FonteBairro from "@/components/guide/FonteBairro";
import { FONTE_BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Lightbulb, BookOpen, BarChart3, Target,
  Building2, Trophy, ChevronRight, GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FOOTER_DISCLAIMER } from "@/lib/uiHelpers";
import type { QuizAnswers, InvestorProfile } from "@/lib/investorQuiz";
// Cada etapa da jornada é carregada só quando a pessoa chega nela (antes: um arquivo de 2.000 linhas).
const Step1Context = lazy(() => import("@/components/intelligence/jornada/Step1").then((m) => ({ default: m.Step1Context })));
const Step2Highlights = lazy(() => import("@/components/intelligence/jornada/Step2").then((m) => ({ default: m.Step2Highlights })));
const Step3Learn = lazy(() => import("@/components/intelligence/jornada/Step3").then((m) => ({ default: m.Step3Learn })));
const Step4Learnings = lazy(() => import("@/components/intelligence/jornada/Step4").then((m) => ({ default: m.Step4Learnings })));
const Step5Compare = lazy(() => import("@/components/intelligence/jornada/Step5").then((m) => ({ default: m.Step5Compare })));
const Step6Profile = lazy(() => import("@/components/intelligence/jornada/Step6").then((m) => ({ default: m.Step6Profile })));
const Step7Explore = lazy(() => import("@/components/intelligence/jornada/Step7").then((m) => ({ default: m.Step7Explore })));
const Step8Recommendation = lazy(() => import("@/components/intelligence/jornada/Step8").then((m) => ({ default: m.Step8Recommendation })));

function EtapaCarregando() {
  return (
    <div className="space-y-3 py-6" aria-busy="true" aria-label="Carregando etapa">
      <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-muted/70 animate-pulse" />
      <div className="h-48 rounded-lg bg-muted/40 animate-pulse" />
    </div>
  );
}

// ── Step definitions ─────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Contexto", icon: MapPin, shortLabel: "1" },
  { id: 2, label: "Destaques", icon: Lightbulb, shortLabel: "2" },
  { id: 3, label: "Indicadores", icon: BookOpen, shortLabel: "3" },
  { id: 4, label: "Aprendizados", icon: GraduationCap, shortLabel: "4" },
  { id: 5, label: "Compare", icon: BarChart3, shortLabel: "5" },
  { id: 6, label: "Seu perfil", icon: Target, shortLabel: "6" },
  { id: 7, label: "Explore", icon: Building2, shortLabel: "7" },
  { id: 8, label: "Recomendação", icon: Trophy, shortLabel: "8" },
];

const IntelligenceDashboard = () => {
  const { data: bairros, isLoading } = useBairrosData();
  const [currentStep, setCurrentStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar fixo={false} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="space-y-4 w-full max-w-md px-4">
            <div className="h-8 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 bg-muted/70 rounded animate-pulse w-3/4" />
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bairros?.length) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar fixo={false} />
        <main className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Não há dados de mercado para mostrar agora</h1>
          <p className="text-sm text-muted-foreground">A base do Radar não respondeu ou está vazia. Tente recarregar a página em instantes.</p>
          <Button className="min-h-[44px]" onClick={() => window.location.reload()}>Recarregar</Button>
        </main>
      </div>
    );
  }

  const goTo = (step: number) => setCurrentStep(step);
  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 8));

  const handleQuizComplete = (answers: QuizAnswers, profile: InvestorProfile) => {
    setQuizAnswers(answers);
    setInvestorProfile(profile);
    goNext();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar fixo={false} />
      {/* ── HERO ──────────────────────────────────────────── */}
      <header className="bg-hero-gradient text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--accent)_/_0.3),_transparent_70%)]" />
        <div className="container mx-auto px-4 py-8 md:py-10 relative z-10">
          <div className="flex items-start justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-xs uppercase tracking-wider">
                  Guia de investimento
                </Badge>
                <Badge className="bg-primary-foreground/10 text-primary-foreground/70 border-primary-foreground/10 text-xs">
                  {bairros.length} bairros · 30+ variáveis
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-[var(--font-display)] leading-tight">
                Inteligência de mercado
              </h1>
              <p className="mt-2 text-primary-foreground/80 text-sm md:text-base leading-relaxed max-w-xl">
                Uma jornada guiada para ajudar você a decidir onde investir em studios de short stay em São Paulo.
              </p>
              {bairros[0] && (
                <p className="mt-2 text-xs text-primary-foreground/70 max-w-xl">
                  {FONTE_BAIRROS_CURADOS} Demais métricas: {rotuloEstimativa(bairros[0])}.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{bairros.map((b) => <div key={b.bairro}><span className="text-xs">{b.bairro}</span><FonteBairro nome={b.bairro} inverse /></div>)}</div>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-1.5 w-32 bg-primary-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-foreground/40 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / 8) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-primary-foreground/50 font-medium">
                  Etapa {currentStep} de 8
                </span>
              </div>
            </div>
            <Link to="/" className="shrink-0">
              <Button variant="secondary" size="sm" className="shadow-lg">
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── TAB NAV (sticky) ──────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none py-2">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => goTo(step.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : isPast
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold shrink-0 ${
                    isActive ? "bg-primary-foreground/20" : isPast ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {isPast ? "✓" : step.shortLabel}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── STEP CONTENT ─────────────────────────────────── */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Suspense fallback={<EtapaCarregando />}>
            {currentStep === 1 && <Step1Context bairros={bairros} onNext={goNext} />}
            {currentStep === 2 && <Step2Highlights bairros={bairros} onNext={goNext} />}
            {currentStep === 3 && <Step3Learn onNext={goNext} />}
            {currentStep === 4 && <Step4Learnings bairros={bairros} onNext={goNext} />}
            {currentStep === 5 && <Step5Compare bairros={bairros} onNext={goNext} />}
            {currentStep === 6 && <Step6Profile bairros={bairros} onComplete={handleQuizComplete} />}
            {currentStep === 7 && <Step7Explore bairros={bairros} onNext={goNext} />}
            {currentStep === 8 && (
              <Step8Recommendation
                bairros={bairros}
                profile={investorProfile}
                answers={quizAnswers}
              />
            )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default IntelligenceDashboard;
