import { fmt } from "@/data/guide-data";

/**
 * Faixa de diárias do bairro: 25% mais baratos — mediana — 25% mais caros
 * (quartis P25/P50/P75 da fonte), com a diária média marcada (losango) quando
 * cabe na escala. Números com fonte tabular. Sem `escala`, vai de um pouco
 * abaixo do P25 a um pouco acima do P75 (ou da média); com `escala` [ini, fim],
 * usa a escala comum (ex.: R$ 0 a R$ 450 na comparação entre bairros).
 *
 * Variantes de legenda: "padrao" (três colunas com título), "linha" (valores
 * em linha, mediana em destaque) e "frase" ("25% até R$ 171 · Mediana R$ 232 · 25% acima de R$ 301").
 */
export default function FaixaQuartis({
  quartis,
  media,
  escala,
  variante = "padrao",
  legendaMedia = true,
  className = "",
}: {
  quartis: [number, number, number];
  media?: number;
  escala?: [number, number];
  variante?: "padrao" | "linha" | "frase";
  /** Mostra a linha "◆ Diária média (ADR): R$ X" abaixo da faixa. */
  legendaMedia?: boolean;
  className?: string;
}) {
  const [p25, p50, p75] = quartis;
  const valores = [p25, p50, p75, ...(media ? [media] : [])];
  const min = Math.min(...valores), max = Math.max(...valores);
  const folga = Math.max((max - min) * 0.12, 1);
  const [ini, fim] = escala ?? [min - folga, max + folga];
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - ini) / (fim - ini)) * 100)).toFixed(2)}%`;
  const mediaNaEscala = media !== undefined && media >= ini && media <= fim;
  const rotulo = `Diárias: 25% mais baratos até R$ ${fmt(p25)}, mediana R$ ${fmt(p50)}, 25% mais caros a partir de R$ ${fmt(p75)}${media ? `; diária média R$ ${fmt(media)}` : ""}.`;

  return (
    <figure className={`min-w-0 ${className}`} aria-label={rotulo}>
      <div className="relative h-7" aria-hidden="true">
        {/* trilho */}
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-secondary" />
        {/* faixa central (metade do mercado entre P25 e P75) */}
        <div className="absolute top-1/2 h-[11px] -translate-y-1/2 rounded-md bg-escala-2" style={{ left: pos(p25), right: `calc(100% - ${pos(p75)})` }} />
        {/* mediana */}
        <div className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-primary" style={{ left: pos(p50) }} />
        {/* média */}
        {mediaNaEscala ? <div className="absolute top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-card bg-foreground" style={{ left: pos(media) }} /> : null}
      </div>
      {variante === "padrao" && (
        <figcaption className="mt-1 grid grid-cols-3 gap-1 text-xs tabular-nums">
          <span className="text-left"><span className="block text-muted-foreground">25% mais baratos</span><span className="font-semibold text-foreground">R$ {fmt(p25)}</span></span>
          <span className="text-center"><span className="block text-muted-foreground">Mediana</span><span className="font-semibold text-foreground">R$ {fmt(p50)}</span></span>
          <span className="text-right"><span className="block text-muted-foreground">25% mais caros</span><span className="font-semibold text-foreground">R$ {fmt(p75)}</span></span>
        </figcaption>
      )}
      {variante === "linha" && (
        <figcaption className="flex justify-between gap-2 text-xs tabular-nums text-foreground-medium">
          <span>R$ {fmt(p25)}</span><strong className="font-semibold text-foreground">R$ {fmt(p50)}</strong><span>R$ {fmt(p75)}</span>
        </figcaption>
      )}
      {variante === "frase" && (
        <figcaption className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs tabular-nums">
          <span>25% até R$ {fmt(p25)}</span><strong className="font-semibold">Mediana R$ {fmt(p50)}</strong><span>25% acima de R$ {fmt(p75)}</span>
        </figcaption>
      )}
      {media && mediaNaEscala && legendaMedia ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <span className="inline-block h-2 w-2 rotate-45 bg-foreground" aria-hidden="true" />Diária média (ADR): R$ {fmt(media)}
        </p>
      ) : null}
    </figure>
  );
}
