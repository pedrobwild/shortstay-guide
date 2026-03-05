import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import bwildLogo from "@/assets/bwild-logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Camera,
  Eye,
  Palette,
  DoorOpen,
  Map,
  Wifi,
  BedDouble,
  Shirt,
  Moon,
  Lightbulb,
  Gem,
  Tv,
  SprayCan,
  ClipboardList,
  TrendingUp as TrendIcon,
  CalendarClock,
  Timer,
  MessageSquare,
  Star,
  Layers,
  MousePointerClick,
  CalendarCheck,
  DollarSign,
  ThumbsUp,
  ArrowLeft,
  CheckCircle2,
  Zap,
  BarChart3,
  SlidersHorizontal,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ─── Types ─── */
type Difficulty = "easy" | "medium" | "advanced";
type Impact = "high" | "medium" | "low";

interface TrendDetails {
  what: string;
  how: string[];
  checklist: string[];
  expectedImpact: string;
}

interface Trend {
  id: number;
  numberLabel: string;
  title: string;
  short: string;
  tags: string[];
  difficulty: Difficulty;
  impact: Impact;
  details: TrendDetails;
}

/* ─── Tag icon map ─── */
const TAG_ICONS: Record<string, typeof Camera> = {
  Fotos: Camera,
  Design: Palette,
  Operação: ClipboardList,
  Precificação: DollarSign,
  "Experiência": Gem,
  Automação: Zap,
  Escala: Layers,
};

const TAG_COLORS: Record<string, string> = {
  Fotos: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Design: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Operação: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Precificação: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Experiência": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  Automação: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  Escala: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const ALL_TAGS = ["Fotos", "Design", "Operação", "Precificação", "Experiência", "Automação", "Escala"];

type SortMode = "impact" | "easy" | "pro";

/* ─── Seed data ─── */
const TRENDS: Trend[] = [
  {
    id: 1, numberLabel: "#1", title: "Fotografia profissional estratégica",
    short: "Fotos profissionais aumentam CTR, conversão e diária.",
    tags: ["Fotos"], difficulty: "medium", impact: "high",
    details: {
      what: "Hosts top investem em fotógrafos especializados em Airbnb.",
      how: ["Contrate fotógrafo com portfólio de interiores e short stay.", "Fotografe com luz natural e enquadramentos amplos.", "Priorize a foto principal como 'foto de capa'."],
      checklist: ["Foto de capa forte", "Cozinha/banheiro bem iluminados", "Sequência lógica (entrada → sala → cama → cozinha → banheiro)"],
      expectedImpact: "Impacto médio: +20% a +40% nas reservas.",
    },
  },
  {
    id: 2, numberLabel: "#2", title: "Primeira foto extremamente forte",
    short: "A primeira imagem define se o usuário clica no anúncio.",
    tags: ["Fotos"], difficulty: "easy", impact: "high",
    details: {
      what: "A imagem de capa é o maior driver de cliques.",
      how: ["Use iluminação perfeita e enquadramento amplo.", "Inclua um elemento visual marcante na capa.", "Evite fotos escuras ou muito fechadas."],
      checklist: ["Capa clara e ampla", "Elemento memorável visível", "Sem excesso de informação"],
      expectedImpact: "Aumenta CTR e melhora a taxa de reserva.",
    },
  },
  {
    id: 3, numberLabel: "#3", title: "Identidade visual do apartamento",
    short: "Um conceito único faz o anúncio se destacar.",
    tags: ["Design"], difficulty: "medium", impact: "high",
    details: {
      what: "Hosts profissionais criam um tema consistente.",
      how: ["Escolha um conceito: industrial, tropical minimalista, urbano sofisticado, escandinavo.", "Mantenha paleta de cores consistente.", "Use 1–2 peças 'statement'."],
      checklist: ["Paleta definida", "Tema aplicado em decoração e fotos", "Peça marcante"],
      expectedImpact: "Diferencia o anúncio e aumenta cliques.",
    },
  },
  {
    id: 4, numberLabel: "#4", title: "Self check-in ultra intuitivo",
    short: "Menos fricção no check-in, menos mensagens e mais avaliações.",
    tags: ["Operação", "Automação"], difficulty: "medium", impact: "high",
    details: {
      what: "Além da fechadura digital, a experiência é guiada.",
      how: ["Crie vídeo de check-in (30–60s).", "Manual visual com fotos e passos curtos.", "Instruções simplificadas e padronizadas."],
      checklist: ["Fechadura digital + backup", "Vídeo curto", "Manual visual"],
      expectedImpact: "Reduz perguntas e melhora avaliações.",
    },
  },
  {
    id: 5, numberLabel: "#5", title: "Guia digital personalizado da cidade",
    short: "Guia local aumenta satisfação e reviews.",
    tags: ["Experiência"], difficulty: "easy", impact: "medium",
    details: {
      what: "Um guia digital melhora a jornada do hóspede.",
      how: ["Recomende restaurantes, cafés e coworkings.", "Inclua transporte e turismo por proximidade.", "Atualize periodicamente."],
      checklist: ["Top 10 lugares", "Mapa/links", "Dicas por perfil"],
      expectedImpact: "Melhora avaliação e aumenta recomendações.",
    },
  },
  {
    id: 6, numberLabel: "#6", title: "Wi-Fi extremamente rápido",
    short: "Wi-Fi rápido é filtro decisivo para muitos hóspedes.",
    tags: ["Experiência"], difficulty: "easy", impact: "high",
    details: {
      what: "Infra de internet vira diferencial competitivo.",
      how: ["Instale fibra e roteador premium.", "Use repetidores se necessário.", "Teste velocidade real no ambiente."],
      checklist: ["Fibra ativa", "Roteador bom", "Senha fácil + QR code"],
      expectedImpact: "Aumenta reservas (especialmente trabalho remoto).",
    },
  },
  {
    id: 7, numberLabel: "#7", title: "Colchão padrão hotel",
    short: "Sono excelente = mais 5 estrelas.",
    tags: ["Experiência"], difficulty: "medium", impact: "high",
    details: {
      what: "Um dos maiores drivers de avaliação.",
      how: ["Use queen/king quando possível.", "Pillow top e travesseiros de qualidade.", "Proteção de colchão e troca regular."],
      checklist: ["Colchão premium", "2 tipos de travesseiro", "Protetor impermeável"],
      expectedImpact: "Aumenta reviews e recorrência.",
    },
  },
  {
    id: 8, numberLabel: "#8", title: "Roupa de cama premium",
    short: "Sensação de hotel com enxoval superior.",
    tags: ["Experiência"], difficulty: "medium", impact: "medium",
    details: {
      what: "Percepção de valor sobe com enxoval.",
      how: ["Algodão 300+ fios, duvet, várias almofadas.", "Padronize cores e reposição."],
      checklist: ["Jogo completo reserva", "Toalhas boas", "Apresentação impecável"],
      expectedImpact: "Melhora nota e permite ADR maior.",
    },
  },
  {
    id: 9, numberLabel: "#9", title: "Cortinas blackout",
    short: "Sono melhor para hóspedes de qualquer fuso.",
    tags: ["Experiência"], difficulty: "easy", impact: "medium",
    details: {
      what: "Blackout reduz reclamações e melhora conforto.",
      how: ["Instale trilho e tecido blackout real.", "Evite entrada lateral de luz."],
      checklist: ["Blackout total", "Vedação lateral"],
      expectedImpact: "Melhora avaliação de conforto.",
    },
  },
  {
    id: 10, numberLabel: "#10", title: "Iluminação pensada para fotos",
    short: "Iluminação boa melhora fotos e experiência.",
    tags: ["Design", "Fotos"], difficulty: "medium", impact: "medium",
    details: {
      what: "A luz certa melhora o anúncio e o ambiente.",
      how: ["Use iluminação indireta e luz quente.", "Inclua luminárias decorativas."],
      checklist: ["Luz geral + indireta", "Luz de leitura"],
      expectedImpact: "Fotos mais atrativas e melhor experiência.",
    },
  },
  {
    id: 11, numberLabel: "#11", title: "Elemento de design único",
    short: "Um detalhe memorável aumenta lembrança e cliques.",
    tags: ["Design"], difficulty: "medium", impact: "medium",
    details: {
      what: "Studios de sucesso têm um 'wow factor'.",
      how: ["Parede artística, cadeira icônica, painel ripado ou luminária escultural."],
      checklist: ["1 peça wow", "Visível na capa"],
      expectedImpact: "Diferencia e aumenta CTR.",
    },
  },
  {
    id: 12, numberLabel: "#12", title: "Smart TV com streaming liberado",
    short: "Streaming é padrão esperado.",
    tags: ["Experiência"], difficulty: "easy", impact: "medium",
    details: {
      what: "TV + streaming reduz atrito e aumenta satisfação.",
      how: ["Smart TV, YouTube, Chromecast.", "Instruções simples para uso."],
      checklist: ["Streaming pronto", "Guia rápido"],
      expectedImpact: "Melhora reviews e reduz dúvidas.",
    },
  },
  {
    id: 13, numberLabel: "#13", title: "Limpeza profissional padronizada",
    short: "Limpeza consistente = avaliações consistentes.",
    tags: ["Operação"], difficulty: "medium", impact: "high",
    details: {
      what: "Operação profissional exige padrão de hotel.",
      how: ["Checklist de limpeza e equipe fixa.", "Inspeção por fotos."],
      checklist: ["Checklist", "Padrão banheiro", "Reposição controlada"],
      expectedImpact: "Aumenta nota e reduz reclamações.",
    },
  },
  {
    id: 14, numberLabel: "#14", title: "Checklists operacionais",
    short: "Processos permitem escalar sem perder qualidade.",
    tags: ["Operação", "Escala"], difficulty: "medium", impact: "high",
    details: {
      what: "Empreendedores criam processos replicáveis.",
      how: ["Check-in checklist, limpeza checklist, reposição checklist."],
      checklist: ["Processos documentados", "Responsáveis definidos"],
      expectedImpact: "Escala com menos erro.",
    },
  },
  {
    id: 15, numberLabel: "#15", title: "Preço dinâmico automático",
    short: "Preço ajustado diariamente maximiza receita.",
    tags: ["Precificação", "Automação"], difficulty: "medium", impact: "high",
    details: {
      what: "Plataformas ajustam preço com base em demanda.",
      how: ["Use PriceLabs, Beyond ou Wheelhouse.", "Defina piso, teto e regras."],
      checklist: ["Ferramenta ativa", "Regras por temporada"],
      expectedImpact: "Maximiza ADR e ocupação.",
    },
  },
  {
    id: 16, numberLabel: "#16", title: "Gestão profissional de calendário",
    short: "Calendário otimizado captura picos de demanda.",
    tags: ["Precificação", "Operação"], difficulty: "medium", impact: "medium",
    details: {
      what: "Hosts monitoram ocupação, eventos e feriados.",
      how: ["Antecipe datas-chave e ajuste regras."],
      checklist: ["Datas de pico mapeadas", "Regras de estadia mínima"],
      expectedImpact: "Aumenta receita em períodos fortes.",
    },
  },
  {
    id: 17, numberLabel: "#17", title: "Estratégia de estadia mínima",
    short: "Regras por período melhoram ocupação e eficiência.",
    tags: ["Precificação"], difficulty: "easy", impact: "medium",
    details: {
      what: "Mínimo de noites varia por demanda.",
      how: ["Fim de semana: mínimo 2 noites.", "Alta temporada: mínimo 3 noites."],
      checklist: ["Regras por temporada"],
      expectedImpact: "Menos gaps e melhor ocupação.",
    },
  },
  {
    id: 18, numberLabel: "#18", title: "Automatização de mensagens",
    short: "Automação reduz trabalho e melhora experiência.",
    tags: ["Automação", "Operação"], difficulty: "medium", impact: "medium",
    details: {
      what: "Mensagens padronizadas e automáticas.",
      how: ["Pré check-in, guia da casa, pós checkout.", "Use Hospitable ou Guesty."],
      checklist: ["Templates prontos", "Gatilhos configurados"],
      expectedImpact: "Menos esforço e menos erro.",
    },
  },
  {
    id: 19, numberLabel: "#19", title: "Reviews estratégicas",
    short: "Pedir review na hora certa aumenta a taxa de avaliação.",
    tags: ["Operação"], difficulty: "easy", impact: "medium",
    details: {
      what: "Mensagem pós checkout pedindo avaliação.",
      how: ["Automatize a solicitação e seja cordial."],
      checklist: ["Mensagem automática"],
      expectedImpact: "Mais avaliações 5 estrelas.",
    },
  },
  {
    id: 20, numberLabel: "#20", title: "Portfólio de unidades",
    short: "Hosts +100k escalam com padrão replicável.",
    tags: ["Escala"], difficulty: "advanced", impact: "high",
    details: {
      what: "Receita alta vem de escala e padronização.",
      how: ["Replicar operação e padrão em 3 a 10 unidades."],
      checklist: ["Padrão replicável", "Equipe e processos"],
      expectedImpact: "Transforma o Airbnb em negócio recorrente.",
    },
  },
];

/* ─── Helpers ─── */
const IMPACT_ORDER: Record<Impact, number> = { high: 0, medium: 1, low: 2 };
const DIFF_ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, advanced: 2 };

const diffLabel: Record<Difficulty, string> = { easy: "Fácil", medium: "Médio", advanced: "Avançado" };
const diffColor: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const impactLabel: Record<Impact, string> = { high: "Alto impacto", medium: "Médio impacto", low: "Baixo impacto" };
const impactColor: Record<Impact, string> = {
  high: "bg-primary/10 text-primary",
  medium: "bg-accent/10 text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

/* ─── KPI Card ─── */
function KPICard({ icon: Icon, label }: { icon: typeof MousePointerClick; label: string }) {
  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="text-primary" size={20} />
        </div>
        <p className="text-sm font-medium text-foreground font-body">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ─── Trend Card ─── */
function TrendCard({ trend, onOpen }: { trend: Trend; onOpen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      layout
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border bg-card h-full hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer" onClick={onOpen}>
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="font-mono text-xs font-bold">{trend.numberLabel}</Badge>
            <div className="flex gap-1.5">
              <Badge className={`text-[10px] px-1.5 py-0 ${diffColor[trend.difficulty]}`}>{diffLabel[trend.difficulty]}</Badge>
              <Badge className={`text-[10px] px-1.5 py-0 ${impactColor[trend.impact]}`}>{impactLabel[trend.impact]}</Badge>
            </div>
          </div>
          <h3 className="font-display text-base font-bold text-foreground mb-2 leading-snug">{trend.title}</h3>
          <p className="text-sm text-muted-foreground font-body mb-4 flex-1">{trend.short}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {trend.tags.map((tag) => {
              const TagIcon = TAG_ICONS[tag] || Gem;
              return (
                <span key={tag} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                  <TagIcon size={10} />
                  {tag}
                </span>
              );
            })}
          </div>
          <Button size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Ver detalhes
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Detail Modal ─── */
function TrendDetailModal({ trend, open, onClose }: { trend: Trend | null; open: boolean; onClose: () => void }) {
  if (!trend) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="font-mono text-xs font-bold">{trend.numberLabel}</Badge>
            <Badge className={`text-[10px] px-1.5 py-0 ${impactColor[trend.impact]}`}>{impactLabel[trend.impact]}</Badge>
          </div>
          <DialogTitle className="font-display text-xl">{trend.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* What */}
          <div>
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-1">
              <Eye size={14} className="text-primary" /> O que é
            </h4>
            <p className="text-sm text-muted-foreground">{trend.details.what}</p>
          </div>

          {/* How */}
          <div>
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-2">
              <SlidersHorizontal size={14} className="text-primary" /> Como aplicar
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

          {/* Checklist */}
          <div>
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-primary" /> Checklist rápido
            </h4>
            <ul className="space-y-1">
              {trend.details.checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Impact */}
          <div className="bg-primary/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground font-body flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-primary" /> Impacto esperado
            </h4>
            <p className="text-sm text-muted-foreground">{trend.details.expectedImpact}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {trend.tags.map((tag) => {
              const TagIcon = TAG_ICONS[tag] || Gem;
              return (
                <span key={tag} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
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

/* ─── Main page ─── */
export default function TendenciasPremium() {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>("impact");
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const filtered = useMemo(() => {
    let list = [...TRENDS];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)));
    }

    // tags
    if (activeTags.length > 0) {
      list = list.filter((t) => t.tags.some((tag) => activeTags.includes(tag)));
    }

    // sort
    if (sort === "impact") {
      list.sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]);
    } else if (sort === "easy") {
      list.sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
    }
    // "pro" keeps original order (by id)

    return list;
  }, [search, activeTags, sort]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar ao guia</span>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <img src={bwildLogo} alt="Bwild" className="h-6 w-auto" />
          <span className="text-xs text-muted-foreground font-body hidden md:inline">Tendências Premium 2026</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 pb-24">
        {/* 1) Hero */}
        <section className="py-12 md:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-0 font-body">2026 · Hosts +100k/ano</Badge>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
              Tendências Premium 2026
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-body">
              Práticas que os hosts mais rentáveis usam para aumentar ocupação, diária e avaliações.
            </p>
          </motion.div>
        </section>

        {/* 2) KPI Highlights */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <KPICard icon={MousePointerClick} label="Mais cliques (CTR)" />
          <KPICard icon={CalendarCheck} label="Maior taxa de reserva" />
          <KPICard icon={DollarSign} label="Maior diária média" />
          <KPICard icon={ThumbsUp} label="Melhores avaliações" />
        </section>

        {/* 4) Filters + Search */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tendência…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["impact", "easy", "pro"] as SortMode[]).map((s) => {
                const labels: Record<SortMode, string> = { impact: "Mais impacto", easy: "Mais fácil", pro: "Mais usado" };
                return (
                  <Button key={s} size="sm" variant={sort === s ? "default" : "outline"} onClick={() => setSort(s)}
                    className={sort === s ? "bg-primary text-primary-foreground" : ""}>
                    {labels[s]}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((tag) => {
              const active = activeTags.includes(tag);
              const TagIcon = TAG_ICONS[tag] || Gem;
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
        </section>

        {/* 3) Trend Grid */}
        <section className="mb-16">
          <p className="text-sm text-muted-foreground mb-4 font-body">{filtered.length} tendência{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}</p>
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map((t) => (
                <TrendCard key={t.id} trend={t} onOpen={() => setSelectedTrend(t)} />
              ))}
            </div>
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-body">Nenhuma tendência encontrada com esses filtros.</p>
            </div>
          )}
        </section>

        {/* 5) CTA Section */}
        <section className="bg-hero-gradient rounded-2xl p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
            Quer aplicar isso no seu studio?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-6 font-body">
            Aplicar essas tendências aumenta ocupação, diária média e nota de avaliação — os três pilares de um studio rentável.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 font-body">
              <Link to="/#checklist">
                <CheckCircle2 size={18} className="mr-2" />
                Ver checklist do studio ideal
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 font-body">
              <Link to="/#simulador">
                <Calculator size={18} className="mr-2" />
                Simular rentabilidade
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground font-body border-t border-border mt-12">
          <img src={bwildLogo} alt="Bwild" className="h-6 w-auto mx-auto mb-3 opacity-60" />
          © 2026 Bwild · Tendências Premium para Hosts
        </footer>
      </main>

      {/* Detail modal */}
      <TrendDetailModal trend={selectedTrend} open={!!selectedTrend} onClose={() => setSelectedTrend(null)} />
    </div>
  );
}
