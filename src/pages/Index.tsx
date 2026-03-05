import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

/* ─── Section definitions ─── */
const SECTIONS = [
  { id: "hero", label: "Início", icon: Home },
  { id: "reservas", label: "O que move reservas", icon: TrendingUp },
  { id: "mercado", label: "Mercado SP", icon: BarChart3 },
  { id: "simulador", label: "Simulador", icon: Calculator },
  { id: "reforma", label: "Reforma inteligente", icon: Paintbrush },
  { id: "antichecklist", label: "Anti-checklist", icon: ShieldCheck },
  { id: "decoracao", label: "Decoração", icon: Palette },
  { id: "projeto", label: "Projeto arquitetônico", icon: Ruler },
  { id: "tendencias", label: "Tendências 2025", icon: Sparkles },
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

/* ─── TOC (desktop sticky) ─── */
function TableOfContents({ activeId }: { activeId: string }) {
  return (
    <nav className="hidden lg:block fixed left-0 top-24 w-56 xl:w-64 h-[calc(100vh-6rem)] overflow-y-auto px-4 py-6 border-r border-border bg-card/80 backdrop-blur-sm z-30">
      <p className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Índice
      </p>
      <ul className="space-y-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-body transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon size={14} />
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─── Floating quick actions ─── */
function QuickActions() {
  const [open, setOpen] = useState(false);
  const actions = [
    { label: "Simular rentabilidade", icon: Calculator, href: "#simulador" },
    { label: "Ver diária do meu bairro", icon: MapPin, href: "#mercado" },
    { label: "Solicitar diagnóstico", icon: FileText, href: "#cta-final" },
  ];

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="mb-3 flex flex-col gap-2"
          >
            {actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 bg-card border border-border shadow-lg rounded-lg px-4 py-3 text-sm font-body font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <a.icon size={16} className="text-primary" />
                {a.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Zap size={22} />}
      </Button>
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
  const metrics = [
    { value: "R$ 350", label: "Diária média SP", suffix: "/noite" },
    { value: "78%", label: "Ocupação média", suffix: "" },
    { value: "14%", label: "Rentabilidade a.a.", suffix: "" },
  ];

  return (
    <section id="hero" className="scroll-mt-24 pt-8 pb-16 md:pt-16 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Badge className="mb-4 bg-gold-light text-foreground font-body border-0">
          Guia 2025 · Atualizado
        </Badge>
        <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight text-foreground mb-4">
          Guia do Investidor em Studios para{" "}
          <span className="text-gradient-hero">Short Stay</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 font-body">
          Tudo que você precisa saber para comprar, reformar e operar studios
          compactos no Airbnb com máxima rentabilidade em São Paulo.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <Button size="lg" className="bg-primary text-primary-foreground font-body">
            <a href="#simulador" className="flex items-center gap-2">
              <Calculator size={18} />
              Simular rentabilidade
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild className="font-body">
            <a href="#cta-final">Solicitar diagnóstico gratuito</a>
          </Button>
        </div>

        {/* TODO: Replace with real data */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <Card key={m.label} className="border-border bg-card">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-display font-bold text-primary">
                  {m.value}
                  <span className="text-base font-body text-muted-foreground">
                    {m.suffix}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground font-body mt-1">
                  {m.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─── 2) O que move reservas ─── */
function ReservasSection() {
  return (
    <SectionBlock
      id="reservas"
      title="O que realmente move reservas"
      takeaway="Os 5 fatores que transformam um studio vazio em máquina de reservas."
    >
      {/* TODO: Add content — ranking cards, data charts */}
      <Card className="border-dashed border-2 border-border bg-muted/50">
        <CardContent className="p-8 text-center text-muted-foreground font-body">
          <TrendingUp className="mx-auto mb-3 text-primary" size={32} />
          Conteúdo será adicionado na próxima etapa.
        </CardContent>
      </Card>
      <PlaceholderAccordion label="O que move reservas" />
    </SectionBlock>
  );
}

/* ─── 3) Mercado e precificação ─── */
function MercadoSection() {
  return (
    <SectionBlock
      id="mercado"
      title="Mercado e Precificação — São Paulo"
      takeaway="Diárias médias, ocupação e receita por bairro atualizado."
    >
      {/* TODO: Real table with neighbourhood data */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-secondary">
                <tr>
                  {["Bairro", "Diária média", "Ocupação", "RevPAR"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["Vila Mariana", "Pinheiros", "Consolação", "Bela Vista"].map(
                  (bairro) => (
                    <tr key={bairro} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-foreground">{bairro}</td>
                      <td className="px-4 py-3 text-muted-foreground">R$ —</td>
                      <td className="px-4 py-3 text-muted-foreground">—%</td>
                      <td className="px-4 py-3 text-muted-foreground">R$ —</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Mercado e precificação" />
    </SectionBlock>
  );
}

/* ─── 4) Simulador de receita ─── */
function SimuladorSection() {
  return (
    <SectionBlock
      id="simulador"
      title="Simulador de Receita"
      takeaway="Calcule sua rentabilidade estimada em menos de 1 minuto."
    >
      {/* TODO: Implement calculator logic */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-6 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Valor do imóvel (R$)
              </label>
              <Input placeholder="Ex: 350.000" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Bairro
              </label>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pinheiros">Pinheiros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Ocupação estimada: 75%
            </label>
            <Slider defaultValue={[75]} max={100} step={1} disabled />
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Receita mensal", value: "R$ —" },
              { label: "Custo mensal", value: "R$ —" },
              { label: "Rentab. anual", value: "—%" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-display font-bold text-primary">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <Button disabled className="w-full bg-primary text-primary-foreground">
            Calcular (em breve)
          </Button>
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Simulador de receita" />
    </SectionBlock>
  );
}

/* ─── 5) Reforma inteligente ─── */
function ReformaSection() {
  return (
    <SectionBlock
      id="reforma"
      title="Reforma Inteligente"
      takeaway="Quanto investir, onde priorizar e o que gera mais retorno por m²."
    >
      {/* TODO: Fill tabs with real content */}
      <Tabs defaultValue="essencial" className="font-body">
        <TabsList className="mb-4">
          <TabsTrigger value="essencial">Essencial</TabsTrigger>
          <TabsTrigger value="intermediario">Intermediário</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>
        {["essencial", "intermediario", "premium"].map((t) => (
          <TabsContent key={t} value={t}>
            <Card className="border-dashed border-2 border-border bg-muted/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Paintbrush className="mx-auto mb-3 text-primary" size={32} />
                Detalhes do pacote {t} serão adicionados.
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <PlaceholderAccordion label="Reforma inteligente" />
    </SectionBlock>
  );
}

/* ─── 6) Anti-checklist ─── */
function AntiChecklistSection() {
  return (
    <SectionBlock
      id="antichecklist"
      title="Anti-checklist: O que NÃO fazer"
      takeaway="Erros que destroem rentabilidade — aprenda antes de cometer."
    >
      <Card className="border-dashed border-2 border-border bg-muted/50">
        <CardContent className="p-8 text-center text-muted-foreground font-body">
          <ShieldCheck className="mx-auto mb-3 text-destructive" size={32} />
          Lista de erros comuns será adicionada.
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Anti-checklist" />
    </SectionBlock>
  );
}

/* ─── 7) Decoração estratégica ─── */
function DecoracaoSection() {
  return (
    <SectionBlock
      id="decoracao"
      title="Decoração Estratégica"
      takeaway="Design que converte: ambientes que geram mais cliques e reservas."
    >
      <Card className="border-dashed border-2 border-border bg-muted/50">
        <CardContent className="p-8 text-center text-muted-foreground font-body">
          <Palette className="mx-auto mb-3 text-accent" size={32} />
          Galeria e dicas de decoração serão adicionadas.
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Decoração estratégica" />
    </SectionBlock>
  );
}

/* ─── 8) Projeto arquitetônico ─── */
function ProjetoSection() {
  return (
    <SectionBlock
      id="projeto"
      title="Projeto Arquitetônico Personalizado"
      takeaway="Como um bom projeto multiplica o valor percebido do seu studio."
    >
      <Card className="border-dashed border-2 border-border bg-muted/50">
        <CardContent className="p-8 text-center text-muted-foreground font-body">
          <Ruler className="mx-auto mb-3 text-primary" size={32} />
          Detalhes do serviço de projeto serão adicionados.
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Projeto arquitetônico" />
    </SectionBlock>
  );
}

/* ─── 9) Tendências 2025 ─── */
function TendenciasSection() {
  const trends = [
    "Check-in autônomo",
    "Design biofílico",
    "Smart pricing com IA",
    "Studios pet-friendly",
    "Experiências locais",
  ];

  return (
    <SectionBlock
      id="tendencias"
      title="Tendências 2025"
      takeaway="O que os hosts mais rentáveis estão fazendo agora."
    >
      {/* TODO: Replace with real carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {trends.map((t, i) => (
          <Card
            key={t}
            className="min-w-[220px] snap-start border-border flex-shrink-0"
          >
            <CardContent className="p-6">
              <Badge variant="secondary" className="mb-3 font-body">
                #{i + 1}
              </Badge>
              <p className="font-display font-semibold text-foreground">{t}</p>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Detalhes em breve.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <PlaceholderAccordion label="Tendências 2025" />
    </SectionBlock>
  );
}

/* ─── 10) Case study ─── */
function CaseStudySection() {
  return (
    <SectionBlock
      id="casestudy"
      title="Case Study"
      takeaway="Studio na Vila Mariana: de R$ 0 a R$ 6.500/mês em 3 meses."
    >
      <Card className="border-border">
        <CardContent className="p-6 font-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { label: "Investimento total", value: "R$ —" },
              { label: "Receita mensal", value: "R$ —" },
              { label: "Payback", value: "— meses" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-display font-bold text-primary">{m.value}</p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground text-center">
            {/* TODO: Full case study narrative */}
            Narrativa completa do case será adicionada.
          </p>
        </CardContent>
      </Card>
      <PlaceholderAccordion label="Case study" />
    </SectionBlock>
  );
}

/* ─── 11) Checklist do investidor ─── */
function ChecklistSection() {
  return (
    <SectionBlock
      id="checklist"
      title="Checklist do Investidor"
      takeaway="10 itens obrigatórios antes de fechar qualquer negócio."
    >
      {/* TODO: Interactive checklist + score */}
      <Card className="border-border">
        <CardContent className="p-6 font-body space-y-3">
          {[
            "Localização com demanda comprovada",
            "Condomínio permite short stay",
            "Análise de concorrência feita",
            "Orçamento de reforma definido",
            "Projeção financeira validada",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded border-2 border-primary flex-shrink-0" />
              <span className="text-foreground">{item}</span>
            </div>
          ))}
          <Separator className="my-4" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Seu score</p>
            <p className="text-4xl font-display font-bold text-primary">—/10</p>
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
    "Qual o investimento mínimo para começar?",
    "Short stay é legal em São Paulo?",
    "Quanto tempo até ter retorno?",
    "Preciso de CNPJ para operar no Airbnb?",
    "Vale a pena contratar uma administradora?",
  ];

  return (
    <SectionBlock
      id="faq"
      title="Perguntas Frequentes"
      takeaway="Respostas rápidas para as dúvidas mais comuns."
    >
      <Accordion type="single" collapsible className="font-body">
        {faqs.map((q, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-foreground font-medium">
              {q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {/* TODO: Real answers */}
              Resposta será adicionada na próxima etapa.
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionBlock>
  );
}

/* ─── 13) Final CTA + lead form ─── */
function FinalCTASection() {
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
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Pronto para investir com segurança?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl font-body">
              Solicite um diagnóstico gratuito do seu imóvel e receba uma
              projeção de rentabilidade personalizada.
            </p>
            {/* TODO: Connect to real form submission */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <Input
                placeholder="Seu nome"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                disabled
              />
              <Input
                placeholder="WhatsApp"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                disabled
              />
              <Input
                placeholder="E-mail"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 sm:col-span-2"
                disabled
              />
              <Button
                disabled
                className="sm:col-span-2 bg-accent text-accent-foreground font-body font-semibold"
              >
                Solicitar diagnóstico gratuito
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
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
      <QuickActions />
      <MobileStickyBar />

      <main className="lg:ml-56 xl:ml-64 px-4 md:px-8 max-w-4xl pb-24 lg:pb-8">
        <HeroSection />
        <ReservasSection />
        <MercadoSection />
        <SimuladorSection />
        <ReformaSection />
        <AntiChecklistSection />
        <DecoracaoSection />
        <ProjetoSection />
        <TendenciasSection />
        <CaseStudySection />
        <ChecklistSection />
        <FAQSection />
        <FinalCTASection />

        <footer className="text-center py-8 text-sm text-muted-foreground font-body border-t border-border">
          © 2025 · Guia do Investidor em Studios para Short Stay
        </footer>
      </main>
    </>
  );
}
