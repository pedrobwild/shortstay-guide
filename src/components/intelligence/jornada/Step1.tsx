import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Target, Scale, Lightbulb, ArrowRight, AlertTriangle, Banknote, Sparkles, Info } from "lucide-react";
import { motion } from "framer-motion";
import { type BairroAirbnb } from "@/types/intelligence";
import { DATA_COMMUNICATION } from "@/lib/productFoundation";
import { fmtBRL, fmtPct } from "@/hooks/useIntelligenceData";
import { MicroNote } from "./shared";
import { stagger } from "./constantes";

// ═══════════════════════════════════════════════════════════════════
// STEP 1: CONTEXTUALIZAR
// ═══════════════════════════════════════════════════════════════════

export const Step1Context = ({ bairros, onNext }: { bairros: BairroAirbnb[]; onNext: () => void }) => {
  const avgADR = bairros.reduce((s, b) => s + Number(b.adr_medio_studio), 0) / bairros.length;
  const avgOcc = bairros.reduce((s, b) => s + Number(b.ocupacao_media_studio), 0) / bairros.length;
  const avgYield = bairros.reduce((s, b) => s + Number(b.yield_bruto_airbnb), 0) / bairros.length;
  const avgDelta = bairros.reduce((s, b) => s + Number(b.delta_yield), 0) / bairros.length;

  const BENEFITS = [
    { icon: BarChart3, text: "Entender quais bairros parecem mais atrativos para short stay" },
    { icon: Scale, text: "Comparar retorno e risco lado a lado, sem achismo" },
    { icon: Target, text: "Enxergar onde há melhor equilíbrio entre demanda, ocupação e rentabilidade" },
    { icon: TrendingUp, text: "Avaliar se o Airbnb supera o aluguel tradicional no bairro escolhido" },
  ];

  return (
    <div className="space-y-6">
      <MicroNote sectionKey="journey_context" />
      {/* Hero opening */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider">
                Guia de investimento
              </Badge>
              <Badge className="bg-muted text-muted-foreground text-[10px]">
                {bairros.length} bairros · 30+ variáveis
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-[var(--font-display)] text-foreground mb-3 leading-tight">
              Análise estratégica de bairros para<br className="hidden md:block" /> investimento em short stay
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4 max-w-2xl">
              Esta ferramenta ajuda você a comparar bairros de São Paulo para investimento em short stay. 
              Em vez de olhar só diária ou só retorno, ela combina <strong>demanda, rentabilidade, liquidez 
              e potencial futuro</strong> para apoiar sua decisão.
            </p>
            <p className="text-sm text-foreground/60 leading-relaxed max-w-2xl">
              Não é apenas uma tabela de dados — é uma <strong>leitura estratégica do mercado</strong>, 
              construída para transformar números complexos em uma jornada clara de decisão.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Como esta análise ajuda você */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(1)}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Como esta análise ajuda você
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={stagger(i, 0.1)}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{b.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* O que é short stay */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(2)}>
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">O que é short stay?</p>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Em vez de alugar um apartamento por 12 meses para um inquilino, você opera como um 
                  hotel boutique: diárias por noite, em plataformas como Airbnb. O retorno pode ser 
                  significativamente maior — mas o risco e a operação também são diferentes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* DRE — Demonstrativo de resultado */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(3)}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">De receita bruta a lucro real</CardTitle>
                <p className="text-xs text-muted-foreground">Exemplo: studio em Pinheiros · ADR R$350 · 75% ocupação</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
              Muitos investidores olham apenas a receita bruta. Na prática, há pelo menos <strong>6 deduções</strong> antes de chegar ao lucro real. Veja um exemplo realista:
            </p>
            {(() => {
              const adr = 350;
              const occ = 0.75;
              const nights = 365 * occ;
              const gross = adr * nights;
              const lines: { label: string; pct: number | null; isGross?: boolean; isNet?: boolean; note?: string }[] = [
                { label: "Receita bruta anual", pct: null, isGross: true },
                { label: "Taxa Airbnb (host)", pct: -3, note: "Comissão da plataforma" },
                { label: "Gestão / administração", pct: -20, note: "Operadora ou autogestão" },
                { label: "Impostos (ISS + Simples)", pct: -6, note: "Varia por regime fiscal" },
                { label: "Manutenção e reposição", pct: -5, note: "Limpeza, reparos, enxoval" },
                { label: "Condomínio + IPTU", pct: -8, note: "Custos fixos do imóvel" },
                { label: "Energia + internet", pct: -3, note: "Custos operacionais" },
                { label: "Lucro líquido estimado", pct: null, isNet: true },
              ];
              const totalDeduction = lines.reduce((s, l) => s + (l.pct ?? 0), 0);
              const netPct = 100 + totalDeduction;
              const running = gross;

              return (
                <div className="space-y-0">
                  {lines.map((line, i) => {
                    let value: number;
                    let displayPct: string;
                    
                    if (line.isGross) {
                      value = gross;
                      displayPct = "100%";
                    } else if (line.isNet) {
                      value = gross * (netPct / 100);
                      displayPct = `${netPct}%`;
                    } else {
                      value = gross * (Math.abs(line.pct!) / 100);
                      displayPct = `${line.pct}%`;
                    }

                    const isDeduction = !line.isGross && !line.isNet;
                    
                    return (
                      <div key={i}>
                        {line.isNet && (
                          <div className="border-t-2 border-dashed border-primary/30 my-2" />
                        )}
                        <div className={`flex items-center justify-between py-2 px-3 rounded-md text-sm ${
                          line.isGross ? "bg-primary/5 font-semibold text-foreground" :
                          line.isNet ? "bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400" :
                          "text-foreground/80"
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-mono text-xs w-12 text-right shrink-0 ${
                              isDeduction ? "text-red-500" : line.isNet ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                            }`}>
                              {displayPct}
                            </span>
                            <span className="truncate">{line.label}</span>
                            {line.note && (
                              <span className="text-[10px] text-muted-foreground hidden sm:inline">· {line.note}</span>
                            )}
                          </div>
                          <span className={`font-mono text-xs shrink-0 ${
                            isDeduction ? "text-red-500" : line.isNet ? "text-emerald-600 dark:text-emerald-400 text-sm" : ""
                          }`}>
                            {isDeduction ? "−" : ""} R$ {Math.round(value).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Visual bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Receita</span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-primary/20 rounded-full" style={{ width: "100%" }} />
                        <div className="absolute inset-y-0 left-0 bg-emerald-500/60 rounded-full transition-all" style={{ width: `${netPct}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                          {netPct}% fica com você
                        </span>
                      </div>
                      <span>Lucro</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.03]">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-foreground/70 leading-relaxed">
                      Este é um exemplo ilustrativo. Os percentuais reais variam conforme o regime tributário, 
                      modelo de gestão (própria vs terceirizada) e perfil do imóvel. Use como referência para 
                      entender a <strong>estrutura de custos</strong>, não como projeção.
                    </p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Market pulse */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(4)}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          📊 Pulso do mercado — São Paulo
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Diária média", value: fmtBRL(avgADR), sub: "por noite" },
            { label: "Ocupação média", value: fmtPct(avgOcc), sub: "dos dias" },
            { label: "Retorno médio", value: fmtPct(avgYield), sub: "ao ano (Airbnb)" },
            { label: "Prêmio short stay", value: `+${fmtPct(avgDelta)}`, sub: "vs aluguel comum" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(i, 0.15)}>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{kpi.label}</p>
                  <p className="text-xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key narrative */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(5)}>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">O que você precisa saber antes de começar</p>
                {DATA_COMMUNICATION.narratives.slice(0, 3).map((n, i) => (
                  <p key={i} className="text-xs text-foreground/70 leading-relaxed flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span> {n}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(6)} className="flex justify-end">
        <Button onClick={onNext} size="lg" className="gap-2">
          Entendi, vamos começar <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};
