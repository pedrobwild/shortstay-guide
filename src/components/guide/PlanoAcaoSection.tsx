import OrcamentoButton from "@/components/OrcamentoButton";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useRastrearSecao } from "./SectionBlock";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { cn } from "@/lib/utils";

/**
 * Plano de ação (/ferramentas#plano-acao), no padrão "Estudo aberto": etapas numeradas
 * com o estado em tag de texto (não só cor), cada uma levando à tela que resolve a etapa.
 */
interface ActionStep {
  title: string;
  description: string;
  status: "done" | "action" | "warning" | "pending";
  href?: string;
}

export default function PlanoAcaoSection() {
  const { investorProfile, hasProfile, unitScore, hasUnitScore } = useGuideDecision();
  const ref = useRastrearSecao<HTMLDivElement>("plano-acao");

  const steps = useMemo((): ActionStep[] => {
    const result: ActionStep[] = [];

    // Step 1: Profile
    result.push({
      title: "Definir perfil de investidor",
      description: hasProfile
        ? `Perfil definido: ${investorProfile!.name}. Recomendações personalizadas ativas.`
        : "Complete a autoavaliação para personalizar suas recomendações.",
      status: hasProfile ? "done" : "action",
      href: "/ferramentas#diagnostico",
    });

    // Step 2: Bairro
    result.push({
      title: "Escolher o bairro",
      description: hasProfile
        ? "Use o ranking personalizado e o mapa para identificar os melhores bairros para seu perfil."
        : "Analise o mapa de bairros e os indicadores de mercado.",
      status: hasProfile ? "action" : "pending",
      href: "/mapa",
    });

    // Step 3: Unit
    const unitGood = hasUnitScore && unitScore!.pct >= 70;
    const unitWeak = hasUnitScore && unitScore!.pct < 50;
    result.push({
      title: "Avaliar a unidade",
      description: hasUnitScore
        ? unitGood
          ? `Score ${unitScore!.total}/${unitScore!.max} — unidade com boa aderência a short stay.`
          : unitWeak
            ? `Score ${unitScore!.total}/${unitScore!.max} — unidade com gaps importantes. Considere buscar outra.`
            : `Score ${unitScore!.total}/${unitScore!.max} — pontos de atenção. Revise os critérios pendentes.`
        : "Use o scorecard para avaliar a unidade que está considerando.",
      status: hasUnitScore ? (unitWeak ? "warning" : "done") : "action",
      href: "/guia/escolha-do-ativo",
    });

    // Step 4: Numbers
    result.push({
      title: "Validar a conta",
      description: "Rode o simulador com os dados do bairro e da unidade escolhidos. Teste cenários conservador e base.",
      status: "action",
      href: "/projecao",
    });

    // Step 5: Product — conditional
    if (hasUnitScore && !unitGood) {
      result.push({
        title: "Priorizar projeto e reforma",
        description: "A unidade precisa de melhorias. Revise as seções de projeto, reforma e decoração para maximizar o potencial.",
        status: "warning",
        href: "/ferramentas#reformar",
      });
    } else {
      result.push({
        title: "Planejar o produto",
        description: "Defina o conceito do studio: projeto, reforma, decoração e diferenciação.",
        status: "pending",
        href: "/ferramentas#reformar",
      });
    }

    // Step 6: Pricing
    result.push({
      title: "Montar anúncio e precificação",
      description: "Estruture o anúncio, defina a estratégia de preço e prepare-se para capturar receita.",
      status: "pending",
      href: "/guia/anuncio-e-precificacao",
    });

    // Step 7: Go
    result.push({
      title: "Checklist final e decisão",
      description: "Revise o checklist do investidor e confirme que todos os fundamentos estão cobertos.",
      status: "pending",
      href: "/guia/checklist",
    });

    return result;
  }, [hasProfile, investorProfile, hasUnitScore, unitScore]);

  const completedCount = steps.filter(s => s.status === "done").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const ROTULO: Record<ActionStep["status"], string> = { done: "Concluído", action: "Próximo passo", warning: "Atenção", pending: "Pendente" };

  return (
    <div ref={ref}>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1 flex-1 bg-neutro-200" aria-hidden="true">
          <div className="h-full bg-ciano transition-[width] duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="e-legenda tabular-nums">{completedCount} de {steps.length} etapas concluídas</span>
      </div>

      <ol className="border-t border-foreground">
        {steps.map((step, i) => (
          <li key={step.title} className="e-fina border-b">
            <Link
              to={step.href ?? "#"}
              className="group grid min-h-[44px] grid-cols-[28px_minmax(0,1fr)] gap-x-3 py-4 sm:grid-cols-[28px_minmax(0,1fr)_auto]"
            >
              <span className="tabular-nums text-tinta-70">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="block text-[16px] font-semibold leading-6 group-hover:underline">{step.title}</span>
                <span className="e-apoio block">{step.description}</span>
              </span>
              <span
                className={cn(
                  "col-start-2 mt-2 justify-self-start sm:col-start-3 sm:mt-0.5",
                  "e-tag",
                  step.status === "done" && "e-tag-observado",
                  step.status === "action" && "border-ciano-700 text-ciano-700",
                  step.status === "warning" && "border-magenta text-magenta-700",
                  step.status === "pending" && "e-tag-hipotese",
                )}
              >
                {ROTULO[step.status]}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {hasProfile && (
        <div className="mt-8 max-w-[720px]">
          <p className="e-h3">{completedCount >= 3 ? "Você está avançado na jornada" : "Bom começo: continue preenchendo"}</p>
          <p className="e-apoio mt-1">
            {completedCount >= 3
              ? "Seu perfil e análises estão tomando forma. Valide a conta no simulador e revise o checklist final antes de decidir."
              : "Quanto mais etapas você completar, mais precisa fica a recomendação. Avalie uma unidade e rode o simulador para ganhar clareza."}
          </p>
        </div>
      )}
      <OrcamentoButton local="plano-acao" className="mt-8 min-h-[44px] px-5 text-[15px] font-semibold" />
    </div>
  );
}
