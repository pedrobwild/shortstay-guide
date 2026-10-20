import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { marcasEixo } from "@/lib/estudoFerramentas";

/**
 * Colunas empilhadas por mês (Estudo aberto): resultado líquido embaixo (ciano), custos
 * em cima (neutro), na mesma escala da maior receita bruta mensal. Mês com resultado
 * negativo ganha contorno magenta. SVG próprio com eixos e unidade; a tabela equivalente
 * fica disponível para leitores de tela.
 */
export interface MesColuna {
  chave: string;
  rotulo: string;
  ano: number;
  bruta: number;
  custos: number;
  liquido: number;
}

const L = 1000, A = 240;

export default function ColunasMensais({ meses }: { meses: MesColuna[] }) {
  if (!meses.length) return null;
  const maior = Math.max(1, ...meses.map((m) => Math.max(m.bruta, m.custos)));
  const marcas = marcasEixo([0, maior], 4);
  const topo = Math.max(maior, marcas[marcas.length - 1] ?? maior);
  const largura = L / meses.length;
  const barra = largura * 0.64;
  const py = (v: number) => A - (v / topo) * A;
  const descricao = `Receita bruta, custos e resultado líquido por mês, de ${meses[0].rotulo}/${meses[0].ano} a ${meses[meses.length - 1].rotulo}/${meses[meses.length - 1].ano}.`;

  return (
    <div className="min-w-0">
      <div className="relative pl-14" style={{ height: 220 }}>
        {marcas.map((m) => (
          <span key={m} aria-hidden="true" className="e-legenda absolute left-0 w-12 -translate-y-1/2 text-right tabular-nums" style={{ top: `${(1 - m / topo) * 100}%` }}>
            {m >= 1000 ? `${formatDecimal(m / 1000, Number.isInteger(m / 1000) ? 0 : 1)} mil` : formatDecimal(m, 0)}
          </span>
        ))}
        <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label={descricao} className="block overflow-visible">
          {marcas.map((m) => <line key={m} x1={0} x2={L} y1={py(m)} y2={py(m)} stroke="hsl(var(--foreground) / 0.08)" vectorEffect="non-scaling-stroke" />)}
          {meses.map((m, i) => {
            const x = i * largura + (largura - barra) / 2;
            const liq = Math.max(0, m.liquido);
            const custoVisivel = Math.max(0, Math.max(m.bruta, m.custos) - liq);
            const negativo = m.liquido < 0;
            return (
              <g key={m.chave}>
                <title>{`${m.rotulo}/${m.ano}: receita bruta ${formatBRL(m.bruta)} · custos ${formatBRL(m.custos)} · resultado líquido ${formatBRL(m.liquido)}`}</title>
                <rect x={x} y={py(liq + custoVisivel)} width={barra} height={(custoVisivel / topo) * A} fill="hsl(var(--neutro-300))" />
                <rect x={x} y={py(liq)} width={barra} height={(liq / topo) * A} fill="hsl(var(--ciano))" />
                <rect
                  x={x} y={py(liq + custoVisivel)} width={barra} height={((liq + custoVisivel) / topo) * A}
                  fill="none" stroke={negativo ? "hsl(var(--magenta))" : "hsl(var(--foreground) / 0.55)"} strokeWidth={negativo ? 2 : 1} vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
          <line x1={0} x2={L} y1={A} y2={A} stroke="hsl(var(--foreground))" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={0} y1={0} y2={A} stroke="hsl(var(--foreground))" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div aria-hidden="true" className="ml-14 grid" style={{ gridTemplateColumns: `repeat(${meses.length}, minmax(0,1fr))` }}>
        {meses.map((m, i) => <span key={m.chave} className={`e-legenda pt-1 text-center ${i % 2 ? "invisible sm:visible" : ""}`}>{m.rotulo}</span>)}
      </div>
      <div className="sr-only"><table>
        <caption>{descricao}</caption>
        <thead><tr><th scope="col">Mês</th><th scope="col">Receita bruta</th><th scope="col">Custos</th><th scope="col">Resultado líquido</th></tr></thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.chave}><th scope="row">{m.rotulo}/{m.ano}</th><td>{formatBRL(m.bruta)}</td><td>{formatBRL(m.custos)}</td><td>{formatBRL(m.liquido)}</td></tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
