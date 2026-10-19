import type { ReactNode } from "react";
import { marcasEixo } from "@/lib/estudoFerramentas";
import { formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

/**
 * Barra empilhada horizontal em SVG próprio (Estudo aberto): cada trecho é uma parte
 * do total, com eixo em reais embaixo e a legenda numerada abaixo (rótulo, base e
 * valor), que também é o equivalente em texto da figura. Cores só por tokens:
 * `tom` é o nome da variável CSS ("--neutro-600", "--ciano", "--magenta").
 * Posições em porcentagem: a figura acompanha a largura sem distorcer o texto.
 */
export interface SegmentoBarra {
  chave: string;
  rotulo: ReactNode;
  valor: number;
  tom: string;
  /** Como o valor foi obtido (ex.: "15% da receita bruta"). */
  nota?: ReactNode;
  /** Linha de destaque na legenda (ex.: resultado líquido). */
  destaque?: boolean;
  /** Valor exibido com sinal de menos na legenda (deduções). */
  deducao?: boolean;
}

const TONS_CLAROS = new Set(["--neutro-200", "--neutro-300", "--neutro-400", "--ciano-100", "--ciano-200"]);

export default function BarraEmpilhada({
  segmentos,
  total,
  formatar,
  rotuloAcessivel,
  rotuloPct = "do total",
  alturaBarra = 40,
  marcaReferencia,
  className,
  legenda = true,
}: {
  segmentos: SegmentoBarra[];
  /** Base dos percentuais da legenda (ex.: receita bruta). */
  total: number;
  formatar: (v: number) => string;
  rotuloAcessivel: string;
  rotuloPct?: string;
  alturaBarra?: number;
  /** Linha vertical de referência (ex.: fim da receita bruta quando há déficit); o trecho além dela ganha contorno magenta. */
  marcaReferencia?: { valor: number; rotulo: string };
  className?: string;
  legenda?: boolean;
}) {
  const soma = segmentos.reduce((s, x) => s + Math.max(0, x.valor), 0);
  const escala = Math.max(1, soma, total, marcaReferencia?.valor ?? 0);
  const marcas = marcasEixo([0, escala], 4).filter((m) => m <= escala * 1.0001);
  let acumulado = 0;
  const pos = segmentos.map((s) => {
    const ini = acumulado / escala;
    acumulado += Math.max(0, s.valor);
    return { ...s, ini, fim: acumulado / escala };
  });
  const y0 = marcaReferencia ? 20 : 4;
  const yEixo = y0 + alturaBarra + 6;
  const ancora = (f: number) => (f < 0.06 ? "start" : f > 0.94 ? "end" : "middle");

  return (
    <div className={cn("min-w-0", className)}>
      <svg width="100%" height={yEixo + 22} role="img" aria-label={rotuloAcessivel} className="block overflow-visible">
        {pos.map((s) => (
          <rect
            key={s.chave}
            x={`${s.ini * 100}%`}
            y={y0}
            width={`${Math.max(0, (s.fim - s.ini) * 100)}%`}
            height={alturaBarra}
            fill={`hsl(var(${s.tom}))`}
            stroke="hsl(var(--background))"
            strokeWidth={1.5}
          />
        ))}
        {/* Contorno de tinta a 55%: os trechos claros não somem no papel */}
        <rect x="0" y={y0} width={`${(acumulado / escala) * 100}%`} height={alturaBarra} fill="none" stroke="hsl(var(--foreground) / 0.55)" strokeWidth={1} />
        {marcaReferencia && (
          <g>
            {acumulado > marcaReferencia.valor && (
              <rect
                x={`${(marcaReferencia.valor / escala) * 100}%`}
                y={y0 - 2}
                width={`${((acumulado - marcaReferencia.valor) / escala) * 100}%`}
                height={alturaBarra + 4}
                fill="none"
                stroke="hsl(var(--magenta))"
                strokeWidth={2.5}
              />
            )}
            <line x1={`${(marcaReferencia.valor / escala) * 100}%`} x2={`${(marcaReferencia.valor / escala) * 100}%`} y1={4} y2={yEixo} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={`${(marcaReferencia.valor / escala) * 100}%`} y={12} textAnchor={ancora(marcaReferencia.valor / escala)} fontSize={12} fill="hsl(var(--foreground))">{marcaReferencia.rotulo}</text>
          </g>
        )}
        <line x1="0" x2="100%" y1={yEixo} y2={yEixo} stroke="hsl(var(--foreground))" strokeWidth={1} />
        {marcas.map((m) => {
          const f = m / escala;
          return (
            <g key={m}>
              <line x1={`${f * 100}%`} x2={`${f * 100}%`} y1={yEixo} y2={yEixo + 4} stroke="hsl(var(--foreground))" strokeWidth={1} />
              <text x={`${f * 100}%`} y={yEixo + 17} textAnchor={ancora(f)} fontSize={12} fill="hsl(var(--tinta-70))" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatar(m)}
              </text>
            </g>
          );
        })}
      </svg>
      {legenda && (
        <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {segmentos.map((s) => (
            <li key={s.chave} className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)] gap-x-2.5">
              <span
                aria-hidden="true"
                className={cn("mt-1 block h-3.5 w-3.5", TONS_CLAROS.has(s.tom) && "outline outline-1 outline-foreground/55")}
                style={{ background: `hsl(var(${s.tom}))` }}
              />
              <span className="min-w-0">
                <span className={cn("block text-[15px] leading-[22px]", s.destaque && "font-semibold")}>
                  {s.rotulo}
                  <span className="whitespace-nowrap tabular-nums"> · {s.deducao ? "−" : ""}{formatar(s.valor)}</span>
                </span>
                <span className="e-legenda block">
                  {s.nota}
                  {s.nota && total > 0 ? " · " : ""}
                  {total > 0 && <span className="tabular-nums">{formatDecimal((s.valor / total) * 100, 0)}% {rotuloPct}</span>}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
