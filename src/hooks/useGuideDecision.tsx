/**
 * Guide Decision Context
 * Shares investor profile, unit score, and selected bairro across guide sections.
 * Lightweight context that transforms the guide from static content to a decision system.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { resolveProfile, type InvestorProfile, type QuizAnswers } from "@/lib/investorQuiz";

/**
 * As respostas do diagnóstico ficam neste navegador (até 30 dias) para que o perfil
 * feito em /ferramentas também personalize a home. Só as 3 respostas — o perfil é
 * recalculado a partir delas, então muda junto se o critério interno mudar.
 */
const CHAVE_PERFIL = "radar_perfil_investidor";
const PERFIL_MAX_IDADE_MS = 30 * 24 * 60 * 60 * 1000;

function lerRespostasSalvas(): QuizAnswers | null {
  try {
    const bruto = localStorage.getItem(CHAVE_PERFIL);
    if (!bruto) return null;
    const v = JSON.parse(bruto) as { respostas?: QuizAnswers; quando?: number };
    if (!v.respostas || typeof v.quando !== "number" || Date.now() - v.quando > PERFIL_MAX_IDADE_MS) return null;
    const { objective, risk, priority } = v.respostas;
    return objective && risk && priority && typeof objective === "string" && typeof risk === "string" && typeof priority === "string" ? v.respostas : null;
  } catch {
    return null;
  }
}

export interface UnitScore {
  total: number;
  max: number;
  pct: number;
  tier: string;
  categoryScores: { key: string; label: string; checked: number; total: number }[];
}

export interface GuideDecisionState {
  // Investor Profile
  quizAnswers: QuizAnswers | null;
  investorProfile: InvestorProfile | null;
  setInvestorDiagnostic: (answers: QuizAnswers, profile: InvestorProfile) => void;
  // Unit Evaluation
  unitScore: UnitScore | null;
  setUnitScore: (score: UnitScore) => void;
  // Selected bairro for recommendation
  selectedBairro: string | null;
  setSelectedBairro: (bairro: string) => void;
  // Computed readiness
  hasProfile: boolean;
  hasUnitScore: boolean;
  isReady: boolean;
}

const GuideDecisionContext = createContext<GuideDecisionState | null>(null);

export function GuideDecisionProvider({ children }: { children: ReactNode }) {
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [unitScore, setUnitScore] = useState<UnitScore | null>(null);
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null);

  // Carrega no navegador (não no SSR) para o HTML pré-renderizado e a hidratação coincidirem.
  useEffect(() => {
    const salvas = lerRespostasSalvas();
    if (!salvas) return;
    setQuizAnswers(salvas);
    setInvestorProfile(resolveProfile(salvas));
  }, []);

  const setInvestorDiagnostic = (answers: QuizAnswers, profile: InvestorProfile) => {
    setQuizAnswers(answers);
    setInvestorProfile(profile);
    try {
      // "Refazer" chega aqui sem perfil: apaga o salvo em vez de gravar respostas vazias.
      if (profile && answers.objective && answers.risk && answers.priority) localStorage.setItem(CHAVE_PERFIL, JSON.stringify({ respostas: answers, quando: Date.now() }));
      else localStorage.removeItem(CHAVE_PERFIL);
    } catch { /* sem armazenamento: vale só nesta tela */ }
  };

  const hasProfile = !!investorProfile;
  const hasUnitScore = !!unitScore && unitScore.total > 0;
  const isReady = hasProfile;

  return (
    <GuideDecisionContext.Provider
      value={{
        quizAnswers, investorProfile, setInvestorDiagnostic,
        unitScore, setUnitScore,
        selectedBairro, setSelectedBairro,
        hasProfile, hasUnitScore, isReady,
      }}
    >
      {children}
    </GuideDecisionContext.Provider>
  );
}

export function useGuideDecision() {
  const ctx = useContext(GuideDecisionContext);
  if (!ctx) throw new Error("useGuideDecision must be used inside GuideDecisionProvider");
  return ctx;
}
