import { useId } from "react";
import { marcasEixo } from "@/lib/estudoFerramentas";

/**
 * Gráfico de séries em SVG próprio (Estudo aberto): linhas ou áreas empilhadas sobre
 * um eixo x numérico (ex.: mês do contrato) e um eixo y em reais. Eixos em tinta cheia,
 * grade em linha fina (8% de tinta), cores só por tokens. A figura é desenhada num
 * viewBox fixo e escala com a largura; o texto dos eixos fica em HTML por cima, para
 * não distorcer. O equivalente em texto vai no `rotuloAcessivel` (e numa tabela da tela).
 */
export interface Serie {
  nome: string;
  /** Variável CSS do tom (ex.: "--ciano", "--neutro-500"). */
  tom: string;
  valores: number[];
  tracejada?: boolean;
}

const L = 1000, A = 300;

export default function GraficoSerie({
  x,
  series,
  empilhar = false,
  formatarY,
  formatarX = (v) => String(v),
  rotuloAcessivel,
  altura = 220,
}: {
  x: number[];
  series: Serie[];
  /** Áreas empilhadas (a primeira série embaixo). */
  empilhar?: boolean;
  formatarY: (v: number) => string;
  formatarX?: (v: number) => string;
  rotuloAcessivel: string;
  altura?: number;
}) {
  const id = useId();
  if (!x.length || !series.length) return null;
  const topos = empilhar
    ? x.map((_, i) => series.reduce((s, se) => s + Math.max(0, se.valores[i] ?? 0), 0))
    : series.flatMap((s) => s.valores);
  const maxY = Math.max(1, ...topos);
  const marcasY = marcasEixo([0, maxY], 4);
  const topoY = Math.max(maxY, marcasY[marcasY.length - 1] ?? maxY);
  const [x0, x1] = [x[0], x[x.length - 1]];
  const px = (v: number) => (x1 === x0 ? 0 : ((v - x0) / (x1 - x0)) * L);
  const py = (v: number) => A - (v / topoY) * A;
  const marcasX = marcasEixo([x0, x1], 5).filter((m) => m >= x0 && m <= x1);

  const base = x.map(() => 0);
  const desenhos = series.map((s) => {
    if (!empilhar) {
      const d = s.valores.map((v, i) => `${i ? "L" : "M"}${px(x[i]).toFixed(1)},${py(v).toFixed(1)}`).join("");
      return { s, linha: d, area: null as string | null };
    }
    const de = base.slice();
    const ate = s.valores.map((v, i) => (base[i] += Math.max(0, v)));
    const topo = ate.map((v, i) => `${i ? "L" : "M"}${px(x[i]).toFixed(1)},${py(v).toFixed(1)}`).join("");
    const volta = de.map((v, i) => [px(x[i]).toFixed(1), py(v).toFixed(1)]).reverse().map(([a, b]) => `L${a},${b}`).join("");
    return { s, linha: topo, area: `${topo}${volta}Z` };
  });

  return (
    <div className="min-w-0">
      <div className="relative pl-14" style={{ height: altura }}>
        {/* rótulos do eixo y */}
        {marcasY.map((m) => (
          <span key={m} className="e-legenda absolute left-0 w-12 -translate-y-1/2 text-right tabular-nums" style={{ top: `${(1 - m / topoY) * 100}%` }} aria-hidden="true">
            {formatarY(m)}
          </span>
        ))}
        <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label={rotuloAcessivel} className="block overflow-visible">
          <title id={`${id}-t`}>{rotuloAcessivel}</title>
          {marcasY.map((m) => (
            <line key={m} x1={0} x2={L} y1={py(m)} y2={py(m)} stroke="hsl(var(--foreground) / 0.08)" vectorEffect="non-scaling-stroke" />
          ))}
          {desenhos.map(({ s, area }) => area && <path key={`a-${s.nome}`} d={area} fill={`hsl(var(${s.tom}) / 0.55)`} stroke="none" />)}
          {desenhos.map(({ s, linha }) => (
            <path key={`l-${s.nome}`} d={linha} fill="none" stroke={`hsl(var(${s.tom}))`} strokeWidth={2} strokeDasharray={s.tracejada ? "6 4" : undefined} vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={0} x2={L} y1={A} y2={A} stroke="hsl(var(--foreground))" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={0} y1={0} y2={A} stroke="hsl(var(--foreground))" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {/* rótulos do eixo x */}
      <div className="relative ml-14 h-6" aria-hidden="true">
        {marcasX.map((m) => {
          const f = x1 === x0 ? 0 : (m - x0) / (x1 - x0);
          return (
            <span key={m} className="e-legenda absolute top-1 tabular-nums" style={{ left: `${f * 100}%`, transform: `translateX(${f < 0.05 ? "0" : f > 0.95 ? "-100%" : "-50%"})` }}>
              {formatarX(m)}
            </span>
          );
        })}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1" aria-hidden="true">
        {series.map((s) => (
          <li key={s.nome} className="e-legenda flex items-center gap-2">
            <svg width="22" height="10" aria-hidden="true">
              {empilhar
                ? <rect x="0" y="1" width="22" height="8" fill={`hsl(var(${s.tom}) / 0.55)`} stroke={`hsl(var(${s.tom}))`} />
                : <line x1="0" x2="22" y1="5" y2="5" stroke={`hsl(var(${s.tom}))`} strokeWidth="2" strokeDasharray={s.tracejada ? "5 3" : undefined} />}
            </svg>
            {s.nome}
          </li>
        ))}
      </ul>
    </div>
  );
}
