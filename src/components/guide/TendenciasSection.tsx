import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { ArrowUpDown, CheckCircle2 } from "lucide-react";
import {
  TRENDS_2026, TREND_ALL_TAGS, TREND_TAG_ICONS, TREND_TAG_COLORS,
  TREND_IMPACT_ORDER, TREND_DIFF_ORDER,
  trendDiffLabel, trendDiffColor, trendImpactLabel, trendImpactColor,
  type TrendSortMode,
} from "@/data/guide-data";
import SectionBlock from "./SectionBlock";

export default function TendenciasSection() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<TrendSortMode>("impact");

  const filtered = useMemo(() => {
    let items = activeTag ? TRENDS_2026.filter((t) => t.tags.includes(activeTag)) : [...TRENDS_2026];
    if (sortMode === "impact") items.sort((a, b) => TREND_IMPACT_ORDER[a.impact] - TREND_IMPACT_ORDER[b.impact]);
    else if (sortMode === "easy") items.sort((a, b) => TREND_DIFF_ORDER[a.difficulty] - TREND_DIFF_ORDER[b.difficulty]);
    else items.sort((a, b) => TREND_DIFF_ORDER[b.difficulty] - TREND_DIFF_ORDER[a.difficulty]);
    return items;
  }, [activeTag, sortMode]);

  const sortOptions: { mode: TrendSortMode; label: string }[] = [
    { mode: "impact", label: "Maior impacto" },
    { mode: "easy", label: "Mais fácil" },
    { mode: "pro", label: "Mais avançado" },
  ];

  return (
    <SectionBlock id="tendencias" title="Tendências 2026" takeaway="20 práticas dos hosts mais rentáveis do Brasil.">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant={activeTag === null ? "default" : "secondary"}
          className="cursor-pointer font-body"
          onClick={() => setActiveTag(null)}
        >
          Todos
        </Badge>
        {TREND_ALL_TAGS.map((tag) => {
          const Icon = TREND_TAG_ICONS[tag];
          return (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "secondary"}
              className={`cursor-pointer font-body ${activeTag !== tag ? TREND_TAG_COLORS[tag] || "" : ""}`}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            >
              {Icon && <Icon size={12} className="mr-1" />}
              {tag}
            </Badge>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <ArrowUpDown size={14} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-body">Ordenar:</span>
        {sortOptions.map((opt) => (
          <Button
            key={opt.mode}
            size="sm"
            variant={sortMode === opt.mode ? "default" : "outline"}
            className="text-xs h-7 font-body"
            onClick={() => setSortMode(opt.mode)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <Accordion type="multiple" className="font-body space-y-2">
        {filtered.map((trend, i) => (
          <AccordionItem key={trend.id} value={String(trend.id)} className="border border-border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <motion.div
                className="flex items-center gap-3 w-full text-left"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <span className="text-xs font-bold text-primary min-w-[28px]">{trend.numberLabel}</span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{trend.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{trend.short}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Badge className={`text-[10px] px-1.5 py-0 ${trendDiffColor[trend.difficulty]}`}>{trendDiffLabel[trend.difficulty]}</Badge>
                  <Badge className={`text-[10px] px-1.5 py-0 ${trendImpactColor[trend.impact]}`}>{trendImpactLabel[trend.impact]}</Badge>
                </div>
              </motion.div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-3">{trend.details.what}</p>
              <p className="text-xs font-semibold text-foreground mb-2">Como implementar:</p>
              <ul className="space-y-1 mb-3">
                {trend.details.how.map((step) => (
                  <li key={step} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-semibold text-foreground mb-1">Checklist:</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {trend.details.checklist.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs font-body">{c}</Badge>
                ))}
              </div>
              <p className="text-xs text-primary font-medium mt-2">Impacto esperado: {trend.details.expectedImpact}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionBlock>
  );
}
