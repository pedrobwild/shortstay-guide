import { useState, useMemo } from "react";
import { useBairrosData } from "@/hooks/useIntelligenceData";
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
import {
  Step1Context,
  Step2Highlights,
  Step3Learn,
  Step4Learnings,
  Step5Compare,
  Step6Profile,
  Step7Explore,
  Step8Recommendation,
} from "@/components/intelligence/JourneySteps";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <div className="h-8 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 bg-muted/70 rounded animate-pulse w-3/4" />
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!bairros?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum dado disponível.</p>
      </div>
    );
  }

  const goTo = (step: number) => setCurrentStep(step);
  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 7));

  const handleQuizComplete = (answers: QuizAnswers, profile: InvestorProfile) => {
    setQuizAnswers(answers);
    setInvestorProfile(profile);
    goNext();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ──────────────────────────────────────────── */}
      <header className="bg-hero-gradient text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(200_60%_35%_/_0.3),_transparent_70%)]" />
        <div className="container mx-auto px-4 py-8 md:py-10 relative z-10">
          <div className="flex items-start justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] uppercase tracking-wider">
                  Guia de investimento
                </Badge>
                <Badge className="bg-primary-foreground/10 text-primary-foreground/70 border-primary-foreground/10 text-[10px]">
                  {bairros.length} bairros · 30+ variáveis
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-[var(--font-display)] leading-tight">
                Short Stay Intelligence
              </h1>
              <p className="mt-2 text-primary-foreground/80 text-sm md:text-base leading-relaxed max-w-xl">
                Uma jornada guiada para ajudar você a decidir onde investir em studios de short stay em São Paulo.
              </p>
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
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 ${
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 1 && <Step1Context bairros={bairros} onNext={goNext} />}
            {currentStep === 2 && <Step2Highlights bairros={bairros} onNext={goNext} />}
            {currentStep === 3 && <Step3Learn onNext={goNext} />}
            {currentStep === 4 && <Step4Compare bairros={bairros} onNext={goNext} />}
            {currentStep === 5 && <Step5Profile onComplete={handleQuizComplete} />}
            {currentStep === 6 && <Step6Explore bairros={bairros} onNext={goNext} />}
            {currentStep === 7 && (
              <Step7Recommendation
                bairros={bairros}
                profile={investorProfile}
                answers={quizAnswers}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default IntelligenceDashboard;
