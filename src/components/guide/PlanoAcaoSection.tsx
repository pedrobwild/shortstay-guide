import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  MapPin, Building2, Calculator, Paintbrush, Megaphone, ShieldCheck,
  CheckCircle2, AlertCircle, ArrowRight, Rocket, Target,
} from "lucide-react";
import SectionBlock from "./SectionBlock";
import { useGuideDecision } from "@/hooks/useGuideDecision";

interface ActionStep {
  icon: any;
  title: string;
  description: string;
  status: "done" | "action" | "warning" | "pending";
  href?: string;
}

export default function PlanoAcaoSection() {
  const { investorProfile, hasProfile, unitScore, hasUnitScore } = useGuideDecision();

  const steps = useMemo((): ActionStep[] => {
    const result: ActionStep[] = [];

    // Step 1: Profile
    result.push({
      icon: Target,
      title: "Definir perfil de investidor",
      description: hasProfile
        ? `Perfil definido: ${investorProfile!.name}. Recomendações personalizadas ativas.`
        : "Complete o diagnóstico para personalizar suas recomendações.",
      status: hasProfile ? "done" : "action",
      href: "#diagnostico",
    });

    // Step 2: Bairro
    result.push({
      icon: MapPin,
      title: "Escolher o bairro",
      description: hasProfile
        ? "Use o ranking personalizado e o mapa para identificar os melhores bairros para seu perfil."
        : "Analise o mapa de bairros e os indicadores de mercado.",
      status: hasProfile ? "action" : "pending",
      href: "#mapa-bairros",
    });

    // Step 3: Unit
    const unitGood = hasUnitScore && unitScore!.pct >= 70;
    const unitWeak = hasUnitScore && unitScore!.pct < 50;
    result.push({
      icon: Building2,
      title: "Avaliar a unidade",
      description: hasUnitScore
        ? unitGood
          ? `Score ${unitScore!.total}/${unitScore!.max} — unidade com boa aderência a short stay.`
          : unitWeak
            ? `Score ${unitScore!.total}/${unitScore!.max} — unidade com gaps importantes. Considere buscar outra.`
            : `Score ${unitScore!.total}/${unitScore!.max} — pontos de atenção. Revise os critérios pendentes.`
        : "Use o scorecard para avaliar a unidade que está considerando.",
      status: hasUnitScore ? (unitWeak ? "warning" : "done") : "action",
      href: "#escolha-ativo",
    });

    // Step 4: Numbers
    result.push({
      icon: Calculator,
      title: "Validar a conta",
      description: "Rode o simulador com os dados do bairro e da unidade escolhidos. Teste cenários conservador e base.",
      status: "action",
      href: "#simulador",
    });

    // Step 5: Product — conditional
    if (hasUnitScore && !unitGood) {
      result.push({
        icon: Paintbrush,
        title: "Priorizar projeto e reforma",
        description: "A unidade precisa de melhorias. Revise as seções de projeto, reforma e decoração para maximizar o potencial.",
        status: "warning",
        href: "#projeto",
      });
    } else {
      result.push({
        icon: Paintbrush,
        title: "Planejar o produto",
        description: "Defina o conceito do studio: projeto, reforma, decoração e diferenciação.",
        status: "pending",
        href: "#projeto",
      });
    }

    // Step 6: Pricing
    result.push({
      icon: Megaphone,
      title: "Montar anúncio e precificação",
      description: "Estruture o anúncio, defina a estratégia de preço e prepare-se para capturar receita.",
      status: "pending",
      href: "#anuncio-pricing",
    });

    // Step 7: Go
    result.push({
      icon: ShieldCheck,
      title: "Checklist final e decisão",
      description: "Revise o checklist do investidor e confirme que todos os fundamentos estão cobertos.",
      status: "pending",
      href: "#checklist",
    });

    return result;
  }, [hasProfile, investorProfile, hasUnitScore, unitScore]);

  const completedCount = steps.filter(s => s.status === "done").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <SectionBlock
      id="plano-acao"
      title="Seu Plano de Ação"
      takeaway="Baseado no que você preencheu até aqui, estes são seus próximos passos."
    >
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-body text-muted-foreground">
          {completedCount}/{steps.length} etapas concluídas
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const statusConfig = {
            done: { badge: "Concluído", badgeClass: "bg-primary/10 text-primary", iconClass: "text-primary bg-primary/10", dot: <CheckCircle2 size={14} className="text-primary" /> },
            action: { badge: "Próximo passo", badgeClass: "bg-amber-100 text-amber-800", iconClass: "text-amber-600 bg-amber-50", dot: <ArrowRight size={14} className="text-amber-600" /> },
            warning: { badge: "Atenção", badgeClass: "bg-destructive/10 text-destructive", iconClass: "text-destructive bg-destructive/5", dot: <AlertCircle size={14} className="text-destructive" /> },
            pending: { badge: "Pendente", badgeClass: "bg-muted text-muted-foreground", iconClass: "text-muted-foreground bg-muted", dot: <span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> },
          };
          const cfg = statusConfig[step.status];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <a href={step.href} className="block">
                <Card className={`border-border transition-all hover:shadow-md ${
                  step.status === "action" ? "border-amber-300/50" :
                  step.status === "warning" ? "border-destructive/30" : ""
                }`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-display font-bold text-foreground text-sm">{step.title}</p>
                        <Badge className={`${cfg.badgeClass} font-body text-[10px]`}>{cfg.badge}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-body leading-relaxed">{step.description}</p>
                    </div>
                    <div className="shrink-0 mt-1">{cfg.dot}</div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          );
        })}
      </div>

      {/* Summary insight */}
      {hasProfile && (
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-3">
          <Rocket className="text-primary mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-display font-bold text-foreground text-sm mb-1">
              {completedCount >= 3
                ? "Você está avançado na jornada"
                : "Bom começo — continue preenchendo"
              }
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {completedCount >= 3
                ? "Seu perfil e análises estão tomando forma. Valide a conta no simulador e revise o checklist final para tomar sua decisão com confiança."
                : "Quanto mais etapas você completar, mais precisa será a recomendação. Avalie uma unidade e rode o simulador para ganhar clareza."
              }
            </p>
          </div>
        </div>
      )}
    </SectionBlock>
  );
}
