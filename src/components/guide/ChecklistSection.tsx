import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CHECKLIST_ITEMS, SCORE_TIERS } from "@/data/guide-data";
import SectionBlock from "./SectionBlock";

export default function ChecklistSection() {
  const [checked, setChecked] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  const score = checked.filter(Boolean).length;
  const tier = SCORE_TIERS.find((t) => score >= t.min && score <= t.max) ?? SCORE_TIERS[0];

  return (
    <SectionBlock id="checklist" title="Checklist do Investidor" takeaway="Avalie sua preparação antes de investir.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {CHECKLIST_ITEMS.map((item, i) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
          >
            <Card
              className={`border-border cursor-pointer transition-colors ${checked[i] ? "bg-primary/5 border-primary/30" : ""}`}
              onClick={() => toggle(i)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Checkbox checked={checked[i]} onCheckedChange={() => toggle(i)} />
                <span className={`text-sm font-body ${checked[i] ? "text-foreground font-medium" : "text-muted-foreground"}`}>{item}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground font-body mb-2">Sua pontuação</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-4xl font-display font-bold text-foreground">{score}</span>
            <span className="text-lg text-muted-foreground font-body">/ {CHECKLIST_ITEMS.length}</span>
          </div>
          <Badge className={`${tier.color} text-white font-body text-sm px-3 py-1`}>{tier.label}</Badge>
          <p className="text-sm text-muted-foreground font-body mt-3 max-w-md mx-auto">{tier.desc}</p>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div className={`${tier.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${(score / CHECKLIST_ITEMS.length) * 100}%` }} />
          </div>
        </CardContent>
      </Card>
    </SectionBlock>
  );
}
