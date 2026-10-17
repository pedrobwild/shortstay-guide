import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ArrowUpDown, Check, ArrowRight } from "lucide-react";
import { DEMAND_PROFILE_LABELS } from "@/data/mapaBairrosData";
import NaturezaTag from "@/components/radar/NaturezaTag";
import { COR_SERIE } from "@/lib/radarUi";
import { caminhoComparar } from "@/lib/comparar";
import { slugifyBairro } from "@/lib/seo";
import type { LeituraBairro } from "@/lib/leiturasBairros";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ComparisonProps {
  onClose: () => void;
  /** Bairros que podem entrar na comparação (só os da base do Radar têm números). */
  disponiveis: LeituraBairro[];
  initialNeighborhoods?: LeituraBairro[];
}

type Metrica = { key: string; label: string; getValue: (n: LeituraBairro) => number | string | null; format: (v: number | string) => string; numerica: boolean };

// Diária, faixa, ocupação, receita e anúncios: base do Radar. Perfil e concorrência: critérios internos.
const METRICS: Metrica[] = [
  { key: "nightly", label: "Diária média", getValue: (n) => n.metrics.nightlyRate, format: (v) => formatBRL(Number(v)), numerica: true },
  { key: "nightlyRange", label: "Faixa de diária", getValue: (n) => `${formatBRL(n.metrics.nightlyRateRange[0])}–${formatBRL(n.metrics.nightlyRateRange[1])}`, format: (v) => `${v}`, numerica: false },
  { key: "occupancy", label: "Ocupação", getValue: (n) => n.metrics.occupancy, format: (v) => formatPercent(Number(v), 0), numerica: true },
  { key: "revenue", label: "Receita mensal de referência", getValue: (n) => n.metrics.avgRevenueMo, format: (v) => formatBRL(Number(v)), numerica: true },
  { key: "listings", label: "Anúncios na amostra", getValue: (n) => n.metrics.activeListings, format: (v) => formatDecimal(Number(v), 0), numerica: true },
  { key: "profile", label: "Perfil de demanda (critério interno)", getValue: (n) => DEMAND_PROFILE_LABELS[n.demandProfile]?.label || n.demandProfile, format: (v) => `${v}`, numerica: false },
  { key: "competition", label: "Concorrência (critério interno)", getValue: (n) => n.metrics.competitionLevel, format: (v) => `${v}`, numerica: false },
];

const chartConfig = {
  revenue: { label: "Receita mensal de referência", color: "hsl(var(--primary))" },
};

/** Comparação rápida das leituras do mapa; a comparação completa fica em /comparar. */
export default function NeighborhoodComparison({ onClose, disponiveis, initialNeighborhoods = [] }: ComparisonProps) {
  const naBase = disponiveis.filter((n) => n.naBase);
  const [selected, setSelected] = useState<LeituraBairro[]>(initialNeighborhoods.filter((n) => n.naBase).slice(0, 3));
  const [showPicker, setShowPicker] = useState(false);

  // Mantém a seleção com os números atuais da base (eles podem chegar depois da reserva offline).
  const atuais = selected.map((s) => naBase.find((n) => n.id === s.id) ?? s);
  const available = naBase.filter((n) => !atuais.some((s) => s.id === n.id));

  const addNeighborhood = (n: LeituraBairro) => {
    if (atuais.length < 3) {
      setSelected([...atuais, n]);
      setShowPicker(false);
    }
  };

  const removeNeighborhood = (id: string) => {
    setSelected(atuais.filter((n) => n.id !== id));
  };

  const chartData = atuais.map((n) => ({
    name: n.name.length > 12 ? n.name.slice(0, 12) + "…" : n.name,
    revenue: n.metrics.avgRevenueMo,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-md border border-border bg-card p-5 md:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Comparar bairros</h3>
          <p className="text-xs text-muted-foreground font-body">Até 3 bairros da base do Radar, com o perfil de demanda de cada um.</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Fechar comparação" className="min-h-[44px] min-w-[44px]"><X size={16} /></Button>
      </div>

      {/* Bairros escolhidos */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {atuais.map((n, i) => (
          <span key={n.id} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-input bg-card pl-3.5 text-sm text-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: COR_SERIE[i] }} aria-hidden="true" />
            {n.name}
            <button type="button" onClick={() => removeNeighborhood(n.id)} aria-label={`Remover ${n.name}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary">
              <X size={14} />
            </button>
          </span>
        ))}
        {atuais.length < 3 && available.length > 0 && (
          <div className="relative">
            <Button
              variant="outline"
              className="min-h-[44px] gap-1 rounded-full border-dashed text-sm"
              onClick={() => setShowPicker(!showPicker)}
              aria-expanded={showPicker}
            >
              <Plus size={14} />
              Adicionar
            </Button>
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 top-full z-50 mt-1 max-h-[264px] min-w-[220px] overflow-y-auto rounded-lg border border-border bg-card shadow-dialog"
                >
                  {available.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => addNeighborhood(n)}
                      className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 text-left text-sm transition-colors hover:bg-secondary"
                    >
                      <span>{n.name}{n.natureza === "estimativa" ? " (estimativa)" : ""}{n.aviso ? " · amostra pequena" : ""}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {atuais.length > 0 && (
          <Link
            to={caminhoComparar(atuais.map((n) => slugifyBairro(n.name)))}
            className="inline-flex min-h-[44px] items-center gap-1 px-2 text-sm font-semibold text-primary underline underline-offset-[3px]"
          >
            Abrir a comparação completa<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {atuais.length < 2 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ArrowUpDown size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-body">Selecione pelo menos 2 bairros para comparar</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">✓ = maior valor na linha. Bairros fora da base do Radar não entram: não há diária nem ocupação com fonte para eles.</p>
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Indicador</th>
                  {atuais.map((n, i) => (
                    <th key={n.id} className="px-3 py-2 text-center align-top font-bold text-foreground">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: COR_SERIE[i] }} aria-hidden="true" />
                      {n.name}
                      {n.natureza === "estimativa" && <span className="mt-1 block"><NaturezaTag tipo="estimativa" tamanho="sm" /></span>}
                      {n.aviso && <span className="mt-1 block text-[11px] font-medium text-estimate-text">{n.aviso}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => {
                  const values = atuais.map((n) => metric.getValue(n));
                  const numeros = values.filter((v): v is number => typeof v === "number");
                  const maior = metric.numerica && numeros.length >= 2 ? Math.max(...numeros) : null;
                  return (
                    <tr key={metric.key} className="border-b border-border">
                      <td className="py-2.5 pr-4 font-medium text-muted-foreground">{metric.label}</td>
                      {atuais.map((n, i) => {
                        const v = values[i];
                        const destaque = maior !== null && v === maior;
                        return (
                          <td key={n.id} className={`px-3 py-2.5 text-center tabular-nums ${destaque ? "font-bold text-primary" : "text-foreground"}`}>
                            {v === null ? "—" : metric.format(v)}
                            {destaque && <Check size={10} className="ml-1 inline text-primary" aria-label="maior" />}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold text-muted-foreground">Receita mensal de referência (diária × 30 × ocupação)</h4>
            <ChartContainer config={chartConfig} className="h-[160px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `R$ ${formatDecimal(Number(v) / 1000, 0)} mil`} className="text-[10px]" />
                <YAxis dataKey="name" type="category" width={90} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COR_SERIE[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </>
      )}
    </motion.div>
  );
}
