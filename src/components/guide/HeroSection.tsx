import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUpRight, BarChart3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import sectionHeroStudio from "@/assets/section-hero-studio.jpg";
import { FONTE_BAIRROS_CURADOS } from "@/data/bairrosCurados";

/** Três entradas por intenção; cada uma salta para a fase do guia correspondente. */
const PORTAS = [
  { href: "#mapa-bairros", titulo: "Escolher o bairro", texto: "Confira diária, ocupação e fonte de cada bairro no mapa." },
  { href: "#simulador", titulo: "Validar a conta", texto: "Simule a receita com as premissas do seu imóvel." },
  { href: "#reforma", titulo: "Preparar a reforma", texto: "Veja o que faz um studio performar e quanto custa a reforma completa." },
] as const;

export default function HeroSection() {
  return (
    <section id="hero" className="scroll-mt-24 pb-8 md:pb-12">
      <div className="relative isolate overflow-hidden min-h-[360px] flex items-center">
        <img
          src={sectionHeroStudio}
          alt="Interior de um studio para short stay em São Paulo"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_30%]"
          loading="eager"
          fetchPriority="high"
          width={1440}
          height={600}
        />
        <div className="absolute inset-0 -z-10 bg-primary/90" />
        <div className="w-full px-5 py-10 md:px-10 md:py-12 text-primary-foreground">
          <p className="font-body text-sm mb-3">São Paulo · Short stay · Edição 2026</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 tracking-normal">Radar Bewild</h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mb-6 text-primary-foreground/90">
            Dados de diária e ocupação para entender o mercado de Airbnb, comparar bairros e avaliar cenários de investimento.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-full">
            <Button asChild size="lg" variant="secondary" className="min-h-[48px] whitespace-normal font-body">
              <Link to="/mercado"><BarChart3 size={18} className="mr-2 shrink-0" />Consultar dados de mercado</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-[48px] whitespace-normal bg-transparent border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-body">
              <a href="#mapa-bairros"><MapPin size={18} className="mr-2 shrink-0" />Explorar bairros</a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 py-8 md:py-10 border-b border-border">
        <div className="min-w-0">
          <p className="text-sm font-body text-muted-foreground mb-2">Quem está por trás</p>
          <h2 className="font-display text-xl font-semibold mb-3 tracking-normal">A Bewild</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground">
            A Bewild atua com arquitetura e construção. No Radar, reúne referências de mercado e experiência com studios para apoiar a análise de quem está pesquisando um investimento em São Paulo.
          </p>
          <a href="https://bewild.com.br" target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] text-sm text-primary underline underline-offset-4 gap-1 mt-2">
            Conheça a Bewild<ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-body text-muted-foreground mb-2">Origem e limites</p>
          <h2 className="font-display text-xl font-semibold mb-3 tracking-normal">Que dados são esses?</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground">{FONTE_BAIRROS_CURADOS}</p>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mt-3">
            Cada bairro mostra sua fonte e período. Estimativas Bewild e ajustes manuais são identificados separadamente. Outros indicadores de mercado usam a base estimada de 2025; simulações são hipóteses, não retorno garantido.
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-body text-muted-foreground mb-2">Da consulta à decisão</p>
          <h2 className="font-display text-xl font-semibold mb-3 tracking-normal">Por onde começar?</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-2">Escolha pelo que você quer resolver agora:</p>
          <ol className="font-body text-sm space-y-2">
            {PORTAS.map((porta, i) => (
              <li key={porta.href}>
                <a href={porta.href} className="group flex min-h-[44px] items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-secondary/50">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{porta.titulo}</span>
                    <span className="block text-muted-foreground leading-relaxed">{porta.texto}</span>
                  </span>
                  <ArrowDown size={16} aria-hidden="true" className="mt-1 shrink-0 text-primary opacity-60 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
