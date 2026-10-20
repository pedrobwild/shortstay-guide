import { formatBRL } from "@/lib/numberFormat";
import { dominioRegua, fracaoNoDominio, marcasEixo } from "@/lib/estudoFerramentas";

/**
 * Régua dos quartis de diária de um bairro (P25–P75 em faixa, mediana e média em
 * traço) com a diária da pessoa marcada (losango de tinta). Aproximação desenha a
 * faixa tracejada, sem preenchimento sólido. SVG próprio, cores só por tokens;
 * o texto equivalente vem no `aria-label`.
 */
export default function ReguaQuartis({
  quartis,
  media,
  minha,
  aproximacao = false,
  nomeBairro,
}: {
  quartis: [number, number, number];
  media: number;
  minha: number | null;
  aproximacao?: boolean;
  nomeBairro: string;
}) {
  const dominio = dominioRegua([...quartis, media, ...(minha != null ? [minha] : [])]);
  const marcas = marcasEixo(dominio, 5);
  const x = (v: number) => `${fracaoNoDominio(v, dominio) * 100}%`;
  const [p25, p50, p75] = quartis;
  const yFaixa = 34, hFaixa = 18, yEixo = 76;
  const ancora = (v: number) => {
    const f = fracaoNoDominio(v, dominio);
    return f < 0.08 ? "start" : f > 0.92 ? "end" : "middle";
  };
  const descricao = `Diárias de ${nomeBairro}: 25% mais baratos até ${formatBRL(p25)}, mediana ${formatBRL(p50)}, 25% mais caros a partir de ${formatBRL(p75)}, média ${formatBRL(media)}${minha != null ? `. Sua diária: ${formatBRL(minha)}` : ""}.`;

  return (
    <svg width="100%" height={yEixo + 24} role="img" aria-label={descricao} className="block overflow-visible">
      {/* faixa P25–P75 */}
      <rect
        x={x(p25)}
        y={yFaixa}
        width={`${(fracaoNoDominio(p75, dominio) - fracaoNoDominio(p25, dominio)) * 100}%`}
        height={hFaixa}
        fill={aproximacao ? "none" : "hsl(var(--ciano-200))"}
        stroke={aproximacao ? "hsl(var(--neutro-600))" : "hsl(var(--foreground) / 0.55)"}
        strokeDasharray={aproximacao ? "4 3" : undefined}
        strokeWidth={1}
      />
      {/* mediana */}
      <line x1={x(p50)} x2={x(p50)} y1={yFaixa - 4} y2={yFaixa + hFaixa + 4} stroke="hsl(var(--ciano-700))" strokeWidth={3} />
      <text x={x(p50)} y={yFaixa - 9} textAnchor={ancora(p50)} fontSize={12} fill="hsl(var(--tinta-70))">mediana</text>
      {/* média */}
      <line x1={x(media)} x2={x(media)} y1={yFaixa} y2={yFaixa + hFaixa} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="2 2" />
      {/* sua diária */}
      {minha != null && (
        <g>
          <line x1={x(minha)} x2={x(minha)} y1={8} y2={yEixo} stroke="hsl(var(--foreground))" strokeWidth={1.5} />
          <text x={x(minha)} y={10} dy={-2} textAnchor={ancora(minha)} fontSize={12} fontWeight={600} fill="hsl(var(--foreground))">
            sua diária {formatBRL(minha)}
          </text>
        </g>
      )}
      <line x1="0" x2="100%" y1={yEixo} y2={yEixo} stroke="hsl(var(--foreground))" strokeWidth={1} />
      {marcas.map((m) => (
        <g key={m}>
          <line x1={x(m)} x2={x(m)} y1={yEixo} y2={yEixo + 4} stroke="hsl(var(--foreground))" strokeWidth={1} />
          <text x={x(m)} y={yEixo + 17} textAnchor={ancora(m)} fontSize={12} fill="hsl(var(--tinta-70))" style={{ fontVariantNumeric: "tabular-nums" }}>{formatBRL(m)}</text>
        </g>
      ))}
    </svg>
  );
}
