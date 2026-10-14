import { Link } from "react-router-dom";
import { UserCheck } from "lucide-react";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { trackGlobal } from "@/hooks/useGuideAnalytics";

/**
 * Atalho para o diagnóstico do investidor (3 perguntas em /ferramentas). Com o perfil
 * feito, mostra qual é — os casos do guia já usam esse perfil. Perfis são critério
 * interno da Bewild, não estatística de mercado.
 */
export default function PerfilInvestidorAtalho() {
  const { investorProfile } = useGuideDecision();
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {investorProfile
            ? <>Seu perfil de investidor: <strong className="text-foreground">{investorProfile.name}</strong>. Os casos do guia já consideram esse perfil (critério interno da Bewild).</>
            : <>Responda 3 perguntas e o guia ajusta os casos ao seu perfil de investidor (critério interno da Bewild).</>}
        </p>
      </div>
      <Link
        to="/ferramentas#diagnostico"
        onClick={() => trackGlobal("cta_clicked", { cta_id: investorProfile ? "refazer_diagnostico" : "fazer_diagnostico", section: "home_fase2" })}
        className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-medium text-primary underline underline-offset-4"
      >
        {investorProfile ? "Rever diagnóstico" : "Fazer o diagnóstico"}
      </Link>
    </div>
  );
}
