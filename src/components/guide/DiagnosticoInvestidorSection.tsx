import { formatDecimal } from "@/lib/numberFormat";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRastrearSecao } from "./SectionBlock";
import { QUIZ_QUESTIONS, resolveProfile, type QuizAnswers, type InvestorProfile } from "@/lib/investorQuiz";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { cn } from "@/lib/utils";

const ROTULO_PESO: Record<string, string> = { retorno: "Retorno", demanda: "Demanda", operacao: "Operação", futuro: "Futuro" };

/**
 * Autoavaliação do investidor (/ferramentas#diagnostico), no padrão "Estudo aberto":
 * três perguntas em opções de texto (sem ícones), resultado com os pesos do perfil em
 * barras finas. Os pesos são critério interno da Bewild, não estatística de mercado.
 * O título da seção vem da tela (Secao); aqui fica o conteúdo.
 */
export default function DiagnosticoInvestidorSection() {
  const { investorProfile, setInvestorDiagnostic } = useGuideDecision();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQ = QUIZ_QUESTIONS[step];
  const totalSteps = QUIZ_QUESTIONS.length;
  const isComplete = !!investorProfile;

  const selectOption = (questionId: string, value: string) => {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);

    if (step < totalSteps - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      // All answered — resolve profile
      const quizAnswers: QuizAnswers = {
        objective: next.objective || "equilibrio",
        risk: next.risk || "moderado",
        priority: next.priority || "retorno",
      };
      const profile = resolveProfile(quizAnswers);
      setInvestorDiagnostic(quizAnswers, profile);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setInvestorDiagnostic(
      { objective: "", risk: "", priority: "" },
      null as unknown as InvestorProfile
    );
  };

  const ref = useRastrearSecao<HTMLDivElement>("diagnostico");

  return (
    <div ref={ref}>
      {!isComplete ? (
        <>
          {/* Progress */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              {QUIZ_QUESTIONS.map((_, i) => (
                <span key={i} className={cn("h-1 w-8", i <= step ? "bg-ciano" : "bg-neutro-200")} />
              ))}
            </div>
            <span className="e-legenda tabular-nums">Pergunta {step + 1} de {totalSteps}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="e-h3">{currentQ.question}</h3>
              <p className="e-apoio mb-5 mt-1">{currentQ.subtitle}</p>

              <ul className="grid grid-cols-1 border-t border-foreground md:grid-cols-3 md:gap-x-8">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.value;
                  return (
                    <li key={opt.value} className="e-fina border-b md:border-b-0">
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectOption(currentQ.id, opt.value)}
                        className={cn(
                          "group flex min-h-[44px] w-full flex-col items-start gap-1 border-l-[3px] py-4 pl-3 pr-2 text-left transition-colors",
                          isSelected ? "border-ciano bg-ciano-100/60" : "border-transparent hover:bg-foreground/[0.03]",
                        )}
                      >
                        <span className="text-[16px] font-semibold leading-6 group-hover:underline">{opt.label}</span>
                        <span className="e-apoio">{opt.description}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="mt-5 min-h-[44px] px-5 text-[15px] font-semibold">
                  Voltar à pergunta anterior
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        /* ── Resultado do perfil ── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="border-t border-foreground pt-4">
          <p className="e-rotulo">Seu perfil</p>
          <p className="e-h3 mt-1">{investorProfile.name}</p>
          <p className="e-apoio mt-2 max-w-[720px]">{investorProfile.description}</p>

          <p className="e-rotulo mt-6">Pesos na recomendação (critério interno)</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
            {Object.entries(investorProfile.weights).map(([key, weight]) => {
              const pct = Math.round(weight * 100);
              return (
                <div key={key} className="min-w-0">
                  <dt className="e-legenda">{ROTULO_PESO[key]}</dt>
                  <dd className="m-0">
                    <span className="e-numero-sm block">{formatDecimal(pct, 0)}%</span>
                    <span aria-hidden="true" className="mt-1 block h-1 bg-neutro-200"><span className="block h-full bg-ciano" style={{ width: `${pct}%` }} /></span>
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="e-legenda">O perfil personaliza a recomendação e o plano de ação abaixo.</p>
            <Button variant="outline" onClick={reset} className="min-h-[44px] px-5 text-[15px] font-semibold">Refazer a autoavaliação</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
