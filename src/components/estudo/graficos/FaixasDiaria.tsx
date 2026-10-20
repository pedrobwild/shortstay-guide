import type { BairroCurado } from "@/data/bairrosCurados";
import { useLargura } from "@/components/estudo/graficos/useLargura";
import { EIXO_DIARIA, marcasEixo, posicaoEixo } from "@/lib/estudoMapa";
import { temAmostraPequena } from "@/lib/estudo";
import { formatBRL } from "@/lib/numberFormat";
import { naturezaBairro } from "@/lib/radarUi";

const TINTA = "hsl(var(--foreground))";
const TINTA_70 = "hsl(var(--tinta-70))";
const GRADE = "hsl(var(--foreground) / 0.08)";
const CIANO = "hsl(var(--ciano))";
const CIANO_100 = "hsl(var(--ciano-100))";
const NEUTRO = "hsl(var(--neutro-600))";

/**
 * Fig. 1 do /comparar: faixas de diária no mesmo eixo (R$ 0 a 600, marcas a cada
 * R$ 100). Para cada bairro, a barra vai do P25 ao P75, o traço vertical marca a
 * mediana e o ponto, a média. Aproximação (Itaim Bibi) sai tracejada e sem
 * preenchimento sólido. Valores além de R$ 600 ficam presos na ponta com seta.
 * SVG próprio, decorativo: a Tab. 1 traz os mesmos números.
 */
export default function FaixasDiaria({ bairros }: { bairros: BairroCurado[] }) {
  const { ref, largura } = useLargura<HTMLDivElement>(720);
  const compacto = largura < 560;
  const rotuloW = compacto ? 0 : 168;
  const margemDir = 18;
  const linhaH = compacto ? 64 : 48;
  const topo = 8;
  const eixoH = 40;
  const plotW = Math.max(120, largura - rotuloW - margemDir - 8);
  const x0 = rotuloW + 8;
  const xDe = (v: number) => x0 + (posicaoEixo(v).pct / 100) * plotW;
  const altura = topo + bairros.length * linhaH + eixoH;
  const marcas = marcasEixo();

  return (
    <div ref={ref} className="w-full">
      <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} aria-hidden="true" className="block">
        {marcas.map((m) => (
          <line key={m} x1={xDe(m)} x2={xDe(m)} y1={topo} y2={altura - eixoH} stroke={GRADE} />
        ))}
        {bairros.map((b, i) => {
          const y = topo + i * linhaH;
          const cy = y + (compacto ? 40 : linhaH / 2);
          const aprox = naturezaBairro(b) !== "observado";
          const q = b.dailyQuartiles;
          const media = posicaoEixo(b.dailyAvg);
          const nome = `${b.name}${aprox ? " (aproximação)" : ""}`;
          return (
            <g key={b.name}>
              <text
                x={compacto ? x0 : rotuloW}
                y={compacto ? y + 18 : cy + 4.5}
                textAnchor={compacto ? "start" : "end"}
                fontSize={14}
                fontWeight={600}
                fill={TINTA}
              >
                {nome}
                {temAmostraPequena(b) && <tspan fontStyle="italic" fontWeight={400} fill="hsl(var(--magenta-700))">{compacto ? " · amostra pequena" : ""}</tspan>}
              </text>
              {!compacto && temAmostraPequena(b) && (
                <text x={rotuloW} y={cy + 19} textAnchor="end" fontSize={11.5} fontStyle="italic" fill="hsl(var(--magenta-700))">amostra pequena</text>
              )}
              {q ? (
                <>
                  <rect
                    x={xDe(q[0])}
                    y={cy - 7}
                    width={Math.max(1, xDe(q[2]) - xDe(q[0]))}
                    height={14}
                    fill={aprox ? "none" : CIANO_100}
                    stroke={aprox ? NEUTRO : CIANO}
                    strokeWidth={1.25}
                    strokeDasharray={aprox ? "4 3" : undefined}
                  />
                  <line x1={xDe(q[1])} x2={xDe(q[1])} y1={cy - 11} y2={cy + 11} stroke={TINTA} strokeWidth={2} strokeDasharray={aprox ? "3 2" : undefined} />
                  {posicaoEixo(q[2]).fora && <path d={`M${xDe(q[2]) + 2} ${cy - 5} l6 5 l-6 5 z`} fill={TINTA} />}
                </>
              ) : (
                <text x={x0} y={cy + 4} fontSize={12} fill={TINTA_70}>sem quartis publicados</text>
              )}
              <circle
                cx={xDe(b.dailyAvg)}
                cy={cy}
                r={4.5}
                fill={aprox ? "hsl(var(--background))" : TINTA}
                stroke={TINTA}
                strokeWidth={1.5}
                strokeDasharray={aprox ? "2 1.5" : undefined}
              />
              {media.fora && <path d={`M${xDe(b.dailyAvg) + 6} ${cy - 5} l6 5 l-6 5 z`} fill={TINTA} />}
            </g>
          );
        })}
        {/* Eixo com marcas a cada R$ 100 e unidade */}
        <line x1={x0} x2={x0 + plotW} y1={altura - eixoH} y2={altura - eixoH} stroke={TINTA} />
        {marcas.map((m) => (
          <g key={`m${m}`}>
            <line x1={xDe(m)} x2={xDe(m)} y1={altura - eixoH} y2={altura - eixoH + 5} stroke={TINTA} />
            {/* No celular, rótulo a cada R$ 200 (as marcas seguem a cada R$ 100). */}
            {(!compacto || m % 200 === 0) && <text
              x={xDe(m)}
              y={altura - eixoH + 19}
              fontSize={11.5}
              fill={TINTA_70}
              textAnchor={m === EIXO_DIARIA.min ? "start" : m === EIXO_DIARIA.max ? "end" : "middle"}
              className="tabular-nums"
            >
              {formatBRL(m)}
            </text>}
          </g>
        ))}
        <text x={x0 + plotW} y={altura - 4} fontSize={11.5} fill={TINTA_70} textAnchor="end">Diária (R$ por noite)</text>
      </svg>
    </div>
  );
}

/** Legenda da Fig. 1: P25–P75, mediana, média e aproximação, desenhadas como no gráfico. */
export function LegendaFaixas({ comAproximacao }: { comAproximacao: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      <li className="flex items-center gap-2">
        <svg width="34" height="14" aria-hidden="true"><rect x="1" y="1" width="32" height="12" fill={CIANO_100} stroke={CIANO} strokeWidth="1.25" /></svg>
        P25–P75 (metade central das diárias)
      </li>
      <li className="flex items-center gap-2">
        <svg width="10" height="20" aria-hidden="true"><line x1="5" x2="5" y1="1" y2="19" stroke={TINTA} strokeWidth="2" /></svg>
        Mediana
      </li>
      <li className="flex items-center gap-2">
        <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill={TINTA} /></svg>
        Média
      </li>
      {comAproximacao && (
        <li className="flex items-center gap-2">
          <svg width="34" height="14" aria-hidden="true"><rect x="1" y="1" width="32" height="12" fill="none" stroke={NEUTRO} strokeWidth="1.25" strokeDasharray="4 3" /></svg>
          Aproximação pelo Itaim Bibi
        </li>
      )}
    </ul>
  );
}
