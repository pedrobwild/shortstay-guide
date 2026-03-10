import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical, Database, MapPin, BarChart3, ShieldCheck, ChevronDown, ChevronUp,
  Layers, Calculator, Eye, Scale, TrendingUp, Activity, Rocket,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BairroAirbnb } from "@/types/intelligence";

const VARIABLE_GROUPS = [
  {
    label: "Retorno",
    icon: TrendingUp,
    color: "bg-emerald-100 text-emerald-800",
    variables: [
      "Yield bruto Airbnb",
      "Yield bruto long-term",
      "Delta yield (prêmio short stay)",
      "ADR médio (diária)",
      "Receita anual estimada",
      "Score de rentabilidade",
    ],
  },
  {
    label: "Demanda & Liquidez",
    icon: Activity,
    color: "bg-blue-100 text-blue-800",
    variables: [
      "Ocupação média",
      "Estadia média (noites)",
      "Nº de listings (total e studios)",
      "Nº de reviews por listing",
      "Grau de saturação",
      "Score de liquidez",
    ],
  },
  {
    label: "Mercado Imobiliário",
    icon: MapPin,
    color: "bg-amber-100 text-amber-800",
    variables: [
      "Preço m² residencial",
      "Área média dos estúdios",
      "Dias médios para venda",
      "Nº de transações imobiliárias/ano",
      "Aluguel mensal long-term",
    ],
  },
  {
    label: "Operação & Risco",
    icon: ShieldCheck,
    color: "bg-red-100 text-red-800",
    variables: [
      "% superhost",
      "Rating médio",
      "Políticas de cancelamento (flex/mod/rígida)",
      "Risco regulatório",
      "Risco condomínio",
      "Índice de criminalidade",
    ],
  },
  {
    label: "Crescimento",
    icon: Rocket,
    color: "bg-purple-100 text-purple-800",
    variables: [
      "Score de crescimento potencial",
      "Reservas 30d+ (%)",
      "Nível de confiança dos dados",
    ],
  },
];

const SCORE_WEIGHTS = [
  { label: "Retorno (Yield)", weight: "35%", icon: TrendingUp },
  { label: "Demanda (Liquidez)", weight: "25%", icon: Activity },
  { label: "Operação (Ocupação)", weight: "20%", icon: Eye },
  { label: "Futuro (Crescimento)", weight: "20%", icon: Rocket },
];

interface Props {
  bairros: BairroAirbnb[];
}

const MethodologySection: React.FC<Props> = ({ bairros }) => {
  const [expanded, setExpanded] = useState(false);

  const bairroNames = bairros.map((b) => b.bairro).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const periodo = bairros[0];
  const fontes = [...new Set(bairros.map((b) => b.fonte_primaria).filter(Boolean))];

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Metodologia e abrangência</CardTitle>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
          >
            {expanded ? "Menos detalhes" : "Ver detalhes"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Entenda exatamente o que foi analisado, com quais dados e qual a lógica por trás de cada score.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Always visible: summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cobertura</p>
              <p className="text-sm font-bold">{bairros.length} bairros</p>
              <p className="text-xs text-muted-foreground">São Paulo capital</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
            <Database className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variáveis</p>
              <p className="text-sm font-bold">30+ indicadores</p>
              <p className="text-xs text-muted-foreground">por bairro analisado</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
            <Calculator className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</p>
              <p className="text-sm font-bold">4 dimensões</p>
              <p className="text-xs text-muted-foreground">ponderadas com ajuste de risco</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 overflow-hidden"
            >
              {/* Bairros list */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Bairros analisados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {bairroNames.map((name) => (
                    <Badge key={name} variant="secondary" className="text-xs font-normal">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Variables grouped */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Variáveis coletadas e calculadas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {VARIABLE_GROUPS.map((group) => (
                    <div key={group.label} className="rounded-lg border border-border/60 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <group.icon className="h-4 w-4 text-muted-foreground" />
                        <Badge className={`${group.color} text-[10px]`}>{group.label}</Badge>
                      </div>
                      <ul className="space-y-1">
                        {group.variables.map((v) => (
                          <li key={v} className="text-xs text-foreground/70 flex items-start gap-1.5">
                            <span className="text-muted-foreground mt-1.5 shrink-0">•</span>
                            {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment Score formula */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" /> Composição do Investment Score
                </p>
                <div className="rounded-lg border border-border/60 p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SCORE_WEIGHTS.map((w) => (
                      <div key={w.label} className="text-center p-2 rounded-md bg-muted/30">
                        <w.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold text-primary">{w.weight}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{w.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-foreground/70 space-y-1.5 border-t border-border/40 pt-3">
                    <p>
                      <span className="font-semibold">Normalização:</span> cada indicador é convertido para uma escala 0–100 usando min-max entre os bairros da amostra.
                    </p>
                    <p>
                      <span className="font-semibold">Ajuste de risco:</span> bairros com baixa liquidez (&lt;55) ou confiança de dados limitada recebem penalização proporcional no score final.
                    </p>
                    <p>
                      <span className="font-semibold">Grades:</span> A+ (≥62) · A (≥55) · B (≥48) · C (≥40) · D (&lt;40) — calibradas pela distribuição real dos dados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data sources & confidence */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 rounded-lg border border-border/60 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" /> Fontes de dados
                  </p>
                  <p className="text-xs text-foreground/70">
                    Dados agregados a partir de plataformas de short stay (Airbnb via AirDNA/Airbtics), mercado imobiliário (FipeZap, registros públicos) e pesquisas proprietárias da Bwild.
                  </p>
                  {periodo && (
                    <p className="text-[10px] text-muted-foreground">
                      Período: {periodo.periodo_inicio} a {periodo.periodo_fim}
                    </p>
                  )}
                </div>
                <div className="flex-1 rounded-lg border border-border/60 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Confiança & limitações
                  </p>
                  <p className="text-xs text-foreground/70">
                    Cada bairro possui um nível de confiança (alto/médio/baixo) baseado no volume de dados disponíveis. Bairros com dados limitados são sinalizados e penalizados no score.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Esta análise não substitui consultoria profissional de investimento.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default MethodologySection;
