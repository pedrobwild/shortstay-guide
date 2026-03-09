import bwildLogo from "@/assets/bwild-logo.png";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MapaBairrosEmbed from "@/components/mapa/MapaBairrosEmbed";

export default function MapaBairros() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /><span className="hidden sm:inline">Voltar ao guia</span>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <img src={bwildLogo} alt="Bwild" className="h-6 w-auto" />
          <span className="text-xs text-muted-foreground font-body hidden md:inline">Mapa de Bairros Rentáveis</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        {/* Hero */}
        <section className="py-6 md:py-14">
          <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-0 font-body">São Paulo · Dashboard do investidor</Badge>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-3">
              Mapa de Bairros Rentáveis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-body">
              Analise demanda, compare bairros, simule ROI e identifique os melhores investimentos em studios.
            </p>
          </motion.div>
        </section>

        <MapaBairrosEmbed />

        {/* CTA */}
        <section className="bg-hero-gradient rounded-2xl p-8 md:p-12 text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">Encontrou seu bairro ideal?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-6 font-body">Combine a análise de bairro com as tendências premium para maximizar sua rentabilidade.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 font-body">
              <Link to="/#simulador"><Calculator size={18} className="mr-2" />Simulador completo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 font-body">
              <Link to="/#tendencias"><TrendingUp size={18} className="mr-2" />Ver tendências 2026</Link>
            </Button>
          </div>
        </section>

        <footer className="text-center py-8 text-sm text-muted-foreground font-body border-t border-border">
          <img src={bwildLogo} alt="Bwild" className="h-6 w-auto mx-auto mb-3 opacity-60" />
          © 2026 Bwild · Mapa de Bairros Rentáveis — São Paulo
        </footer>
      </main>
    </div>
  );
}
