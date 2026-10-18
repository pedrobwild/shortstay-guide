import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FonteBairro from "@/components/guide/FonteBairro";
import { useRadarBase } from "@/lib/radarBase";
import { avisoAmostraBairro, marcaNatureza, normalizarTexto, ordenarPorReceita } from "@/lib/radarUi";
import { formatBRL, formatPercent } from "@/lib/numberFormat";
import { bairroPath } from "@/lib/seo";

/**
 * Bairros que estão na base do Radar mas não na estimativa de mercado — base 2025
 * (sem scores). Entram no /ranking só com os números da base, em ordem de receita
 * de referência, para o ranking cobrir toda a base sem inventar score.
 */
export default function OutrosBairrosRadar({ jaListados }: { jaListados: string[] }) {
  const radar = useRadarBase();
  const listados = new Set(jaListados.map(normalizarTexto));
  const outros = ordenarPorReceita((radar.data?.bairros ?? []).filter((b) => !listados.has(normalizarTexto(b.name))));
  if (!outros.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Outros bairros da base do Radar</CardTitle>
        <p className="text-sm text-muted-foreground">Bairros com diária e ocupação na base, ainda sem a estimativa de mercado — base 2025 (sem score). Em ordem de receita mensal de referência (diária média × 30 × ocupação, antes de custos).</p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {outros.map(({ bairro: b, receita }) => {
            const aviso = avisoAmostraBairro(b);
            const marca = marcaNatureza(b) ?? (aviso ? "amostra pequena" : null);
            return (
              <li key={b.name}>
                <Link to={bairroPath(b.name)} className="flex min-h-[56px] items-center gap-3 px-4 py-2 transition-colors hover:bg-accent-light">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{b.name}{marca && <span className="ml-2 text-[11px] font-normal text-muted-foreground">({marca})</span>}</span>
                    <span className="block text-xs text-muted-foreground">Diária {formatBRL(b.dailyAvg)} · ocupação {formatPercent(b.avgOccupancy, 0)}</span>
                    <FonteBairro nome={b.name} />
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">{formatBRL(receita)}<span className="block text-[11px] font-normal text-muted-foreground">por mês</span></span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
