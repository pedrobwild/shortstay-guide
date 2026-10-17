import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, DollarSign, BarChart3, Users, ChevronDown, Lightbulb } from "lucide-react";
import { INVESTOR_INSIGHTS, DEMAND_PROFILE_LABELS } from "@/data/mapaBairrosData";
import FonteBairro from "@/components/guide/FonteBairro";
import FonteLink from "@/components/guide/FonteLink";
import NaturezaTag from "@/components/radar/NaturezaTag";
import type { LeituraBairro } from "@/lib/leiturasBairros";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";

type SortKey = "receita" | "nightly" | "occupancy" | "competition";

const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof TrendingUp }[] = [
  { key: "receita", label: "Receita de referência", icon: TrendingUp },
  { key: "nightly", label: "Diária média", icon: DollarSign },
  { key: "occupancy", label: "Ocupação", icon: BarChart3 },
  { key: "competition", label: "Menor concorrência", icon: Users },
];

const competitionOrder = { "baixa": 0, "média": 1, "alta": 2 };

interface ROIRankingProps {
  neighborhoods: LeituraBairro[];
  onSelectNeighborhood: (n: LeituraBairro) => void;
  selectedName?: string;
}

/**
 * Ranking dos bairros das leituras do mapa (só bairros da base do Radar). Diária,
 * ocupação e receita são os mesmos números do painel; score e concorrência são
 * critérios internos da Bewild.
 */
export default function ROIRanking({ neighborhoods, onSelectNeighborhood, selectedName }: ROIRankingProps) {
  const [sortBy, setSortBy] = useState<SortKey>("receita");
  const [showSort, setShowSort] = useState(false);

  const sorted = useMemo(() => {
    const valor = (n: LeituraBairro) => {
      switch (sortBy) {
        case "receita": return n.metrics.avgRevenueMo;
        case "nightly": return n.metrics.nightlyRate;
        case "occupancy": return n.metrics.occupancy;
        case "competition": return -competitionOrder[n.metrics.competitionLevel];
      }
    };
    return [...neighborhoods].sort((a, b) => valor(b) - valor(a) || a.name.localeCompare(b.name, "pt-BR"));
  }, [neighborhoods, sortBy]);

  const currentSort = SORT_OPTIONS.find((s) => s.key === sortBy)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Ranking dos bairros</h3>
          <p className="text-xs text-muted-foreground font-body">{neighborhoods.length} bairros</p>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] gap-1.5 text-xs"
            onClick={() => setShowSort(!showSort)}
            aria-expanded={showSort}
          >
            <currentSort.icon size={12} />
            {currentSort.label}
            <ChevronDown size={12} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
          </Button>
          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-dialog z-50 min-w-[190px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                    className={`flex min-h-[44px] w-full items-center gap-2 px-3 text-xs transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-secondary ${
                      sortBy === opt.key ? "bg-accent-light font-semibold text-primary" : "text-foreground"
                    }`}
                  >
                    <opt.icon size={12} />
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md bg-secondary p-2 font-body text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Legenda:</span>
        <span><strong className="text-foreground">Receita ref.</strong> = diária × 30 × ocupação, da base do Radar</span>
        <span><strong className="text-foreground">Score</strong> = critério interno da Bewild</span>
      </div>
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {sorted.map((n, i) => {
            const profile = DEMAND_PROFILE_LABELS[n.demandProfile] || { label: n.demandProfile, emoji: "📍" };
            const isSelected = selectedName === n.name;
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => onSelectNeighborhood(n)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectNeighborhood(n); } }}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/30"
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                        i < 3 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-sm font-bold text-foreground truncate">{n.name}</h4>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {profile.emoji} {profile.label}
                          </Badge>
                        </div>
                        {(n.natureza !== "observado" || n.aviso) && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {n.natureza !== "observado" && <NaturezaTag tipo={n.natureza} tamanho="sm" />}
                            {n.aviso && <span className="text-[11px] font-medium text-estimate-text">{n.aviso}</span>}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Receita ref./mês</p>
                            <p className="text-xs font-bold tabular-nums text-primary">{formatBRL(n.metrics.avgRevenueMo)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Diária média</p>
                            <p className="text-xs font-bold tabular-nums text-foreground">{formatBRL(n.metrics.nightlyRate)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Ocupação</p>
                            <p className="text-xs font-bold tabular-nums text-foreground">{formatPercent(n.metrics.occupancy, 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Score (critério interno)</p>
                            <p className="text-xs font-bold tabular-nums text-foreground">{n.score}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-body tabular-nums">
                          {n.natureza === "estimativa" ? "Faixa estimada" : n.natureza === "aproximacao" ? "Faixa central do Itaim Bibi (25% a 75%)" : "Faixa central (25% a 75%)"}: {formatBRL(n.metrics.nightlyRateRange[0])}–{formatBRL(n.metrics.nightlyRateRange[1])}
                          {n.metrics.activeListings != null ? ` · ${formatDecimal(n.metrics.activeListings, 0)} anúncios` : ""}
                        </p>
                        <FonteBairro nome={n.name} semNatureza />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Investor insights */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lightbulb size={12} />
          Insights do investidor
        </div>
        {INVESTOR_INSIGHTS.slice(0, 4).map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-accent-light border border-border">
              <insight.icon size={14} className="text-primary shrink-0 mt-0.5" />
              <div className="min-w-0"><p className="text-[11px] text-foreground-medium font-body leading-relaxed">{insight.text}</p>{insight.source && <FonteLink fonte={insight.source} />}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
