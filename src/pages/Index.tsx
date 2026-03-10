import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import bwildLogo from "@/assets/bwild-logo.png";
import bwildLogoWhite from "@/assets/bwild-logo-white.png";
import sectionHeroStudio from "@/assets/section-hero-studio.jpg";
import sectionReforma from "@/assets/section-reforma.jpg";
import sectionDecoracao from "@/assets/section-decoracao.jpg";
import sectionProjeto from "@/assets/section-projeto.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MapaBairrosEmbed from "@/components/mapa/MapaBairrosEmbed";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  TrendingUp,
  BarChart3,
  Home,
  Calculator,
  Paintbrush,
  ShieldCheck,
  Palette,
  Ruler,
  Sparkles,
  BookOpen,
  CheckSquare,
  HelpCircle,
  Send,
  ChevronRight,
  Menu,
  X,
  Zap,
  MapPin,
  FileText,
  Copy,
  Lightbulb,
  ArrowUpRight,
  Check,
  AlertTriangle,
  Clock,
  Star,
  Eye,
  Camera,
  MousePointerClick,
  CalendarCheck,
  MessageSquare,
  Trophy,
  DollarSign,
  Wrench,
  Package,
  ArrowRight,
  SprayCan,
  DoorOpen,
  Target,
  Lock,
  Wifi,
  Briefcase,
  Heart,
  GraduationCap,
  Users,
  ThumbsUp,
  ThumbsDown,
  Phone,
  BadgeCheck,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ─── Shared dataset ─── */
const BAIRRO_DATA = [
  { name: "Vila Mariana", dailyMin: 280, dailyMax: 420, avgOccupancy: 80, perSqm: 9.5, avgBySize: { "20–25 m²": 260, "26–35 m²": 330, "36–50 m²": 410 } },
  { name: "Pinheiros", dailyMin: 320, dailyMax: 480, avgOccupancy: 82, perSqm: 11, avgBySize: { "20–25 m²": 300, "26–35 m²": 380, "36–50 m²": 470 } },
  { name: "Consolação", dailyMin: 260, dailyMax: 390, avgOccupancy: 76, perSqm: 8.8, avgBySize: { "20–25 m²": 240, "26–35 m²": 310, "36–50 m²": 380 } },
  { name: "Bela Vista", dailyMin: 240, dailyMax: 370, avgOccupancy: 74, perSqm: 8.2, avgBySize: { "20–25 m²": 220, "26–35 m²": 290, "36–50 m²": 360 } },
  { name: "Itaim Bibi", dailyMin: 350, dailyMax: 520, avgOccupancy: 78, perSqm: 12, avgBySize: { "20–25 m²": 330, "26–35 m²": 420, "36–50 m²": 510 } },
  { name: "Moema", dailyMin: 300, dailyMax: 450, avgOccupancy: 77, perSqm: 10.5, avgBySize: { "20–25 m²": 280, "26–35 m²": 360, "36–50 m²": 440 } },
  { name: "Brooklin", dailyMin: 290, dailyMax: 430, avgOccupancy: 75, perSqm: 9.8, avgBySize: { "20–25 m²": 270, "26–35 m²": 350, "36–50 m²": 420 } },
  { name: "República", dailyMin: 200, dailyMax: 310, avgOccupancy: 72, perSqm: 7.2, avgBySize: { "20–25 m²": 185, "26–35 m²": 245, "36–50 m²": 300 } },
  { name: "Liberdade", dailyMin: 220, dailyMax: 340, avgOccupancy: 73, perSqm: 7.8, avgBySize: { "20–25 m²": 200, "26–35 m²": 270, "36–50 m²": 330 } },
  { name: "Vila Olímpia", dailyMin: 330, dailyMax: 500, avgOccupancy: 79, perSqm: 11.5, avgBySize: { "20–25 m²": 310, "26–35 m²": 400, "36–50 m²": 490 } },
] as const;

const DECORATION_LEVELS = [
  { value: "basico", label: "Básico", multiplier: 1.0 },
  { value: "premium", label: "Premium", multiplier: 1.2 },
  { value: "alto", label: "Alto padrão", multiplier: 1.45 },
] as const;

const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/* ─── Section definitions ─── */
const SECTIONS = [
  { id: "hero", label: "Início", icon: Home },
  { id: "mapa-bairros", label: "Mapa de Bairros", icon: MapPin },
  { id: "intelligence", label: "Short Stay Intelligence", icon: BarChart3, href: "/intelligence" },
  { id: "reservas", label: "O que move reservas", icon: TrendingUp },
  { id: "mercado", label: "Mercado SP", icon: BarChart3 },
  { id: "simulador", label: "Simulador", icon: Calculator },
  { id: "reforma", label: "Reforma inteligente", icon: Paintbrush },
  { id: "antichecklist", label: "Anti-checklist", icon: ShieldCheck },
  { id: "decoracao", label: "Decoração", icon: Palette },
  { id: "projeto", label: "Projeto arquitetônico", icon: Ruler },
  { id: "tendencias", label: "Tendências 2026", icon: Sparkles },
  { id: "casestudy", label: "Case study", icon: BookOpen },
  { id: "checklist", label: "Checklist investidor", icon: CheckSquare },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "cta-final", label: "Solicitar diagnóstico", icon: Send },
] as const;

/* ─── Reusable section wrapper ─── */
function SectionBlock({
  id,
  title,
  takeaway,
  children,
}: {
  id: string;
  title: string;
  takeaway: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg mb-6">{takeaway}</p>
        <Separator className="mb-8" />
        {children}
      </motion.div>
    </section>
  );
}

function PlaceholderAccordion({ label }: { label: string }) {
  return (
    <Accordion type="single" collapsible className="mt-4">
      <AccordionItem value="details">
        <AccordionTrigger className="text-primary font-semibold">
          Ver detalhes
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground">
            {/* TODO: Fill with real content for "{label}" */}
            Conteúdo detalhado de "{label}" será adicionado nas próximas etapas.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/* ─── TOC (desktop sticky) — slim icon rail, expands on hover ─── */
function TableOfContents({ activeId }: { activeId: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen overflow-y-auto overflow-x-hidden border-r border-border/60 bg-card/90 backdrop-blur-md z-30 scrollbar-thin py-6 transition-all duration-300 ease-in-out ${
        expanded ? "w-56 px-3" : "w-[60px] px-2"
      }`}
    >
      <div className={`mb-6 flex items-center ${expanded ? "px-2" : "justify-center"}`}>
        {expanded ? (
          <img src={bwildLogo} alt="Bwild" className="h-7 w-auto" />
        ) : (
          <img src={bwildLogo} alt="Bwild" className="h-6 w-6 object-contain object-left" style={{ clipPath: "inset(0 60% 0 0)" }} />
        )}
      </div>
      {expanded && (
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-3 px-2">
          Índice
        </p>
      )}
      <ul className="space-y-0.5 flex-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          const isExternal = "href" in s && s.href;
          const baseClass = isActive
            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60";

          const inner = (
            <>
              <Icon size={16} className="shrink-0" />
              {expanded && <span className="truncate text-sm font-body whitespace-nowrap">{s.label}</span>}
              {expanded && isExternal && <ArrowUpRight size={11} className="ml-auto opacity-40 shrink-0" />}
            </>
          );

          return (
            <li key={s.id} className="relative group">
              {isExternal ? (
                <Link
                  to={s.href!}
                  className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 ${baseClass} ${
                    expanded ? "px-3 py-2" : "px-0 py-2 justify-center"
                  }`}
                >
                  {inner}
                </Link>
              ) : (
                <a
                  href={`#${s.id}`}
                  className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 ${baseClass} ${
                    expanded ? "px-3 py-2" : "px-0 py-2 justify-center"
                  }`}
                >
                  {inner}
                </a>
              )}
              {/* Tooltip when collapsed */}
              {!expanded && (
                <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-body px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {s.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* QuickActions removed — replaced by global ChatBot component in App.tsx */
/* ─── Mobile menu (Sheet) ─── */
function MobileMenu({ activeId }: { activeId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-nav px-4 py-3 flex items-center justify-between">
      <img src={bwildLogo} alt="Bwild" className="h-7 w-auto" />
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="hover:bg-muted/50">
        <Menu size={22} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/60">
            <SheetTitle className="flex items-center gap-2">
              <img src={bwildLogo} alt="Bwild" className="h-7 w-auto" />
            </SheetTitle>
          </SheetHeader>

          <nav className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin">
            <p className="text-[10px] font-body font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-3 px-2">
              Índice
            </p>
            <ul className="space-y-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeId === s.id;
                const isExternal = "href" in s && s.href;
                return (
                  <li key={s.id}>
                    {isExternal ? (
                      <Link
                        to={s.href!}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      >
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate">{s.label}</span>
                        <ArrowUpRight size={11} className="ml-auto opacity-40 shrink-0" />
                      </Link>
                    ) : (
                      <a
                        href={`#${s.id}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ─── Mobile sticky CTA ─── */
function MobileStickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-card/95 backdrop-blur border-t border-border px-4 py-3 flex gap-2">
      <Button asChild className="flex-1 bg-primary text-primary-foreground">
        <a href="#simulador">Simular agora</a>
      </Button>
      <Button asChild variant="outline" className="flex-1">
        <a href="#cta-final">Diagnóstico grátis</a>
      </Button>
    </div>
  );
}

/* ─── 1) Hero ─── */
function HeroSection() {
  const benefits = [
    "Testar cenários de rentabilidade (receita, ocupação e custos) e entender sensibilidades",
    "Identificar os fatores que mais influenciam performance (localização, produto e operação)",
    "Tomar decisões com menos achismo usando ferramentas que destacam os melhores insights do mercado",
  ];

  return (
    <section id="hero" className="scroll-mt-24 pt-8 pb-16 md:pt-16 md:pb-24">
      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="rounded-2xl overflow-hidden mb-10 shadow-lg"
      >
        <img src={sectionHeroStudio} alt="Studio moderno para short stay em São Paulo" className="w-full h-48 md:h-72 lg:h-80 object-cover" loading="eager" />
      </motion.div>

      <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center"
      >
        <div className="hidden lg:flex items-center gap-3 mb-6">
          <img src={bwildLogo} alt="Bwild" className="h-8 w-auto" />
        </div>
        <Badge className="mb-4 bg-gold-light text-foreground font-body border-0">
          Guia Bwild 2025 • Atualizado
        </Badge>
        <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight text-foreground mb-4 max-w-[68ch]">
          Guia do Investidor em Studios para
          <br />
          <span className="text-gradient-hero">Short Stay</span>
        </h1>

        <div className="max-w-[68ch] text-left space-y-4 mb-8">
          <p className="text-lg md:text-xl text-muted-foreground font-body">
            Este guia é um <strong className="text-foreground">"manual de decisão"</strong> para investir em studios de short stay em São Paulo.
          </p>
          <p className="text-base text-muted-foreground font-body">
            Ele foi construído a partir de anos de experiência prática da Bwild no mercado — unindo o que funciona na operação do dia a dia com coleta, limpeza e cruzamento de bases de dados do setor para transformar informação dispersa em insight acionável.
          </p>
          <p className="text-base text-muted-foreground font-body">
            Aqui, você encontra ferramentas e frameworks (simuladores, comparadores e leituras de mercado) que ajudam a responder com mais clareza: <strong className="text-foreground">onde faz sentido investir</strong>, como estruturar a conta e o que priorizar no studio e na operação para aumentar a chance de boa ocupação e diária.
          </p>
        </div>

        <div className="max-w-[68ch] w-full text-left mb-10">
          <p className="text-sm font-body font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            O que você consegue fazer com este guia
          </p>
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-foreground font-body text-sm md:text-base">
                <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <Button size="lg" className="bg-primary text-primary-foreground font-body w-full sm:w-auto" asChild>
            <a href="#simulador">
              <Calculator size={18} className="mr-2" />
              Simular rentabilidade
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild className="font-body w-full sm:w-auto">
            <a href="#mapa-bairros">
              <MapPin size={18} className="mr-2" />
              Ver mapa de bairros
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground font-body max-w-lg mb-6">
          Use as ferramentas para simular cenários. Resultados variam por unidade, prédio e execução.
        </p>

        <p className="text-xs text-muted-foreground/60 font-body">
          Produzido pela Bwild (edição 2025) — experiência prática + análise de dados aplicada ao short stay.
        </p>
      </motion.div>
      </div>
    </section>
  );
}

/* ─── 2) O que move reservas — Decision Drivers Dashboard ─── */
const DECISION_DRIVERS = [
  { id: "limpeza", title: "Limpeza", desc: "Fator #1 global: 90% dos hóspedes consideram limpeza o critério mais importante na escolha. Limpeza impecável = reviews 5 estrelas.", icon: SprayCan, priority: { executivo: 1, turista: 2, estudante: 3, casal: 2 } },
  { id: "checkin", title: "Check-in sem atrito", desc: "Fechadura digital ou key box eliminam esperas e reclamações. Hóspedes corporativos chegam tarde — check-in autônomo é decisivo.", icon: DoorOpen, priority: { executivo: 2, turista: 3, estudante: 2, casal: 4 } },
  { id: "precisao", title: "Precisão do anúncio", desc: "Fotos reais, descrição honesta e expectativa alinhada. Anúncios que entregam o que prometem têm 2x menos cancelamentos.", icon: Target, priority: { executivo: 3, turista: 1, estudante: 4, casal: 3 } },
  { id: "avaliacoes", title: "Avaliações e nota", desc: "Acima de 4.8 você entra no topo das buscas. Cada 0.1 ponto acima de 4.5 pode aumentar sua taxa de conversão em até 12%.", icon: Star, priority: { executivo: 5, turista: 4, estudante: 1, casal: 1 } },
  { id: "seguranca", title: "Segurança e acessibilidade", desc: "Portaria 24h, câmeras em áreas comuns, boa iluminação. Casais e turistas solo priorizam segurança acima do preço.", icon: Lock, priority: { executivo: 4, turista: 5, estudante: 5, casal: 5 } },
  { id: "ambiente", title: "Ambiente + trabalho + entretenimento", desc: "Wi-Fi rápido, mesa de trabalho, smart TV e boa acústica. Para estadias de 3+ dias, o setup do ambiente define a experiência.", icon: Wifi, priority: { executivo: 6, turista: 6, estudante: 6, casal: 6 } },
];

type PersonaKey = "executivo" | "turista" | "estudante" | "casal";

const PERSONAS: { key: PersonaKey; label: string; icon: typeof Briefcase }[] = [
  { key: "executivo", label: "Executivo", icon: Briefcase },
  { key: "turista", label: "Turista", icon: MapPin },
  { key: "estudante", label: "Estudante", icon: GraduationCap },
  { key: "casal", label: "Casal", icon: Heart },
];

function ReservasSection() {
  const [persona, setPersona] = useState<PersonaKey>("executivo");

  const sortedDrivers = useMemo(() => {
    return [...DECISION_DRIVERS].sort((a, b) => a.priority[persona] - b.priority[persona]);
  }, [persona]);

  return (
    <SectionBlock
      id="reservas"
      title="O que realmente move reservas"
      takeaway="Os 6 fatores que transformam um studio vazio em máquina de reservas."
    >
      {/* Persona toggles */}
      <div className="mb-6">
        <p className="text-sm font-medium text-foreground mb-3 font-body">Filtrar por perfil do hóspede:</p>
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={persona === p.key ? "default" : "outline"}
              onClick={() => setPersona(p.key)}
              className={persona === p.key ? "bg-primary text-primary-foreground" : ""}
            >
              <p.icon size={14} className="mr-1.5" />
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Driver cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {sortedDrivers.map((driver, i) => (
          <motion.div
            key={driver.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className={`border-border h-full ${i === 0 ? "border-primary/40 border-2 bg-primary/5" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${i === 0 ? "bg-primary/15" : "bg-secondary"}`}>
                    <driver.icon className={i === 0 ? "text-primary" : "text-muted-foreground"} size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="font-body text-xs">#{i + 1}</Badge>
                      <p className="font-semibold text-foreground text-sm">{driver.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{driver.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Citations */}
      <div className="bg-muted rounded-lg p-4 font-body">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fontes</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Airbnb Global Quality Report — fatores de qualidade e drivers de decisão</li>
          <li>• AHLA (American Hotel & Lodging Association) — estatística de prioridade de limpeza</li>
          <li>• Expedia Group 2025 Traveler Value Index — influência de social proof na decisão</li>
          <li>• Annals of Tourism Research: Empirical Insights — categorias de amenidades e experiência do hóspede</li>
        </ul>
      </div>

      <PlaceholderAccordion label="O que move reservas" />
    </SectionBlock>
  );
}

/* ─── 3) Mercado e precificação + Meta de diária ─── */
function MercadoSection() {
  const [bairro, setBairro] = useState<string>(BAIRRO_DATA[0].name);
  const [metragem, setMetragem] = useState(30);
  const [decoracao, setDecoracao] = useState<string>("basico");
  const [ocupacao, setOcupacao] = useState([75]);

  const selected = BAIRRO_DATA.find((b) => b.name === bairro) ?? BAIRRO_DATA[0];
  const decLevel = DECORATION_LEVELS.find((d) => d.value === decoracao) ?? DECORATION_LEVELS[0];

  const result = useMemo(() => {
    const mult = decLevel.multiplier;
    const sizeAdj = metragem > 35 ? 1.08 : metragem < 25 ? 0.92 : 1;
    const min = Math.round(selected.dailyMin * mult * sizeAdj);
    const max = Math.round(selected.dailyMax * mult * sizeAdj);
    const avgDaily = (min + max) / 2;
    const nights = 30 * (ocupacao[0] / 100);
    const receitaMensal = Math.round(avgDaily * nights);
    const receitaAnual = receitaMensal * 12;
    return { min, max, receitaMensal, receitaAnual };
  }, [selected, decLevel, metragem, ocupacao]);

  return (
    <SectionBlock
      id="mercado"
      title="Mercado e Precificação — São Paulo"
      takeaway="Diárias médias, ocupação e receita por bairro atualizado."
    >
      {/* Meta de diária tool */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">🎯 Meta de Diária</h3>
      <Card className="border-border">
        <CardContent className="p-6 space-y-5 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Bairro</label>
              <Select value={bairro} onValueChange={setBairro}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BAIRRO_DATA.map((b) => (
                    <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Metragem (m²)</label>
              <Input type="number" min={15} max={80} value={metragem} onChange={(e) => setMetragem(Number(e.target.value) || 30)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nível de decoração</label>
            <Select value={decoracao} onValueChange={setDecoracao}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DECORATION_LEVELS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Ocupação estimada: <span className="font-bold text-primary">{ocupacao[0]}%</span>
            </label>
            <Slider value={ocupacao} onValueChange={setOcupacao} min={50} max={90} step={1} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.min)}</p>
              <p className="text-xs text-muted-foreground">Diária mín.</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.max)}</p>
              <p className="text-xs text-muted-foreground">Diária máx.</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.receitaMensal)}</p>
              <p className="text-xs text-muted-foreground">Receita / mês</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(result.receitaAnual)}</p>
              <p className="text-xs text-muted-foreground">Receita / ano</p>
            </div>
          </div>

          {/* Recommendation panel */}
          <div className="bg-gold-subtle rounded-lg p-4 flex items-start gap-3">
            <Lightbulb className="text-accent mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Para alcançar o topo da faixa, priorize:</p>
              <p className="text-sm text-muted-foreground">Marcenaria planejada + iluminação cênica + fotos profissionais. Esses 3 fatores combinados podem elevar sua diária em até 40%.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Mercado e precificação" />
    </SectionBlock>
  );
}

/* ─── 4) Simulador de receita ─── */
function SimuladorSection() {
  const [simBairro, setSimBairro] = useState<string>(BAIRRO_DATA[0].name);
  const [simMetragem, setSimMetragem] = useState(30);
  const [simOcupacao, setSimOcupacao] = useState([75]);
  const [simDiariaAtual, setSimDiariaAtual] = useState("");
  const [simObjetivo, setSimObjetivo] = useState("maximizar");
  const [simReformaBudget, setSimReformaBudget] = useState("");
  const [rateBoost, setRateBoost] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Listen for case study "populate" events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.bairro) setSimBairro(detail.bairro);
      if (detail.diaria) setSimDiariaAtual(detail.diaria);
      if (detail.ocupacao) setSimOcupacao([detail.ocupacao]);
      if (detail.boost !== undefined) setRateBoost(detail.boost);
    };
    window.addEventListener("populate-simulator", handler);
    return () => window.removeEventListener("populate-simulator", handler);
  }, []);

  const selected = BAIRRO_DATA.find((b) => b.name === simBairro) ?? BAIRRO_DATA[0];

  const sim = useMemo(() => {
    const baseDaily = simDiariaAtual ? Number(simDiariaAtual) : (selected.dailyMin + selected.dailyMax) / 2;

    // Apply objective modifiers
    let occMod = 0;
    let dailyMod = 0;
    if (simObjetivo === "maximizar") { occMod = 5; dailyMod = 0; }
    else if (simObjetivo === "estabilidade") { occMod = 0; dailyMod = -10; }
    else if (simObjetivo === "premium") { occMod = -10; dailyMod = 20; }

    const adjustedDaily = baseDaily * (1 + dailyMod / 100);
    const adjustedOcc = Math.min(95, Math.max(30, simOcupacao[0] + occMod));
    const boostedDaily = adjustedDaily * (1 + rateBoost / 100);
    const nights = 30 * (adjustedOcc / 100);
    const receitaMensal = Math.round(boostedDaily * nights);
    const receitaAnual = receitaMensal * 12;
    const baseMensal = Math.round(baseDaily * (30 * (simOcupacao[0] / 100)));
    const delta = receitaMensal - baseMensal;
    const budget = Number(simReformaBudget) || 0;
    const paybackMonths = delta > 0 && budget > 0 ? Math.ceil(budget / delta) : null;
    return { baseDaily: Math.round(baseDaily), boostedDaily: Math.round(boostedDaily), receitaMensal, receitaAnual, baseMensal, delta, paybackMonths, adjustedOcc };
  }, [selected, simDiariaAtual, simOcupacao, rateBoost, simReformaBudget, simObjetivo]);

  const summaryText = useMemo(() => {
    return `📊 Simulação de Receita — Short Stay\n\n` +
      `Bairro: ${simBairro}\nMetragem: ${simMetragem}m²\nOcupação: ${simOcupacao[0]}%\n` +
      `Diária base: R$ ${fmt(sim.baseDaily)}\n` +
      (rateBoost > 0 ? `Diária c/ boost +${rateBoost}%: R$ ${fmt(sim.boostedDaily)}\n` : "") +
      `\nReceita mensal: R$ ${fmt(sim.receitaMensal)}\nReceita anual: R$ ${fmt(sim.receitaAnual)}\n` +
      (sim.paybackMonths ? `\nPayback da reforma: ~${sim.paybackMonths} meses\n` : "") +
      `\nGerado em guiadoinvestidor.com.br`;
  }, [simBairro, simMetragem, simOcupacao, sim, rateBoost]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SectionBlock
      id="simulador"
      title="Simulador de Receita"
      takeaway="Calcule sua rentabilidade estimada em menos de 1 minuto."
    >
      <Card className="border-border">
        <CardContent className="p-6 space-y-5 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Bairro</label>
              <Select value={simBairro} onValueChange={setSimBairro}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BAIRRO_DATA.map((b) => (
                    <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Metragem (m²)</label>
              <Input type="number" min={15} max={80} value={simMetragem} onChange={(e) => setSimMetragem(Number(e.target.value) || 30)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Ocupação estimada: <span className="font-bold text-primary">{simOcupacao[0]}%</span>
            </label>
            <Slider value={simOcupacao} onValueChange={setSimOcupacao} min={50} max={90} step={1} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Diária atual (opcional, R$)</label>
              <Input type="number" placeholder={`Média do bairro: R$ ${fmt((selected.dailyMin + selected.dailyMax) / 2)}`} value={simDiariaAtual} onChange={(e) => setSimDiariaAtual(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Objetivo</label>
              <Select value={simObjetivo} onValueChange={setSimObjetivo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="maximizar">Maximizar receita</SelectItem>
                  <SelectItem value="estabilidade">Estabilidade de ocupação</SelectItem>
                  <SelectItem value="premium">Posicionamento premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate boost toggles */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Impacto de aumento na diária</label>
            <div className="flex gap-2 flex-wrap">
              {[0, 10, 20, 30].map((v) => (
                <Button key={v} size="sm" variant={rateBoost === v ? "default" : "outline"} onClick={() => setRateBoost(v)} className={rateBoost === v ? "bg-primary text-primary-foreground" : ""}>
                  {v === 0 ? "Base" : `+${v}%`}
                </Button>
              ))}
            </div>
          </div>

          {/* Optional reforma budget */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Orçamento de reforma (opcional, R$)</label>
            <Input type="number" placeholder="Ex: 45.000" value={simReformaBudget} onChange={(e) => setSimReformaBudget(e.target.value)} />
          </div>

          <Separator />

          {/* Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.boostedDaily)}</p>
              <p className="text-xs text-muted-foreground">Diária {rateBoost > 0 ? `(+${rateBoost}%)` : "base"}</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaMensal)}</p>
              <p className="text-xs text-muted-foreground">Receita / mês</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaAnual)}</p>
              <p className="text-xs text-muted-foreground">Receita / ano</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">
                {sim.paybackMonths ? `${sim.paybackMonths} meses` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Payback reforma</p>
            </div>
          </div>

          {rateBoost > 0 && sim.delta > 0 && (
            <div className="bg-gold-subtle rounded-lg p-4 flex items-start gap-3">
              <ArrowUpRight className="text-accent mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-muted-foreground">
                Com +{rateBoost}% na diária, você ganha <span className="font-bold text-foreground">R$ {fmt(sim.delta)}/mês</span> a mais em relação ao cenário base.
              </p>
            </div>
          )}

          {/* Export */}
          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <FileText size={16} className="mr-2" />
                Exportar simulação
              </Button>
            </DialogTrigger>
            <DialogContent className="font-body">
              <DialogHeader>
                <DialogTitle className="font-display">Resumo da Simulação</DialogTitle>
              </DialogHeader>
              <pre className="bg-muted rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto">
                {summaryText}
              </pre>
              <Button onClick={handleCopy} className="w-full bg-primary text-primary-foreground">
                {copied ? <><Check size={16} className="mr-2" /> Copiado!</> : <><Copy size={16} className="mr-2" /> Copiar texto</>}
              </Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Simulador de receita" />
    </SectionBlock>
  );
}

/* ─── 5) Reforma inteligente ─── */
function ReformaSection() {
  const pisoData = {
    vinilico: [
      { item: "Material", valor: 66, area: 25 },
      { item: "Instalação", valor: 25, area: 25 },
      { item: "Preparação", valor: 12, area: 25 },
    ],
    porcelanato: [
      { item: "Material", valor: 110, area: 25 },
      { item: "Instalação", valor: 85, area: 25 },
      { item: "Preparação", valor: 40, area: 25 },
    ],
  };
  const totalVinilico = pisoData.vinilico.reduce((s, r) => s + r.valor * r.area, 0);
  const totalPorcelanato = pisoData.porcelanato.reduce((s, r) => s + r.valor * r.area, 0);
  const diffPiso = totalPorcelanato - totalVinilico;

  return (
    <SectionBlock
      id="reforma"
      title="Reforma Inteligente"
      takeaway="Quanto investir, onde priorizar e o que gera mais retorno por m²."
    >
      <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
        <img src={sectionReforma} alt="Antes e depois de reforma de studio" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
      </div>
      <Tabs defaultValue="piso" className="font-body">
        <TabsList className="mb-4">
          <TabsTrigger value="piso">Piso (25m²)</TabsTrigger>
          <TabsTrigger value="marcenaria">Marcenaria</TabsTrigger>
          <TabsTrigger value="iluminacao">Iluminação vs Bancada</TabsTrigger>
        </TabsList>

        {/* Tab: Piso */}
        <TabsContent value="piso">
          <Card className="border-border">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vinílico */}
                <div>
                  <h3 className="font-display font-bold text-foreground mb-3">Vinílico</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Item</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">R$/m²</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Subtotal</th>
                    </tr></thead>
                    <tbody>
                      {pisoData.vinilico.map((r) => (
                        <tr key={r.item} className="border-b border-border/50">
                          <td className="py-2 text-foreground">{r.item}</td>
                          <td className="py-2 text-right text-muted-foreground">R$ {r.valor}</td>
                          <td className="py-2 text-right text-foreground font-medium">R$ {fmt(r.valor * r.area)}</td>
                        </tr>
                      ))}
                      <tr><td className="pt-3 font-bold text-foreground">Total</td><td></td>
                        <td className="pt-3 text-right font-bold text-primary text-lg">R$ {fmt(totalVinilico)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Porcelanato */}
                <div>
                  <h3 className="font-display font-bold text-foreground mb-3">Porcelanato</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Item</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">R$/m²</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Subtotal</th>
                    </tr></thead>
                    <tbody>
                      {pisoData.porcelanato.map((r) => (
                        <tr key={r.item} className="border-b border-border/50">
                          <td className="py-2 text-foreground">{r.item}</td>
                          <td className="py-2 text-right text-muted-foreground">R$ {r.valor}</td>
                          <td className="py-2 text-right text-foreground font-medium">R$ {fmt(r.valor * r.area)}</td>
                        </tr>
                      ))}
                      <tr><td className="pt-3 font-bold text-foreground">Total</td><td></td>
                        <td className="pt-3 text-right font-bold text-primary text-lg">R$ {fmt(totalPorcelanato)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bar comparison */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Comparativo de custo total</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-28 text-muted-foreground">Vinílico</span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <motion.div className="h-full bg-primary rounded-full flex items-center justify-end pr-2"
                        initial={{ width: 0 }} whileInView={{ width: `${(totalVinilico / totalPorcelanato) * 100}%` }}
                        viewport={{ once: true }} transition={{ duration: 0.6 }}>
                        <span className="text-xs text-primary-foreground font-bold">R$ {fmt(totalVinilico)}</span>
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-28 text-muted-foreground">Porcelanato</span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <motion.div className="h-full bg-accent rounded-full flex items-center justify-end pr-2"
                        initial={{ width: 0 }} whileInView={{ width: "100%" }}
                        viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
                        <span className="text-xs text-accent-foreground font-bold">R$ {fmt(totalPorcelanato)}</span>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="bg-gold-subtle rounded-lg p-3 flex items-center gap-2">
                  <Lightbulb className="text-accent flex-shrink-0" size={16} />
                  <p className="text-sm text-foreground">Diferença: <span className="font-bold">+R$ {fmt(diffPiso)}</span> pelo porcelanato. Para short stay, vinílico oferece melhor custo-benefício e resistência a riscos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Marcenaria */}
        <TabsContent value="marcenaria">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border">
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-display font-bold text-primary">R$ 24.000</p>
                    <p className="text-sm text-muted-foreground mt-1">Armários fechados</p>
                    <Badge className="mt-2 bg-gold-light text-foreground border-0 font-body">Mais proteção</Badge>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-display font-bold text-primary">R$ 19.000</p>
                    <p className="text-sm text-muted-foreground mt-1">Armários abertos / nichos</p>
                    <Badge className="mt-2 bg-gold-light text-foreground border-0 font-body">Mais estético</Badge>
                  </CardContent>
                </Card>
              </div>
              <div className="bg-gold-subtle rounded-lg p-4 flex items-start gap-3">
                <Lightbulb className="text-accent mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-foreground text-sm mb-1">Marcenaria é o que aparece no anúncio</p>
                  <p className="text-sm text-muted-foreground">Equilibre estética e funcionalidade. Armários fechados protegem itens dos hóspedes, mas abertos com iluminação fotografam melhor e geram mais cliques.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Iluminação vs Bancada */}
        <TabsContent value="iluminacao">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-primary/30 border-2">
                  <CardContent className="p-5 text-center">
                    <Lightbulb className="mx-auto mb-2 text-primary" size={28} />
                    <p className="text-3xl font-display font-bold text-primary">R$ 2.800</p>
                    <p className="text-sm text-muted-foreground mt-1">Iluminação LED completa</p>
                    <p className="text-xs text-muted-foreground mt-1">Marcenaria + teto + fitas</p>
                    <Badge className="mt-2 bg-primary text-primary-foreground border-0 font-body">Melhor ROI</Badge>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5 text-center">
                    <Wrench className="mx-auto mb-2 text-muted-foreground" size={28} />
                    <p className="text-3xl font-display font-bold text-foreground">R$ 5.200</p>
                    <p className="text-sm text-muted-foreground mt-1">Trocar bancadas (quartzo)</p>
                    <p className="text-xs text-muted-foreground mt-1">Demolição + material 2,8–3,2m</p>
                    <Badge variant="secondary" className="mt-2 font-body">Custo elevado</Badge>
                  </CardContent>
                </Card>
              </div>
              <div className="bg-gold-subtle rounded-lg p-4 flex items-start gap-3">
                <Star className="text-accent mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-foreground text-sm mb-1">Decisão do investidor</p>
                  <p className="text-sm text-muted-foreground">Iluminação gera impacto visual desproporcional ao custo: transforma fotos, eleva percepção de qualidade e custa quase metade da troca de bancada. Priorize iluminação sempre.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <PlaceholderAccordion label="Reforma inteligente" />
    </SectionBlock>
  );
}

/* ─── 6) Anti-checklist ─── */
function AntiChecklistSection() {
  const warnings = [
    {
      title: "Aproveite bancadas da construtora",
      desc: "Trocar bancadas novas custa R$ 5.000+ e raramente muda a percepção do hóspede. Troque apenas se estiverem danificadas ou com padrão muito datado.",
      icon: Wrench,
    },
    {
      title: "Cuidado com integração de sacada",
      desc: "Custo a partir de R$ 8.000 + riscos com regras do condomínio. Avalie se o ganho de espaço justifica o investimento e verifique a convenção antes.",
      icon: AlertTriangle,
    },
    {
      title: "Não mexa no revestimento do banheiro",
      desc: "Remover revestimento original pode comprometer a impermeabilização (garantia geralmente de 5 anos). Risco de infiltração e custos imprevisíveis.",
      icon: ShieldCheck,
    },
    {
      title: "Evite demolições e alterações de instalações",
      desc: "Prefira resolver com marcenaria e layout inteligente. Mover pontos hidráulicos ou elétricos encarece e atrasa. Trabalhe com a planta existente.",
      icon: AlertTriangle,
    },
  ];

  return (
    <SectionBlock
      id="antichecklist"
      title="Anti-checklist: O que NÃO fazer"
      takeaway="Erros que destroem rentabilidade — aprenda antes de cometer."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {warnings.map((w) => (
          <Card key={w.title} className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <w.icon className="text-destructive" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-1">{w.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Callout */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 flex items-start gap-3">
        <DollarSign className="text-primary mt-0.5 flex-shrink-0" size={22} />
        <div>
          <p className="font-display font-bold text-foreground text-lg mb-1">Economia pode chegar a 30% no custo total</p>
          <p className="text-sm text-muted-foreground">Ao evitar demolições desnecessárias e priorizar marcenaria + layout, investidores experientes economizam até 30% do orçamento de reforma — dinheiro que vai direto para decoração e fotos, onde o retorno é comprovado.</p>
        </div>
      </div>
      <PlaceholderAccordion label="Anti-checklist" />
    </SectionBlock>
  );
}

/* ─── 7) Decoração estratégica ─── */
function DecoracaoSection() {
  const pilares = [
    { title: "Design autoral", desc: "Estética diferenciada que se destaca nas buscas", icon: Palette },
    { title: "Fotos profissionais", desc: "Imagens que vendem — a primeira impressão do anúncio", icon: Camera },
    { title: "Funcionalidade", desc: "Cada metro útil otimizado para o hóspede", icon: Package },
    { title: "Durabilidade", desc: "Materiais que resistem ao uso intenso de short stay", icon: ShieldCheck },
    { title: "Identidade de marca", desc: "Consistência visual que gera reviews e retorno", icon: Star },
  ];

  const flywheel = [
    { label: "Design", icon: Palette },
    { label: "Fotos", icon: Camera },
    { label: "Cliques", icon: MousePointerClick },
    { label: "Reservas", icon: CalendarCheck },
    { label: "Reviews", icon: MessageSquare },
    { label: "Ranking", icon: Trophy },
    { label: "Diária maior", icon: DollarSign },
  ];

  const benefits = [
    { value: "+25–30%", label: "diárias (potencial)" },
    { value: "75–85%", label: "ocupação (potencial)" },
    { value: "até +40%", label: "valorização (potencial)" },
    { value: "6–12 meses", label: "payback (referência)" },
  ];

  return (
    <SectionBlock
      id="decoracao"
      title="Decoração Estratégica"
      takeaway="Design que converte: estética + funcionalidade + rentabilidade."
    >
      <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
        <img src={sectionDecoracao} alt="Studio decorado com design estratégico" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
      </div>
      {/* 5 Pilares */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">Os 5 Pilares</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {pilares.map((p) => (
          <Card key={p.title} className="border-border">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <p.icon className="text-primary" size={18} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flywheel */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">O Flywheel da Rentabilidade</h3>
      <Card className="border-border mb-8">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-1">
            {flywheel.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1 md:gap-2">
                <motion.div
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-secondary min-w-[80px]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <step.icon size={18} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                </motion.div>
                {i < flywheel.length - 1 && (
                  <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">Ciclo virtuoso: cada etapa alimenta a próxima</p>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {benefits.map((b) => (
          <Card key={b.label} className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-display font-bold text-primary">{b.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{b.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground font-body mb-2">
        <Badge variant="secondary" className="font-body">Menos manutenção</Badge>
        <Badge variant="secondary" className="font-body">Operação simplificada</Badge>
        <Badge variant="secondary" className="font-body">Reputação orgânica</Badge>
      </div>

      <PlaceholderAccordion label="Decoração estratégica" />
    </SectionBlock>
  );
}

/* ─── 8) Projeto arquitetônico ─── */
function ProjetoSection() {
  const inputs = [
    "Planta do imóvel e medidas reais",
    "Perfil do público-alvo (executivo, turista, nômade digital)",
    "Orçamento disponível para reforma",
    "Fotos do estado atual",
    "Preferências de estilo e referências visuais",
  ];

  const pipeline = [
    { step: "Projeto", desc: "Layout otimizado, 3D e detalhamento técnico", duration: "2–3 semanas", icon: Ruler },
    { step: "Execução", desc: "Fornecedores homologados, obra acompanhada", duration: "3–5 semanas", icon: Wrench },
    { step: "Marcenaria", desc: "Sob medida, instalação coordenada", duration: "2–3 semanas", icon: Package },
    { step: "Decoração", desc: "Montagem final, fotos profissionais", duration: "1 semana", icon: Camera },
  ];

  return (
    <SectionBlock
      id="projeto"
      title="Projeto Arquitetônico Personalizado"
      takeaway="Como um bom projeto multiplica o valor percebido do seu studio."
    >
      <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
        <img src={sectionProjeto} alt="Planta e renderização 3D de studio" className="w-full h-48 md:h-64 object-cover" loading="lazy" />
      </div>
      {/* Inputs do projeto */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">O que você precisa fornecer</h3>
      <Card className="border-border mb-8">
        <CardContent className="p-5 font-body">
          <ul className="space-y-2">
            {inputs.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">Método Bwild — Pipeline</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {pipeline.map((p, i) => (
          <motion.div key={p.step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border h-full">
              <CardContent className="p-5 text-center">
                <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <p.icon className="text-primary" size={20} />
                </div>
                <p className="font-display font-bold text-foreground text-sm">{p.step}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                <Badge variant="secondary" className="mt-2 font-body text-xs">
                  <Clock size={10} className="mr-1" />{p.duration}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 flex items-start gap-3">
        <ShieldCheck className="text-primary mt-0.5 flex-shrink-0" size={22} />
        <div>
          <p className="font-display font-bold text-foreground text-sm mb-1">Previsibilidade de prazo e orçamento fechado</p>
          <p className="text-sm text-muted-foreground">O método Bwild trabalha com orçamento fechado e cronograma definido desde o início. Sem surpresas — você sabe exatamente quanto vai investir e quando o studio estará pronto para operar.</p>
        </div>
      </div>
      <PlaceholderAccordion label="Projeto arquitetônico" />
    </SectionBlock>
  );
}

/* ─── 9) Tendências 2026 ─── */

type TrendDifficulty = "easy" | "medium" | "advanced";
type TrendImpact = "high" | "medium" | "low";

interface TrendDetails {
  what: string;
  how: string[];
  checklist: string[];
  expectedImpact: string;
}

interface TrendItem {
  id: number;
  numberLabel: string;
  title: string;
  short: string;
  tags: string[];
  difficulty: TrendDifficulty;
  impact: TrendImpact;
  details: TrendDetails;
}

const TREND_TAG_ICONS: Record<string, typeof Camera> = {
  Fotos: Camera,
  Design: Palette,
  Operação: FileText,
  Precificação: DollarSign,
  "Experiência": Star,
  Automação: Zap,
  Escala: BarChart3,
};

const TREND_TAG_COLORS: Record<string, string> = {
  Fotos: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Design: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Operação: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Precificação: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Experiência": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  Automação: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  Escala: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const TRENDS_2026: TrendItem[] = [
  { id: 1, numberLabel: "#1", title: "Fotografia profissional estratégica", short: "Fotos profissionais aumentam CTR, conversão e diária.", tags: ["Fotos"], difficulty: "medium", impact: "high", details: { what: "Hosts top investem em fotógrafos especializados em Airbnb.", how: ["Contrate fotógrafo com portfólio de interiores e short stay.", "Fotografe com luz natural e enquadramentos amplos.", "Priorize a foto principal como 'foto de capa'."], checklist: ["Foto de capa forte", "Cozinha/banheiro bem iluminados", "Sequência lógica"], expectedImpact: "+20% a +40% nas reservas." } },
  { id: 2, numberLabel: "#2", title: "Primeira foto extremamente forte", short: "A primeira imagem define se o usuário clica no anúncio.", tags: ["Fotos"], difficulty: "easy", impact: "high", details: { what: "A imagem de capa é o maior driver de cliques.", how: ["Use iluminação perfeita e enquadramento amplo.", "Inclua um elemento visual marcante.", "Evite fotos escuras ou muito fechadas."], checklist: ["Capa clara e ampla", "Elemento memorável visível"], expectedImpact: "Aumenta CTR e melhora a taxa de reserva." } },
  { id: 3, numberLabel: "#3", title: "Identidade visual do apartamento", short: "Um conceito único faz o anúncio se destacar.", tags: ["Design"], difficulty: "medium", impact: "high", details: { what: "Hosts profissionais criam um tema consistente.", how: ["Escolha um conceito: industrial, tropical, escandinavo.", "Mantenha paleta de cores consistente.", "Use 1–2 peças 'statement'."], checklist: ["Paleta definida", "Tema aplicado", "Peça marcante"], expectedImpact: "Diferencia o anúncio e aumenta cliques." } },
  { id: 4, numberLabel: "#4", title: "Self check-in ultra intuitivo", short: "Menos fricção no check-in, mais avaliações.", tags: ["Operação", "Automação"], difficulty: "medium", impact: "high", details: { what: "Além da fechadura digital, a experiência é guiada.", how: ["Crie vídeo de check-in (30–60s).", "Manual visual com fotos e passos curtos."], checklist: ["Fechadura digital + backup", "Vídeo curto", "Manual visual"], expectedImpact: "Reduz perguntas e melhora avaliações." } },
  { id: 5, numberLabel: "#5", title: "Guia digital personalizado da cidade", short: "Guia local aumenta satisfação e reviews.", tags: ["Experiência"], difficulty: "easy", impact: "medium", details: { what: "Um guia digital melhora a jornada do hóspede.", how: ["Recomende restaurantes, cafés e coworkings.", "Inclua transporte e turismo."], checklist: ["Top 10 lugares", "Mapa/links", "Dicas por perfil"], expectedImpact: "Melhora avaliação e recomendações." } },
  { id: 6, numberLabel: "#6", title: "Wi-Fi extremamente rápido", short: "Wi-Fi rápido é filtro decisivo para muitos hóspedes.", tags: ["Experiência"], difficulty: "easy", impact: "high", details: { what: "Infra de internet vira diferencial competitivo.", how: ["Instale fibra e roteador premium.", "Use repetidores se necessário."], checklist: ["Fibra ativa", "Roteador bom", "Senha fácil + QR code"], expectedImpact: "Aumenta reservas (trabalho remoto)." } },
  { id: 7, numberLabel: "#7", title: "Colchão padrão hotel", short: "Sono excelente = mais 5 estrelas.", tags: ["Experiência"], difficulty: "medium", impact: "high", details: { what: "Um dos maiores drivers de avaliação.", how: ["Use queen/king quando possível.", "Pillow top e travesseiros de qualidade."], checklist: ["Colchão premium", "2 tipos de travesseiro", "Protetor impermeável"], expectedImpact: "Aumenta reviews e recorrência." } },
  { id: 8, numberLabel: "#8", title: "Roupa de cama premium", short: "Sensação de hotel com enxoval superior.", tags: ["Experiência"], difficulty: "medium", impact: "medium", details: { what: "Percepção de valor sobe com enxoval.", how: ["Algodão 300+ fios, duvet, várias almofadas.", "Padronize cores e reposição."], checklist: ["Jogo completo reserva", "Toalhas boas"], expectedImpact: "Melhora nota e permite ADR maior." } },
  { id: 9, numberLabel: "#9", title: "Cortinas blackout", short: "Sono melhor para hóspedes de qualquer fuso.", tags: ["Experiência"], difficulty: "easy", impact: "medium", details: { what: "Blackout reduz reclamações e melhora conforto.", how: ["Instale trilho e tecido blackout real.", "Evite entrada lateral de luz."], checklist: ["Blackout total", "Vedação lateral"], expectedImpact: "Melhora avaliação de conforto." } },
  { id: 10, numberLabel: "#10", title: "Iluminação pensada para fotos", short: "Iluminação boa melhora fotos e experiência.", tags: ["Design", "Fotos"], difficulty: "medium", impact: "medium", details: { what: "A luz certa melhora o anúncio e o ambiente.", how: ["Use iluminação indireta e luz quente.", "Inclua luminárias decorativas."], checklist: ["Luz geral + indireta", "Luz de leitura"], expectedImpact: "Fotos mais atrativas." } },
  { id: 11, numberLabel: "#11", title: "Elemento de design único", short: "Um detalhe memorável aumenta lembrança e cliques.", tags: ["Design"], difficulty: "medium", impact: "medium", details: { what: "Studios de sucesso têm um 'wow factor'.", how: ["Parede artística, cadeira icônica, painel ripado ou luminária escultural."], checklist: ["1 peça wow", "Visível na capa"], expectedImpact: "Diferencia e aumenta CTR." } },
  { id: 12, numberLabel: "#12", title: "Smart TV com streaming", short: "Streaming é padrão esperado.", tags: ["Experiência"], difficulty: "easy", impact: "medium", details: { what: "TV + streaming reduz atrito e aumenta satisfação.", how: ["Smart TV, YouTube, Chromecast.", "Instruções simples."], checklist: ["Streaming pronto", "Guia rápido"], expectedImpact: "Melhora reviews." } },
  { id: 13, numberLabel: "#13", title: "Limpeza profissional padronizada", short: "Limpeza consistente = avaliações consistentes.", tags: ["Operação"], difficulty: "medium", impact: "high", details: { what: "Operação profissional exige padrão de hotel.", how: ["Checklist de limpeza e equipe fixa.", "Inspeção por fotos."], checklist: ["Checklist", "Padrão banheiro", "Reposição controlada"], expectedImpact: "Aumenta nota e reduz reclamações." } },
  { id: 14, numberLabel: "#14", title: "Checklists operacionais", short: "Processos permitem escalar sem perder qualidade.", tags: ["Operação", "Escala"], difficulty: "medium", impact: "high", details: { what: "Empreendedores criam processos replicáveis.", how: ["Check-in checklist, limpeza checklist, reposição checklist."], checklist: ["Processos documentados", "Responsáveis definidos"], expectedImpact: "Escala com menos erro." } },
  { id: 15, numberLabel: "#15", title: "Preço dinâmico automático", short: "Preço ajustado diariamente maximiza receita.", tags: ["Precificação", "Automação"], difficulty: "medium", impact: "high", details: { what: "Plataformas ajustam preço com base em demanda.", how: ["Use PriceLabs, Beyond ou Wheelhouse.", "Defina piso, teto e regras."], checklist: ["Ferramenta ativa", "Regras por temporada"], expectedImpact: "Maximiza ADR e ocupação." } },
  { id: 16, numberLabel: "#16", title: "Gestão profissional de calendário", short: "Calendário otimizado captura picos de demanda.", tags: ["Precificação", "Operação"], difficulty: "medium", impact: "medium", details: { what: "Hosts monitoram ocupação, eventos e feriados.", how: ["Antecipe datas-chave e ajuste regras."], checklist: ["Datas de pico mapeadas", "Regras de estadia mínima"], expectedImpact: "Aumenta receita em períodos fortes." } },
  { id: 17, numberLabel: "#17", title: "Estratégia de estadia mínima", short: "Regras por período melhoram ocupação e eficiência.", tags: ["Precificação"], difficulty: "easy", impact: "medium", details: { what: "Mínimo de noites varia por demanda.", how: ["Fim de semana: mínimo 2 noites.", "Alta temporada: mínimo 3 noites."], checklist: ["Regras por temporada"], expectedImpact: "Menos gaps e melhor ocupação." } },
  { id: 18, numberLabel: "#18", title: "Automatização de mensagens", short: "Automação reduz trabalho e melhora experiência.", tags: ["Automação", "Operação"], difficulty: "medium", impact: "medium", details: { what: "Mensagens padronizadas e automáticas.", how: ["Pré check-in, guia da casa, pós checkout.", "Use Hospitable ou Guesty."], checklist: ["Templates prontos", "Gatilhos configurados"], expectedImpact: "Menos esforço e menos erro." } },
  { id: 19, numberLabel: "#19", title: "Reviews estratégicas", short: "Pedir review na hora certa aumenta a taxa de avaliação.", tags: ["Operação"], difficulty: "easy", impact: "medium", details: { what: "Mensagem pós checkout pedindo avaliação.", how: ["Automatize a solicitação e seja cordial."], checklist: ["Mensagem automática"], expectedImpact: "Mais avaliações 5 estrelas." } },
  { id: 20, numberLabel: "#20", title: "Portfólio de unidades", short: "Hosts +100k escalam com padrão replicável.", tags: ["Escala"], difficulty: "advanced", impact: "high", details: { what: "Receita alta vem de escala e padronização.", how: ["Replicar operação e padrão em 3 a 10 unidades."], checklist: ["Padrão replicável", "Equipe e processos"], expectedImpact: "Transforma o Airbnb em negócio recorrente." } },
];

const TREND_ALL_TAGS = ["Fotos", "Design", "Operação", "Precificação", "Experiência", "Automação", "Escala"];

const TREND_IMPACT_ORDER: Record<TrendImpact, number> = { high: 0, medium: 1, low: 2 };
const TREND_DIFF_ORDER: Record<TrendDifficulty, number> = { easy: 0, medium: 1, advanced: 2 };
const trendDiffLabel: Record<TrendDifficulty, string> = { easy: "Fácil", medium: "Médio", advanced: "Avançado" };
const trendDiffColor: Record<TrendDifficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
const trendImpactLabel: Record<TrendImpact, string> = { high: "Alto impacto", medium: "Médio impacto", low: "Baixo impacto" };
const trendImpactColor: Record<TrendImpact, string> = {
  high: "bg-primary/10 text-primary",
  medium: "bg-accent/10 text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

type TrendSortMode = "impact" | "easy" | "pro";

function TrendCardInline({ trend, onOpen, index }: { trend: TrendItem; onOpen: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      <Card className="border-border bg-card h-full hover:shadow-xl hover:border-primary/40 transition-all duration-300 group cursor-pointer overflow-hidden" onClick={onOpen}>
        <CardContent className="p-5 flex flex-col h-full relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.03] group-hover:to-accent/[0.06] transition-all duration-500 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary" className="font-mono text-xs font-bold">{trend.numberLabel}</Badge>
              <div className="flex gap-1.5">
                <Badge className={`text-[10px] px-1.5 py-0 ${trendDiffColor[trend.difficulty]}`}>{trendDiffLabel[trend.difficulty]}</Badge>
                <Badge className={`text-[10px] px-1.5 py-0 ${trendImpactColor[trend.impact]}`}>{trendImpactLabel[trend.impact]}</Badge>
              </div>
            </div>
            <h3 className="font-display text-base font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors duration-300">{trend.title}</h3>
            <p className="text-sm text-muted-foreground font-body mb-4 flex-1">{trend.short}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {trend.tags.map((tag) => {
                const TagIcon = TREND_TAG_ICONS[tag] || Star;
                return (
                  <span key={tag} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${TREND_TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                    <TagIcon size={10} />
                    {tag}
                  </span>
                );
              })}
            </div>
            <Button size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              Ver detalhes
              <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TrendDetailDialog({ trend, open, onClose }: { trend: TrendItem | null; open: boolean; onClose: () => void }) {
  if (!trend) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="font-mono text-xs font-bold">{trend.numberLabel}</Badge>
            <Badge className={`text-[10px] px-1.5 py-0 ${trendImpactColor[trend.impact]}`}>{trendImpactLabel[trend.impact]}</Badge>
          </div>
          <DialogTitle className="font-display text-xl">{trend.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-2">
              <Eye size={14} className="text-primary" /> O que é
            </h4>
            <p className="text-sm text-muted-foreground">{trend.details.what}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-2">
              <Wrench size={14} className="text-primary" /> Como aplicar
            </h4>
            <ul className="space-y-1.5">
              {trend.details.how.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-2">
              <Check size={14} className="text-primary" /> Checklist rápido
            </h4>
            <ul className="space-y-1">
              {trend.details.checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={12} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-primary" /> Impacto esperado
            </h4>
            <p className="text-sm text-muted-foreground">{trend.details.expectedImpact}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trend.tags.map((tag) => {
              const TagIcon = TREND_TAG_ICONS[tag] || Star;
              return (
                <span key={tag} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${TREND_TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                  <TagIcon size={12} />
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TendenciasSection() {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<TrendSortMode>("impact");
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const filtered = useMemo(() => {
    let list = [...TRENDS_2026];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)));
    }
    if (activeTags.length > 0) {
      list = list.filter((t) => t.tags.some((tag) => activeTags.includes(tag)));
    }
    if (sort === "impact") {
      list.sort((a, b) => TREND_IMPACT_ORDER[a.impact] - TREND_IMPACT_ORDER[b.impact]);
    } else if (sort === "easy") {
      list.sort((a, b) => TREND_DIFF_ORDER[a.difficulty] - TREND_DIFF_ORDER[b.difficulty]);
    }
    return list;
  }, [search, activeTags, sort]);

  return (
    <SectionBlock
      id="tendencias"
      title="Tendências Premium 2026"
      takeaway="Práticas que os hosts mais rentáveis usam para aumentar ocupação, diária e avaliações."
    >
      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: MousePointerClick, label: "Mais cliques (CTR)" },
          { icon: CalendarCheck, label: "Maior taxa de reserva" },
          { icon: DollarSign, label: "Maior diária média" },
          { icon: Trophy, label: "Melhores avaliações" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <kpi.icon className="text-primary" size={20} />
              </div>
              <p className="text-sm font-medium text-foreground font-body">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tendência…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["impact", "easy", "pro"] as TrendSortMode[]).map((s) => {
              const labels: Record<TrendSortMode, string> = { impact: "Mais impacto", easy: "Mais fácil", pro: "Mais usado" };
              return (
                <Button key={s} size="sm" variant={sort === s ? "default" : "outline"} onClick={() => setSort(s)}
                  className={sort === s ? "bg-primary text-primary-foreground" : ""}>
                  {labels[s]}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {TREND_ALL_TAGS.map((tag) => {
            const active = activeTags.includes(tag);
            const TagIcon = TREND_TAG_ICONS[tag] || Star;
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                <TagIcon size={12} />
                {tag}
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])} className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <p className="text-sm text-muted-foreground mb-4 font-body">{filtered.length} tendência{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}</p>
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((t, i) => (
            <TrendCardInline key={t.id} trend={t} index={i} onOpen={() => setSelectedTrend(t)} />
          ))}
        </div>
      </AnimatePresence>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-body">Nenhuma tendência encontrada com esses filtros.</p>
        </div>
      )}

      <TrendDetailDialog trend={selectedTrend} open={!!selectedTrend} onClose={() => setSelectedTrend(null)} />
    </SectionBlock>
  );
}

/* ─── 10) Case study ─── */
function CaseStudySection() {
  const handleUsePremissas = () => {
    // Dispatch custom event to populate the simulator
    window.dispatchEvent(new CustomEvent("populate-simulator", {
      detail: { bairro: "Vila Mariana", diaria: "230", ocupacao: 75, boost: 30 },
    }));
    // Scroll to simulator
    document.getElementById("simulador")?.scrollIntoView({ behavior: "smooth" });
  };

  const antes = { diaria: 230, ocupacao: 75, noitesMes: 22.5, receitaMes: 5175, receitaAno: 62100 };
  const depois = { diaria: 299, ocupacao: 75, noitesMes: 22.5, receitaMes: 6727, receitaAno: 80724 };
  const deltaMes = depois.receitaMes - antes.receitaMes;
  const deltaAno = depois.receitaAno - antes.receitaAno;

  return (
    <SectionBlock
      id="casestudy"
      title="Case Study — Vila Mariana"
      takeaway="De R$ 5.175 para R$ 6.727/mês com decoração estratégica (+30% na diária)."
    >
      <Card className="border-border">
        <CardContent className="p-6 font-body">
          {/* Premissas */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-foreground mb-2">Premissas</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Diária:</span> <span className="font-medium text-foreground">R$ 230 → R$ 299</span></div>
              <div><span className="text-muted-foreground">Aumento:</span> <span className="font-bold text-primary">+30%</span></div>
              <div><span className="text-muted-foreground">Ocupação:</span> <span className="font-medium text-foreground">75%</span></div>
              <div><span className="text-muted-foreground">Noites/mês:</span> <span className="font-medium text-foreground">22,5</span></div>
            </div>
          </div>

          {/* Before / After comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-border bg-muted/30">
              <CardContent className="p-5 text-center">
                <Badge variant="secondary" className="mb-3 font-body">Antes</Badge>
                <p className="text-3xl font-display font-bold text-foreground">R$ {fmt(antes.receitaMes)}</p>
                <p className="text-sm text-muted-foreground">/mês</p>
                <Separator className="my-3" />
                <p className="text-lg font-display font-bold text-foreground">R$ {fmt(antes.receitaAno)}</p>
                <p className="text-xs text-muted-foreground">/ano</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 border-2 bg-primary/5">
              <CardContent className="p-5 text-center">
                <Badge className="mb-3 bg-primary text-primary-foreground border-0 font-body">Depois</Badge>
                <p className="text-3xl font-display font-bold text-primary">R$ {fmt(depois.receitaMes)}</p>
                <p className="text-sm text-muted-foreground">/mês</p>
                <Separator className="my-3" />
                <p className="text-lg font-display font-bold text-primary">R$ {fmt(depois.receitaAno)}</p>
                <p className="text-xs text-muted-foreground">/ano</p>
              </CardContent>
            </Card>
          </div>

          {/* Delta highlights */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gold-subtle rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-primary">+R$ {fmt(deltaMes)}</p>
              <p className="text-xs text-muted-foreground">a mais por mês</p>
            </div>
            <div className="bg-gold-subtle rounded-lg p-4 text-center">
              <p className="text-2xl font-display font-bold text-primary">+R$ {fmt(deltaAno)}</p>
              <p className="text-xs text-muted-foreground">a mais por ano</p>
            </div>
          </div>

          <Button onClick={handleUsePremissas} className="w-full bg-primary text-primary-foreground font-body">
            <Calculator size={16} className="mr-2" />
            Usar premissas no simulador
          </Button>
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Case study" />
    </SectionBlock>
  );
}

/* ─── 11) Checklist do investidor ─── */
const CHECKLIST_ITEMS = [
  "Localização com demanda comprovada",
  "Condomínio permite short stay",
  "Análise de concorrência feita",
  "Orçamento de reforma definido",
  "Projeção financeira validada",
  "Fotos profissionais planejadas",
  "Mobília funcional selecionada",
  "Plano de precificação dinâmica",
  "Gestão operacional definida",
  "Documentação fiscal em ordem",
];

const SCORE_TIERS = [
  { min: 0, max: 3, label: "Iniciante", color: "bg-destructive", desc: "Você precisa amadurecer o projeto antes de investir." },
  { min: 4, max: 6, label: "Em progresso", color: "bg-accent", desc: "Bom começo, mas faltam itens críticos. Considere um diagnóstico." },
  { min: 7, max: 8, label: "Quase pronto", color: "bg-primary/70", desc: "Falta pouco! Revise os itens pendentes e avance com confiança." },
  { min: 9, max: 10, label: "Pronto para investir", color: "bg-primary", desc: "Excelente! Seu planejamento está sólido. Hora de agir." },
];

function ChecklistSection() {
  const [checked, setChecked] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const score = useMemo(() => checked.filter(Boolean).length, [checked]);
  const tier = useMemo(() => SCORE_TIERS.find((t) => score >= t.min && score <= t.max) ?? SCORE_TIERS[0], [score]);
  const pct = (score / CHECKLIST_ITEMS.length) * 100;

  const toggle = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <SectionBlock
      id="checklist"
      title="Checklist do Investidor"
      takeaway="10 itens obrigatórios antes de fechar qualquer negócio."
    >
      <Card className="border-border">
        <CardContent className="p-6 font-body space-y-4">
          {CHECKLIST_ITEMS.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox checked={checked[i]} onCheckedChange={() => toggle(i)} />
              <span className={`transition-colors ${checked[i] ? "text-muted-foreground line-through" : "text-foreground"} group-hover:text-primary`}>
                {item}
              </span>
            </label>
          ))}
          <Separator className="my-4" />

          {/* Score bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-foreground">Seu score</p>
              <Badge className={`${tier.color} text-primary-foreground border-0 font-body`}>{tier.label}</Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${tier.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-primary">{score}/{CHECKLIST_ITEMS.length}</p>
              <p className="text-sm text-muted-foreground mt-1">{tier.desc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Checklist do investidor" />
    </SectionBlock>
  );
}

/* ─── 12) FAQ ─── */
function FAQSection() {
  const faqs = [
    { q: "Qual o investimento mínimo para começar?", a: "Em São Paulo, studios de 25–30m² em bairros como Bela Vista ou República podem ser encontrados a partir de R$ 250.000. Somando reforma essencial (R$ 25–40k) e decoração, o investimento total mínimo fica entre R$ 280.000 e R$ 320.000." },
    { q: "Short stay é legal em São Paulo?", a: "Sim. Não há legislação municipal que proíba locação por temporada em São Paulo. Porém, a convenção do condomínio pode restringir. Verifique sempre o regulamento interno antes de comprar." },
    { q: "Quanto tempo até ter retorno?", a: "O payback típico de uma reforma bem executada (decoração estratégica + fotos profissionais) é de 6 a 12 meses. O retorno do imóvel em si depende do valor de compra e da receita líquida, mas rentabilidades de 10–16% a.a. são alcançáveis." },
    { q: "Preciso de CNPJ para operar no Airbnb?", a: "Não é obrigatório, mas é recomendado. Operar como pessoa física é permitido, porém um CNPJ (MEI ou Simples) facilita a emissão de notas fiscais, gestão financeira e pode reduzir a carga tributária." },
    { q: "Vale a pena contratar uma administradora?", a: "Depende do seu tempo e perfil. Administradoras cobram 15–25% da receita bruta, mas liberam você totalmente. Para quem tem mais de 2 unidades ou mora longe, costuma valer a pena." },
    { q: "Qual a taxa de ocupação realista para um studio novo?", a: "Nos primeiros 2–3 meses, espere 50–60% enquanto acumula avaliações. Após as primeiras 10–15 reviews positivas, a ocupação tende a estabilizar entre 70–85% dependendo do bairro e da qualidade do anúncio." },
    { q: "Posso fazer short stay em qualquer tipo de imóvel?", a: "Tecnicamente sim, mas studios e 1-dormitório compactos (25–40m²) performam melhor. Imóveis maiores diluem o valor da diária por m² e têm custos operacionais mais altos." },
    { q: "Quais os custos operacionais mensais típicos?", a: "Condomínio (R$ 400–800), IPTU proporcional, limpeza por check-out (R$ 80–150), lavanderia, reposição de amenities e taxa da plataforma (3% Airbnb). Em média, custos operacionais representam 30–40% da receita bruta." },
  ];

  return (
    <SectionBlock
      id="faq"
      title="Perguntas Frequentes"
      takeaway="Respostas rápidas para as dúvidas mais comuns de investidores."
    >
      <Accordion type="single" collapsible className="font-body">
        {faqs.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-foreground font-medium text-left">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Mitos e Verdades */}
      <h3 className="font-display text-xl font-bold text-foreground mt-10 mb-4">Mitos e Verdades</h3>
      <MitosVerdadesBlock />

      {/* HowTo structured */}
      <h3 className="font-display text-xl font-bold text-foreground mt-10 mb-4">Como definir meta de diária em 3 passos</h3>
      <HowToBlock />
    </SectionBlock>
  );
}

/* ─── Mitos e Verdades ─── */
function MitosVerdadesBlock() {
  const items = [
    { mito: "Preciso gastar R$ 100k+ em reforma para ter retorno.", verdade: "Reformas inteligentes de R$ 25–40k focadas em marcenaria, iluminação e decoração geram ROI superior a reformas caras com demolições.", isMito: true },
    { mito: "Porcelanato sempre é melhor que vinílico.", verdade: "Para short stay, vinílico oferece melhor custo-benefício: mais rápido de instalar, silencioso, resistente e custa 44% menos (R$ 2.575 vs R$ 5.875 em 25m²).", isMito: true },
    { mito: "Quanto mais bonito o studio, maior a diária.", verdade: "Parcialmente verdade. Estética importa, mas funcionalidade (Wi-Fi, mesa de trabalho, boa cama) e limpeza impecável pesam mais nas avaliações e no ranking.", isMito: false },
    { mito: "O Airbnb está saturado em São Paulo.", verdade: "A demanda por short stay em SP cresce 15–20% ao ano. O que satura são anúncios ruins — studios bem posicionados e com boa nota mantêm ocupação acima de 75%.", isMito: true },
    { mito: "Fotos profissionais não fazem diferença real.", verdade: "Anúncios com fotos profissionais recebem até 40% mais cliques e convertem 24% mais reservas. É o investimento com maior ROI absoluto (R$ 800–1.500).", isMito: true },
  ];

  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3 font-body">
      {items.map((item, i) => (
        <Card
          key={i}
          className={`border-border cursor-pointer transition-all ${expanded === i ? "ring-1 ring-primary/30" : ""}`}
          onClick={() => setExpanded(expanded === i ? null : i)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.isMito ? "bg-destructive/10" : "bg-primary/10"}`}>
                {item.isMito ? <ThumbsDown className="text-destructive" size={14} /> : <ThumbsUp className="text-primary" size={14} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={`${item.isMito ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"} border-0 font-body text-xs`}>
                    {item.isMito ? "Mito" : "Parcialmente verdade"}
                  </Badge>
                </div>
                <p className="font-medium text-foreground text-sm mt-1">{item.mito}</p>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border">{item.verdade}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── HowTo structured (SEO) ─── */
function HowToBlock() {
  const steps = [
    { step: "Pesquise o mercado do seu bairro", desc: "Use a tabela de mercado acima para identificar a faixa de diária do bairro. Compare mínimo e máximo considerando studios similares ao seu em metragem e acabamento." },
    { step: "Ajuste pela decoração e diferenciais", desc: "Aplique o multiplicador de decoração: Básico (1x), Premium (1.2x) ou Alto padrão (1.45x). Diferenciais como smart lock, enxoval profissional e fotos de qualidade elevam sua posição na faixa." },
    { step: "Valide com o simulador e defina sua meta", desc: "Insira os dados na ferramenta Meta de Diária ou no Simulador de Receita. Compare cenários com diferentes níveis de ocupação e use o resultado para definir seu preço inicial. Ajuste após as primeiras 10 avaliações." },
  ];

  return (
    <div className="space-y-4 font-body">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">{i + 1}</span>
          </div>
          <div className="flex-1 pt-1">
            <p className="font-semibold text-foreground text-sm">{s.step}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
          </div>
        </div>
      ))}

      {/* JSON-LD for HowTo */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Como definir meta de diária para seu studio no Airbnb",
            step: steps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.step,
              text: s.desc,
            })),
          }),
        }}
      />
    </div>
  );
}

/* ─── Mid-page CTA ─── */
function MidPageCTA({ variant = "default" }: { variant?: "default" | "slim" }) {
  if (variant === "slim") {
    return (
      <div className="py-8">
        <Card className="bg-hero-gradient border-0">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold text-primary-foreground">Quer saber quanto seu studio pode render?</p>
              <p className="text-sm text-primary-foreground/70 font-body">Use nosso simulador gratuito ou solicite um diagnóstico personalizado.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button asChild size="sm" className="bg-accent text-accent-foreground font-body">
                <a href="#simulador">Simular agora</a>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body">
                <a href="#cta-final">Diagnóstico grátis</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return null;
}

/* ─── Trust signals ─── */
function TrustSignals() {
  const signals = [
    { icon: BadgeCheck, text: "Dados reais de mercado atualizados" },
    { icon: Users, text: "+200 studios projetados em São Paulo" },
    { icon: Star, text: "Nota média 4.9 nos projetos entregues" },
    { icon: Clock, text: "Prazo e orçamento fechados" },
    { icon: ShieldCheck, text: "Fornecedores homologados e garantia" },
    { icon: Phone, text: "Suporte direto via WhatsApp" },
  ];

  return (
    <div className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {signals.map((s) => (
          <div key={s.text} className="flex items-center gap-2 font-body">
            <s.icon size={16} className="text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 13) Final CTA + lead form ─── */
function FinalCTASection() {
  const [formData, setFormData] = useState({ nome: "", whatsapp: "", bairro: "", metragem: "", objetivo: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateAndSubmit = () => {
    const errors: Record<string, string> = {};
    const nome = formData.nome.trim();
    const whatsapp = formData.whatsapp.trim();

    if (!nome || nome.length < 2) errors.nome = "Informe seu nome";
    if (nome.length > 100) errors.nome = "Nome muito longo";
    if (!whatsapp || whatsapp.length < 10) errors.whatsapp = "WhatsApp inválido";
    if (whatsapp.length > 20) errors.whatsapp = "Número muito longo";
    if (!formData.bairro) errors.bairro = "Selecione um bairro";

    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setSubmitted(true);
      // TODO: Connect to real form submission / backend
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <section id="cta-final" className="scroll-mt-24 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-hero-gradient border-0 text-primary-foreground overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <img src={bwildLogoWhite} alt="Bwild" className="h-8 w-auto mb-4 opacity-80" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Pronto para investir com segurança?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl font-body">
              Solicite um diagnóstico gratuito do seu imóvel e receba uma
              projeção de rentabilidade personalizada pela Bwild.
            </p>

            {submitted ? (
              <div className="bg-primary-foreground/10 rounded-lg p-6 text-center max-w-lg">
                <Check size={40} className="mx-auto mb-3 text-accent" />
                <p className="font-display font-bold text-xl mb-1">Solicitação enviada!</p>
                <p className="text-primary-foreground/70 text-sm font-body">Entraremos em contato em até 24h pelo WhatsApp informado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg font-body">
                <div>
                  <Input
                    placeholder="Seu nome *"
                    value={formData.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    maxLength={100}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                  />
                  {formErrors.nome && <p className="text-accent text-xs mt-1">{formErrors.nome}</p>}
                </div>
                <div>
                  <Input
                    placeholder="WhatsApp *"
                    value={formData.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value.replace(/[^0-9+() -]/g, ""))}
                    maxLength={20}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                  />
                  {formErrors.whatsapp && <p className="text-accent text-xs mt-1">{formErrors.whatsapp}</p>}
                </div>
                <div>
                  <Select value={formData.bairro} onValueChange={(v) => updateField("bairro", v)}>
                    <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                      <SelectValue placeholder="Bairro do imóvel *" />
                    </SelectTrigger>
                    <SelectContent>
                      {BAIRRO_DATA.map((b) => (
                        <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                      ))}
                      <SelectItem value="outro">Outro bairro</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.bairro && <p className="text-accent text-xs mt-1">{formErrors.bairro}</p>}
                </div>
                <Input
                  placeholder="Metragem (m²)"
                  type="number"
                  value={formData.metragem}
                  onChange={(e) => updateField("metragem", e.target.value)}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                />
                <Select value={formData.objetivo} onValueChange={(v) => updateField("objetivo", v)}>
                  <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground sm:col-span-2">
                    <SelectValue placeholder="Objetivo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprar">Quero comprar um studio</SelectItem>
                    <SelectItem value="reformar">Já tenho, quero reformar</SelectItem>
                    <SelectItem value="operar">Já reformei, quero operar</SelectItem>
                    <SelectItem value="diagnostico">Apenas diagnóstico</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={validateAndSubmit}
                  className="sm:col-span-2 bg-accent text-accent-foreground font-body font-semibold"
                >
                  Solicitar diagnóstico gratuito
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

/* ─── Scrollspy hook ─── */
function useScrollspy(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top
              ? prev
              : curr
          );
          setActiveId(top.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/* ─── Main page ─── */
export default function Index() {
  const sectionIds = SECTIONS.map((s) => s.id);
  const activeId = useScrollspy(sectionIds);

  return (
    <>
      <TableOfContents activeId={activeId} />
      <MobileMenu activeId={activeId} />
      {/* ChatBot is rendered globally in App.tsx */}
      <MobileStickyBar />

      <main className="lg:ml-[60px] w-full flex justify-center pb-24 lg:pb-8 pt-16 lg:pt-0">
       <div className="w-full max-w-[1280px] px-5 lg:px-10 py-0 lg:py-10">
        <HeroSection />

        {/* Mapa de Bairros — embedded as first content section */}
        <section id="mapa-bairros" className="scroll-mt-24 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Mapa de Bairros Rentáveis
            </h2>
            <p className="text-muted-foreground text-lg mb-6">Analise demanda, compare bairros, simule ROI e identifique os melhores investimentos em studios.</p>
            <Separator className="mb-8" />
            <MapaBairrosEmbed />

            {/* Tabela de diárias por metragem */}
            <Card className="border-border overflow-hidden mt-8">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-body">
                    <thead className="bg-secondary">
                      <tr>
                        {["Bairro", "Diária mín.", "Ocupação média", "20–25 m²", "26–35 m²", "36–50 m²"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {BAIRRO_DATA.map((b) => (
                        <tr key={b.name} className="border-t border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.dailyMin)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{b.avgOccupancy}%</td>
                          <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.avgBySize["20–25 m²"])}</td>
                          <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.avgBySize["26–35 m²"])}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">R$ {fmt(b.avgBySize["36–50 m²"])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <ReservasSection />
        <MercadoSection />
        <SimuladorSection />

        {/* Mid-page CTA after simulator */}
        <MidPageCTA variant="slim" />

        <ReformaSection />
        <AntiChecklistSection />
        <DecoracaoSection />

        {/* Mid-page CTA after decoração */}
        <MidPageCTA variant="slim" />

        <ProjetoSection />
        <TendenciasSection />
        <CaseStudySection />
        <ChecklistSection />

        {/* Trust signals before FAQ */}
        <TrustSignals />

        <FAQSection />
        <FinalCTASection />

        <footer className="text-center py-8 text-sm text-muted-foreground font-body border-t border-border">
          <img src={bwildLogo} alt="Bwild" className="h-6 w-auto mx-auto mb-3 opacity-60" />
          © 2025 Bwild · Guia do Investidor em Studios para Short Stay
        </footer>
       </div>
      </main>
    </>
  );
}
