import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Calculator, MapPin } from "lucide-react";
import bwildLogo from "@/assets/bwild-logo.png";
import sectionHeroStudio from "@/assets/section-hero-studio.jpg";

export default function HeroSection() {
  const benefits = [
    "Testar cenários de rentabilidade (receita, ocupação e custos) e entender sensibilidades",
    "Identificar os fatores que mais influenciam performance (localização, produto e operação)",
    "Tomar decisões com menos achismo usando ferramentas que destacam os melhores insights do mercado",
  ];

  return (
    <section id="hero" className="scroll-mt-24 pt-8 pb-16 md:pt-16 md:pb-24">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="rounded-2xl overflow-hidden mb-10 shadow-lg">
        <img src={sectionHeroStudio} alt="Studio moderno para short stay em São Paulo" className="w-full h-48 md:h-72 lg:h-80 object-cover" loading="eager" />
      </motion.div>
      <div className="text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col items-center">
          <div className="hidden lg:flex items-center gap-3 mb-6">
            <img src={bwildLogo} alt="Bwild" className="h-8 w-auto" />
          </div>
          <Badge className="mb-4 bg-gold-light text-foreground font-body border-0">Guia Bwild 2025 • Atualizado</Badge>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight text-foreground mb-4 max-w-[68ch]">
            Guia do Investidor em Studios para<br /><span className="text-gradient-hero">Short Stay</span>
          </h1>
          <div className="max-w-[68ch] text-left space-y-4 mb-8">
            <p className="text-lg md:text-xl text-muted-foreground font-body">Este guia é um <strong className="text-foreground">"manual de decisão"</strong> para investir em studios de short stay em São Paulo.</p>
            <p className="text-base text-muted-foreground font-body">Ele foi construído a partir de anos de experiência prática da Bwild no mercado — unindo o que funciona na operação do dia a dia com coleta, limpeza e cruzamento de bases de dados do setor para transformar informação dispersa em insight acionável.</p>
            <p className="text-base text-muted-foreground font-body">Aqui, você encontra ferramentas e frameworks (simuladores, comparadores e leituras de mercado) que ajudam a responder com mais clareza: <strong className="text-foreground">onde faz sentido investir</strong>, como estruturar a conta e o que priorizar no studio e na operação para aumentar a chance de boa ocupação e diária.</p>
          </div>
          <div className="max-w-[68ch] w-full text-left mb-10">
            <p className="text-sm font-body font-semibold uppercase tracking-widest text-muted-foreground mb-4">O que você consegue fazer com este guia</p>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-foreground font-body text-sm md:text-base">
                  <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />{b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-body w-full sm:w-auto" asChild>
              <a href="#simulador"><Calculator size={18} className="mr-2" />Simular rentabilidade</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-body w-full sm:w-auto">
              <a href="#mapa-bairros"><MapPin size={18} className="mr-2" />Ver mapa de bairros</a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-body max-w-lg mb-6">Use as ferramentas para simular cenários. Resultados variam por unidade, prédio e execução.</p>
          <p className="text-xs text-muted-foreground/60 font-body">Produzido pela Bwild (edição 2025) — experiência prática + análise de dados aplicada ao short stay.</p>
        </motion.div>
      </div>
    </section>
  );
}
