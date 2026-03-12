import AppNavbar from "@/components/AppNavbar";
import { BairroProvider } from "@/hooks/useBairroData";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import DiagnosticoInvestidorSection from "@/components/guide/DiagnosticoInvestidorSection";
import RecomendacaoSection from "@/components/guide/RecomendacaoSection";
import PlanoAcaoSection from "@/components/guide/PlanoAcaoSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import bwildLogo from "@/assets/bwild-logo.png";

export default function Ferramentas() {
  return (
    <BairroProvider>
      <GuideDecisionProvider>
        <AppNavbar />
        <main className="w-full flex flex-col items-center pb-24 pt-16 lg:pt-8">
          {/* Back link + header */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10 pt-8 pb-4">
              <Button variant="ghost" size="sm" asChild className="mb-4 text-muted-foreground">
                <Link to="/"><ArrowLeft size={16} className="mr-1.5" />Voltar ao Guia</Link>
              </Button>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Ferramentas do Investidor
              </h1>
              <p className="text-muted-foreground text-lg font-body max-w-2xl">
                Diagnóstico de perfil, recomendação personalizada e plano de ação — ferramentas complementares para refinar sua estratégia.
              </p>
            </div>
          </div>

          {/* Diagnóstico do Investidor */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <DiagnosticoInvestidorSection />
            </div>
          </div>

          {/* Recomendação Personalizada */}
          <div className="w-full bg-muted/20">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <RecomendacaoSection />
            </div>
          </div>

          {/* Plano de Ação */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <PlanoAcaoSection />
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <footer className="text-center py-8 text-sm text-muted-foreground font-body">
                <img src={bwildLogo} alt="Bwild" className="h-6 w-auto mx-auto mb-3 opacity-60" />
                © 2026 Bwild · Ferramentas do Investidor
              </footer>
            </div>
          </div>
        </main>
      </GuideDecisionProvider>
    </BairroProvider>
  );
}
