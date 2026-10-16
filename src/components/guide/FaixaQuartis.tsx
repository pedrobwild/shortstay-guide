import { fmt } from "@/data/guide-data";

/**
 * Faixa de diárias do bairro: 25% mais baratos — mediana — 25% mais caros
 * (quartis P25/P50/P75 da fonte), com a diária média marcada quando cabe na
 * escala. Números com fonte tabular; a escala vai de um pouco abaixo do P25 a
 * um pouco acima do P75 (ou da média, se ela ficar fora), para caber em 320 px.
 */
export default function FaixaQuartis({
  quartis,
  media,
  className = "",
}: {
  quartis: [number, number, number];
  media?: number;
  className?: string;
}) {
  const [p25, p50, p75] = quartis;
  const valores = [p25, p50, p75, ...(media ? [media] : [])];
  const min = Math.min(...valores), max = Math.max(...valores);
  const folga = Math.max((max - min) * 0.12, 1);
  const ini = min - folga, fim = max + folga;
  const pos = (v: number) => `${(((v - ini) / (fim - ini)) * 100).toFixed(2)}%`;
  const rotulo = `Diárias: 25% mais baratos até R$ ${fmt(p25)}, mediana R$ ${fmt(p50)}, 25% mais caros a partir de R$ ${fmt(p75)}${media ? `; diária média R$ ${fmt(media)}` : ""}.`;

  return (
    <figure className={`min-w-0 ${className}`} aria-label={rotulo}>
      <div className="relative h-8" aria-hidden="true">
        {/* trilho */}
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
        {/* faixa central (metade do mercado entre P25 e P75) */}
        <div className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-primary/25" style={{ left: pos(p25), right: `calc(100% - ${pos(p75)})` }} />
        {/* mediana */}
        <div className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-primary" style={{ left: pos(p50) }} />
        {/* média */}
        {media ? <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-background bg-foreground" style={{ left: pos(media) }} /> : null}
      </div>
      <figcaption className="mt-1 grid grid-cols-3 gap-1 text-xs tabular-nums">
        <span className="text-left"><span className="block text-muted-foreground">25% mais baratos</span><span className="font-semibold text-foreground">R$ {fmt(p25)}</span></span>
        <span className="text-center"><span className="block text-muted-foreground">Mediana</span><span className="font-semibold text-foreground">R$ {fmt(p50)}</span></span>
        <span className="text-right"><span className="block text-muted-foreground">25% mais caros</span><span className="font-semibold text-foreground">R$ {fmt(p75)}</span></span>
      </figcaption>
      {media ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <span className="inline-block h-2 w-2 rotate-45 bg-foreground" aria-hidden="true" />Diária média (ADR): R$ {fmt(media)}
        </p>
      ) : null}
    </figure>
  );
}
