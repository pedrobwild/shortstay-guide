import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import bwildLogo from "@/assets/bwild-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Train, Calendar, DollarSign, TrendingUp, Briefcase,
  X, Clock, Wallet, Calculator, Zap, Flame, ArrowUpDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Neighborhood, MetroStation, CityEvent, NEIGHBORHOODS, METRO_STATIONS, EVENTS, HEAT_POINTS,
  DEMAND_FILTERS, EVENT_ICONS, IMPACT_STYLES, TAG_ICONS, scoreColor, fmt,
} from "@/data/mapaBairrosData";
import DemandHeatmap from "@/components/mapa/DemandHeatmap";
import ROIRanking from "@/components/mapa/ROIRanking";
import NeighborhoodComparison from "@/components/mapa/NeighborhoodComparison";

/* ─── ROI Simulator ─── */
function ROISimulator({ neighborhood, onClose }: { neighborhood: Neighborhood; onClose: () => void }) {
  const [nightly, setNightly] = useState([neighborhood.avgNightly]);
  const [occupancy, setOccupancy] = useState([neighborhood.avgOccupancy]);
  const [cleaning, setCleaning] = useState([80]);
  const [platformFee, setPlatformFee] = useState([15]);
  const [fixedCosts, setFixedCosts] = useState([2200]);
  const [investment, setInvestment] = useState([45000]);

  const result = useMemo(() => {
    const monthlyRevenue = nightly[0] * 30 * (occupancy[0] / 100);
    const platformCost = monthlyRevenue * (platformFee[0] / 100);
    const avgStays = Math.ceil((30 * occupancy[0] / 100) / 3);
    const totalCleaning = cleaning[0] * avgStays;
    const monthlyProfit = monthlyRevenue - platformCost - totalCleaning - fixedCosts[0];
    const annualProfit = monthlyProfit * 12;
    const roi = investment[0] > 0 ? (annualProfit / investment[0]) * 100 : 0;
    const payback = annualProfit > 0 ? investment[0] / annualProfit : 0;
    return { monthlyRevenue, monthlyProfit, annualProfit, roi, payback };
  }, [nightly, occupancy, cleaning, platformFee, fixedCosts, investment]);

  const sliders = [
    { label: "Diária média", value: nightly, set: setNightly, min: 100, max: 800, step: 10, prefix: "R$", suffix: "" },
    { label: "Ocupação", value: occupancy, set: setOccupancy, min: 40, max: 100, step: 1, prefix: "", suffix: "%" },
    { label: "Limpeza/estadia", value: cleaning, set: setCleaning, min: 40, max: 200, step: 10, prefix: "R$", suffix: "" },
    { label: "Taxa plataforma", value: platformFee, set: setPlatformFee, min: 3, max: 25, step: 1, prefix: "", suffix: "%" },
    { label: "Custos fixos/mês", value: fixedCosts, set: setFixedCosts, min: 800, max: 5000, step: 100, prefix: "R$", suffix: "" },
    { label: "Investimento inicial", value: investment, set: setInvestment, min: 10000, max: 150000, step: 5000, prefix: "R$", suffix: "" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Simulador ROI</h3>
          <p className="text-sm text-muted-foreground font-body">{neighborhood.name}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}><X size={16} /></Button>
      </div>
      <div className="space-y-4">
        {sliders.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-xs font-body mb-1.5">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-semibold text-foreground">{s.prefix}{fmt(s.value[0])}{s.suffix}</span>
            </div>
            <Slider value={s.value} onValueChange={s.set} min={s.min} max={s.max} step={s.step} className="w-full" />
          </div>
        ))}
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Receita mensal", value: `R$ ${fmt(result.monthlyRevenue)}`, icon: DollarSign, positive: true },
          { label: "Lucro mensal", value: `R$ ${fmt(result.monthlyProfit)}`, icon: Wallet, positive: result.monthlyProfit > 0 },
          { label: "ROI anual", value: `${result.roi.toFixed(1)}%`, icon: TrendingUp, positive: result.roi > 0 },
          { label: "Payback estimado", value: result.payback > 0 ? `${result.payback.toFixed(1)} anos` : "—", icon: Clock, positive: result.payback > 0 && result.payback < 5 },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={`border ${card.positive ? "border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-destructive/20 bg-destructive/5"}`}>
              <CardContent className="p-3 text-center">
                <card.icon size={16} className={`mx-auto mb-1 ${card.positive ? "text-emerald-600" : "text-destructive"}`} />
                <p className={`text-lg font-bold font-display ${card.positive ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground font-body">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Neighborhood Card ─── */
function NeighborhoodCard({ n, isSelected, isHighlighted, onClick }: { n: Neighborhood; isSelected: boolean; isHighlighted: boolean; onClick: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ y: -4 }} transition={{ duration: 0.35 }}>
      <Card
        onClick={onClick}
        className={`cursor-pointer transition-all duration-300 ${
          isSelected ? "ring-2 ring-primary border-primary shadow-lg" : isHighlighted ? "ring-2 ring-amber-400 border-amber-400 shadow-md" : "border-border hover:shadow-md hover:border-primary/30"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold text-foreground">{n.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${scoreColor(n.score)}`} />
              <span className="text-xs font-bold font-mono text-foreground">{n.score}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-body mb-3">
            <span>R$ {n.avgNightly}/noite</span>
            <span>{n.avgOccupancy}% ocup.</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{n.metrics.estimatedROI}% ROI</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {n.tags.slice(0, 4).map((tag) => {
              const Icon = TAG_ICONS[tag] || MapPin;
              return (
                <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  <Icon size={8} />{tag}
                </span>
              );
            })}
            {n.tags.length > 4 && <span className="text-[10px] text-muted-foreground">+{n.tags.length - 4}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Interactive Map ─── */
function InteractiveMap({
  neighborhoods, stations, showMetro, showHeatmap, selected, highlightedNames, onSelect,
}: {
  neighborhoods: Neighborhood[]; stations: MetroStation[]; showMetro: boolean; showHeatmap: boolean;
  selected: Neighborhood | null; highlightedNames: string[]; onSelect: (n: Neighborhood) => void;
}) {
  const [hoveredStation, setHoveredStation] = useState<MetroStation | null>(null);

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-xl border border-border overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Heatmap layer */}
      <DemandHeatmap heatPoints={HEAT_POINTS} visible={showHeatmap} />

      {/* Metro layer */}
      <AnimatePresence>
        {showMetro && stations.map((s) => (
          <motion.div key={s.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }} className="absolute z-10"
            style={{ left: `${s.coordinates.x}%`, top: `${s.coordinates.y}%`, transform: "translate(-50%, -50%)" }}
            onMouseEnter={() => setHoveredStation(s)} onMouseLeave={() => setHoveredStation(null)}
          >
            <div className="absolute w-12 h-12 rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 opacity-15" style={{ backgroundColor: s.color }} />
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer" style={{ backgroundColor: s.color }} />
            {hoveredStation?.id === s.id && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                <p className="text-xs font-bold text-foreground">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.line}</p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Neighborhood dots */}
      {neighborhoods.map((n) => {
        const isSel = selected?.name === n.name;
        const isHigh = highlightedNames.includes(n.name);
        return (
          <motion.div key={n.name} className="absolute z-20 cursor-pointer group"
            style={{ left: `${n.coordinates.x}%`, top: `${n.coordinates.y}%`, transform: "translate(-50%, -50%)" }}
            onClick={() => onSelect(n)} whileHover={{ scale: 1.3 }}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSel ? "border-primary bg-primary scale-125 shadow-lg" : isHigh ? "border-amber-400 bg-amber-400 shadow-md" : `${scoreColor(n.score)} border-white shadow-sm`
            }`}>
              <span className="text-[7px] font-bold text-white">{n.score}</span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border shadow-lg rounded-md px-2 py-1 whitespace-nowrap z-50">
              <p className="text-[10px] font-bold text-foreground">{n.name}</p>
              <p className="text-[9px] text-muted-foreground">R${n.avgNightly}/noite · {n.avgOccupancy}% · ROI {n.metrics.estimatedROI}%</p>
            </div>
          </motion.div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] text-muted-foreground font-body">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Alto (88+)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Médio (84-87)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" />Baixo (&lt;84)</span>
      </div>
    </div>
  );
}

/* ─── Events Timeline ─── */
function EventsTimeline({ events, onEventClick, activeEventId }: { events: CityEvent[]; onEventClick: (e: CityEvent) => void; activeEventId: number | null }) {
  const sorted = useMemo(() => [...events].sort((a, b) => a.startDate.localeCompare(b.startDate)), [events]);
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {sorted.map((ev, i) => {
          const Icon = EVENT_ICONS[ev.category] || Calendar;
          const impact = IMPACT_STYLES[ev.impactLevel];
          const isActive = activeEventId === ev.id;
          const start = new Date(ev.startDate);
          const end = new Date(ev.endDate);
          const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
          return (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Card onClick={() => onEventClick(ev)} className={`w-56 cursor-pointer transition-all ${isActive ? "ring-2 ring-primary border-primary shadow-lg" : "border-border hover:shadow-md hover:border-primary/30"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${impact.bg}`}><Icon size={14} className={impact.text} /></div>
                    <Badge className={`text-[9px] px-1.5 py-0 ${impact.bg} ${impact.text}`}>{impact.label}</Badge>
                  </div>
                  <h4 className="font-display text-sm font-bold text-foreground mb-1 leading-snug">{ev.name}</h4>
                  <p className="text-[11px] text-muted-foreground font-body mb-2">{fmtDate(start)} — {fmtDate(end)}</p>
                  <div className="flex flex-wrap gap-1">
                    {ev.nearbyNeighborhoods.slice(0, 3).map((n) => (
                      <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">{n}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MapaBairros() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showMetro, setShowMetro] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CityEvent | null>(null);
  const [search, setSearch] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [rightPanel, setRightPanel] = useState<"ranking" | "simulator">("ranking");

  const toggleFilter = useCallback((key: string) => {
    if (key === "metro") { setShowMetro((v) => !v); return; }
    setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);
  }, []);

  const highlightedNames = activeEvent?.nearbyNeighborhoods || [];

  const filtered = useMemo(() => {
    let list = [...NEIGHBORHOODS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q)));
    }
    if (activeFilters.length > 0) {
      list = list.filter((n) => activeFilters.some((f) => {
        if (f === "tourism") return n.demandProfile.includes("tourism");
        if (f === "business") return n.demandProfile === "business";
        if (f === "events") return n.demandProfile === "events";
        if (f === "medical") return n.demandProfile === "medical";
        if (f === "mixed") return n.demandProfile === "mixed";
        return false;
      }));
    }
    return list.sort((a, b) => b.score - a.score);
  }, [search, activeFilters]);

  const handleEventClick = useCallback((ev: CityEvent) => {
    setActiveEvent((prev) => prev?.id === ev.id ? null : ev);
  }, []);

  const handleRankingSelect = useCallback((n: Neighborhood) => {
    setSelectedNeighborhood(n);
    setRightPanel("simulator");
  }, []);

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
        <section className="py-10 md:py-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-0 font-body">São Paulo · Dashboard do investidor</Badge>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-3">
              Mapa de Bairros Rentáveis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-body">
              Analise demanda, compare bairros, simule ROI e identifique os melhores investimentos em studios.
            </p>
          </motion.div>
        </section>

        {/* Filters + Controls */}
        <section className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar bairro…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant={showComparison ? "default" : "outline"} size="sm" className="text-xs gap-1.5"
                onClick={() => setShowComparison(!showComparison)}>
                <ArrowUpDown size={14} />Comparar bairros
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DEMAND_FILTERS.map((f) => {
              const active = f.key === "metro" ? showMetro : activeFilters.includes(f.key);
              return (
                <button key={f.key} onClick={() => toggleFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  }`}>
                  <f.icon size={12} />{f.label}
                </button>
              );
            })}
            {/* Heatmap toggle */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <Flame size={12} className={showHeatmap ? "text-destructive" : "text-muted-foreground"} />
              <span className="text-xs text-muted-foreground">Heatmap</span>
              <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} className="scale-75" />
            </div>
            {(activeFilters.length > 0 || showMetro) && (
              <button onClick={() => { setActiveFilters([]); setShowMetro(false); }} className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        {/* Comparison panel */}
        <AnimatePresence>
          {showComparison && (
            <section className="mb-8">
              <NeighborhoodComparison onClose={() => setShowComparison(false)} initialNeighborhoods={NEIGHBORHOODS.slice(0, 2)} />
            </section>
          )}
        </AnimatePresence>

        {/* Map + Right Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
            <InteractiveMap
              neighborhoods={filtered}
              stations={METRO_STATIONS}
              showMetro={showMetro}
              showHeatmap={showHeatmap}
              selected={selectedNeighborhood}
              highlightedNames={highlightedNames}
              onSelect={(n) => { setSelectedNeighborhood(n); setRightPanel("simulator"); }}
            />
          </div>

          {/* Right panel: Ranking or Simulator */}
          <div className="lg:col-span-1">
            {/* Panel tabs */}
            <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
              <button
                onClick={() => setRightPanel("ranking")}
                className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${
                  rightPanel === "ranking" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp size={12} className="inline mr-1" />Ranking
              </button>
              <button
                onClick={() => setRightPanel("simulator")}
                className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${
                  rightPanel === "simulator" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calculator size={12} className="inline mr-1" />Simulador
              </button>
            </div>

            <AnimatePresence mode="wait">
              {rightPanel === "ranking" ? (
                <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ROIRanking
                    neighborhoods={filtered}
                    onSelectNeighborhood={handleRankingSelect}
                    selectedName={selectedNeighborhood?.name}
                  />
                </motion.div>
              ) : selectedNeighborhood ? (
                <ROISimulator
                  key={selectedNeighborhood.name}
                  neighborhood={selectedNeighborhood}
                  onClose={() => { setSelectedNeighborhood(null); setRightPanel("ranking"); }}
                />
              ) : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-muted-foreground">
                  <Calculator size={32} className="mb-3 opacity-30" />
                  <p className="font-body text-sm">Selecione um bairro no mapa ou ranking para simular ROI</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Neighborhood Grid */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Bairros analisados</h2>
          <p className="text-sm text-muted-foreground font-body mb-4">{filtered.length} bairro{filtered.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((n) => (
                <NeighborhoodCard key={n.name} n={n} isSelected={selectedNeighborhood?.name === n.name}
                  isHighlighted={highlightedNames.includes(n.name)}
                  onClick={() => { setSelectedNeighborhood(n); setRightPanel("simulator"); }} />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Events */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={20} className="text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">Eventos que aumentam a demanda</h2>
          </div>
          <p className="text-sm text-muted-foreground font-body mb-4">Clique em um evento para destacar os bairros impactados no mapa.</p>
          <EventsTimeline events={EVENTS} onEventClick={handleEventClick} activeEventId={activeEvent?.id ?? null} />
        </section>

        {/* CTA */}
        <section className="bg-hero-gradient rounded-2xl p-8 md:p-12 text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">Encontrou seu bairro ideal?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-6 font-body">Combine a análise de bairro com as tendências premium para maximizar sua rentabilidade.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 font-body">
              <Link to="/#simulador"><Calculator size={18} className="mr-2" />Simulador completo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 font-body">
              <Link to="/tendencias-premium-2026"><TrendingUp size={18} className="mr-2" />Ver tendências 2026</Link>
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
