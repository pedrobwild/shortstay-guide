import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { estiloSvgPonto, type TipoPonto } from "@/components/estudo/graficos/LegendaPontos";
import { cn } from "@/lib/utils";

/**
 * Gráficos dos artigos da área exclusiva, no desenho do Estudo aberto: cores só por
 * tokens, a mesma convenção de pontos de Mercado (observado em ciano, amostra pequena
 * com contorno pontilhado magenta, aproximação sem preenchimento e tracejada, seleção
 * em magenta) e o valor sempre escrito ao lado da marca, para a figura ler sem cor.
 */

export type TipoMarca = "observado" | "amostra" | "aproximacao";

export interface LinhaBarra {
  nome: string;
  valor: number;
  tipo: TipoMarca;
  destaque?: boolean;
  /** Nome acessível completo (ex.: "Pinheiros: 63% × R$ 299 × 30 = R$ 5.651 por mês"). */
  descricao: string;
}

const COLUNAS = "grid grid-cols-[6.75rem_minmax(0,1fr)_4.25rem] items-center gap-x-2 sm:grid-cols-[9.5rem_minmax(0,1fr)_5rem] sm:gap-x-3";

function classeMarca(tipo: TipoMarca, destaque: boolean) {
  if (tipo === "aproximacao") return cn("border-2 border-dashed bg-background", destaque ? "border-magenta" : "border-neutro-600");
  if (destaque) return "bg-magenta";
  if (tipo === "amostra") return "border-2 border-dotted border-magenta-700 bg-ciano-200";
  return "bg-ciano-200";
}

/** Barras horizontais com a linha de referência (São Paulo) tracejada atravessando a figura. */
export function BarrasHorizontais({
  linhas,
  maximo,
  marcas,
  referencia,
  formatar = formatBRL,
}: {
  linhas: LinhaBarra[];
  maximo: number;
  marcas: number[];
  referencia?: { valor: number; rotulo: string };
  formatar?: (v: number) => string;
}) {
  const pct = (v: number) => `${Math.min(100, (v / maximo) * 100)}%`;
  return (
    <div className="min-w-0">
      <ol className="m-0 grid list-none gap-[6px] p-0">
        {linhas.map((l) => (
          <li key={l.nome} className={COLUNAS} aria-label={l.descricao}>
            <span aria-hidden="true" className={cn("text-[13px] leading-4 sm:text-sm", l.destaque ? "font-semibold text-foreground" : "text-tinta-78")}>{l.nome}</span>
            <span aria-hidden="true" className="relative block h-3.5">
              <span className={cn("absolute inset-y-0 left-0 rounded-r-[3px]", classeMarca(l.tipo, Boolean(l.destaque)))} style={{ width: pct(l.valor) }} />
              {referencia && <span className="absolute -bottom-[4px] -top-[4px] w-0 border-l-[1.5px] border-dashed border-foreground" style={{ left: pct(referencia.valor) }} />}
            </span>
            <span aria-hidden="true" className={cn("text-right text-[13px] leading-4 tabular-nums sm:text-sm", l.destaque ? "font-semibold text-foreground" : "text-tinta-78")}>{formatar(l.valor)}</span>
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className={cn(COLUNAS, "mt-2")}>
        <span />
        <span className="relative block h-5 border-t border-foreground">
          {marcas.map((m, i) => (
            <span key={m} className={cn("e-legenda absolute top-1 whitespace-nowrap tabular-nums", i === 0 ? "left-0" : i === marcas.length - 1 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: pct(m) }}>
              {m === 0 ? "0" : `${formatDecimal(m / 1000, 0)} mil`}
            </span>
          ))}
        </span>
        <span />
      </div>
    </div>
  );
}

/** Legenda das barras e dos pontos (só os tipos usados). */
export function LegendaMarcas({ itens, className }: { itens: { simbolo: "destaque" | "observado" | "amostra" | "aproximacao" | "aproximacao-destaque" | "referencia" | "estimativa"; texto: string }[]; className?: string }) {
  return (
    <ul className={cn("e-legenda m-0 grid list-none gap-x-6 gap-y-1.5 p-0 sm:grid-cols-2", className)}>
      {itens.map((i) => (
        <li key={i.texto} className="flex min-w-0 items-start gap-2">
          <span aria-hidden="true" className="mt-[3px] shrink-0">
            {i.simbolo === "referencia" ? (
              <span className="block h-3.5 w-3.5 border-l-[1.5px] border-dashed border-foreground" style={{ marginLeft: 6 }} />
            ) : i.simbolo === "estimativa" ? (
              <span className="block h-3.5 w-3.5 rounded-full border-[1.5px] border-dashed border-tinta-78 bg-background" />
            ) : (
              <span className={cn("block h-3 w-3.5 rounded-r-[2px]", i.simbolo === "destaque" ? "bg-magenta" : i.simbolo === "aproximacao-destaque" ? classeMarca("aproximacao", true) : classeMarca(i.simbolo, false))} />
            )}
          </span>
          <span className="min-w-0">{i.texto}</span>
        </li>
      ))}
    </ul>
  );
}

export interface LinhaQuartis {
  nome: string;
  quartis: [number, number, number];
  media: number;
  destaque?: boolean;
  aproximacao?: boolean;
}

/** Quartis de diária de vários bairros num eixo comum: faixa P25–P75, traço da mediana, losango da média. */
export function QuartisComparados({ linhas, dominio, marcas }: { linhas: LinhaQuartis[]; dominio: [number, number]; marcas: number[] }) {
  const pos = (v: number) => `${((v - dominio[0]) / (dominio[1] - dominio[0])) * 100}%`;
  return (
    <div className="min-w-0">
      <ul className="m-0 grid list-none gap-5 p-0">
        {linhas.map((l) => {
          const [p25, p50, p75] = l.quartis;
          return (
            <li key={l.nome} className="grid gap-1.5 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-center sm:gap-x-3">
              <span className={cn("text-sm leading-5", l.destaque ? "font-semibold" : "text-tinta-78")}>{l.nome}</span>
              <span className="min-w-0">
                <span aria-hidden="true" className="relative block h-7">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-foreground/15" />
                  <span
                    className={cn(
                      "absolute inset-y-1 rounded-[2px] border",
                      l.aproximacao ? "border-dashed border-neutro-600 bg-background" : l.destaque ? "border-magenta-700 bg-magenta-100" : "border-foreground/55 bg-ciano-200",
                    )}
                    style={{ left: pos(p25), width: `calc(${pos(p75)} - ${pos(p25)})` }}
                  />
                  <span className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-ciano-700" style={{ left: pos(p50) }} />
                  <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-background bg-foreground" style={{ left: pos(l.media) }} />
                </span>
                <span className="e-legenda block tabular-nums">
                  25% mais baratos até {formatBRL(p25)} · mediana {formatBRL(p50)} · 25% mais caros a partir de {formatBRL(p75)} · <span className="font-semibold text-foreground">média {formatBRL(l.media)}</span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <div aria-hidden="true" className="mt-3 grid sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-x-3">
        <span className="hidden sm:block" />
        <span className="relative block h-5 border-t border-foreground">
          {marcas.map((m, i) => (
            <span key={m} className={cn("e-legenda absolute top-1 whitespace-nowrap tabular-nums", i === 0 ? "left-0" : i === marcas.length - 1 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: pos(m) }}>
              {formatBRL(m)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Legenda dos quartis comparados. */
export function LegendaQuartis() {
  return (
    <ul className="e-legenda m-0 flex list-none flex-wrap gap-x-6 gap-y-1.5 p-0">
      <li className="flex items-center gap-2"><span aria-hidden="true" className="block h-3 w-5 rounded-[2px] border border-foreground/55 bg-ciano-200" />Metade central dos anúncios (25% a 75%)</li>
      <li className="flex items-center gap-2"><span aria-hidden="true" className="block h-3.5 w-[3px] bg-ciano-700" />Mediana</li>
      <li className="flex items-center gap-2"><span aria-hidden="true" className="block h-2.5 w-2.5 rotate-45 bg-foreground" />Diária média</li>
    </ul>
  );
}

export interface PontoDispersao {
  nome: string;
  ocupacao: number;
  diaria: number;
  tipo: TipoPonto;
  /** Rótulo escrito ao lado do ponto (só nos pontos que a leitura precisa). */
  rotulo?: { texto: string; lado: "esquerda" | "direita" | "acima"; apoio?: string };
  destaque?: boolean;
}

/**
 * Dispersão ocupação × diária em SVG (viewBox estreito para ler bem no celular), com a
 * faixa de ocupação observada sombreada. Pontos sobrepostos ganham contorno do papel.
 */
export function DispersaoOcupacaoDiaria({
  pontos,
  faixa,
  dominioX,
  dominioY,
  descricao,
}: {
  pontos: PontoDispersao[];
  faixa: [number, number];
  dominioX: [number, number];
  dominioY: [number, number];
  descricao: string;
}) {
  const W = 360, H = 300, ml = 46, mr = 14, mt = 18, mb = 40;
  const x = (o: number) => ml + ((o - dominioX[0]) / (dominioX[1] - dominioX[0])) * (W - ml - mr);
  const y = (d: number) => mt + (1 - (d - dominioY[0]) / (dominioY[1] - dominioY[0])) * (H - mt - mb);
  const marcasY = [200, 300, 400, 500].filter((v) => v >= dominioY[0] && v <= dominioY[1]);
  const marcasX = [50, 60, 70, 80].filter((v) => v >= dominioX[0] && v <= dominioX[1]);
  // Destaques por último: ficam por cima.
  const ordem = [...pontos].sort((a, b) => Number(Boolean(a.destaque || a.rotulo)) - Number(Boolean(b.destaque || b.rotulo)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descricao} className="block h-auto w-full max-w-[560px] overflow-visible">
      <rect x={x(faixa[0])} y={mt} width={x(faixa[1]) - x(faixa[0])} height={H - mt - mb} fill="hsl(var(--ciano-100))" />
      <text x={(x(faixa[0]) + x(faixa[1])) / 2} y={H - mb - 6} textAnchor="middle" fontSize={10} fill="hsl(var(--ciano-700))">
        faixa observada: {formatDecimal(faixa[0], 0)}% a {formatDecimal(faixa[1], 0)}%
      </text>
      {marcasY.map((v) => (
        <g key={v}>
          <line x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} stroke="hsl(var(--foreground) / 0.12)" strokeWidth={1} />
          <text x={ml - 6} y={y(v) + 3.5} textAnchor="end" fontSize={10} fill="hsl(var(--tinta-70))" style={{ fontVariantNumeric: "tabular-nums" }}>{formatBRL(v)}</text>
        </g>
      ))}
      <line x1={ml} x2={W - mr} y1={H - mb} y2={H - mb} stroke="hsl(var(--foreground))" strokeWidth={1} />
      {marcasX.map((v) => (
        <text key={v} x={x(v)} y={H - mb + 15} textAnchor="middle" fontSize={10} fill="hsl(var(--tinta-70))">{formatDecimal(v, 0)}%</text>
      ))}
      <text x={(ml + W - mr) / 2} y={H - 6} textAnchor="middle" fontSize={10.5} fill="hsl(var(--tinta-78))">Ocupação média</text>
      <text x={8} y={mt - 6} fontSize={10.5} fill="hsl(var(--tinta-78))">Diária média</text>
      {ordem.map((p) => {
        const e = estiloSvgPonto(p.tipo, Boolean(p.destaque));
        const cx = x(p.ocupacao), cy = y(p.diaria);
        const r = p.destaque || p.rotulo ? 6 : 4.5;
        const lado = p.rotulo?.lado;
        const tx = lado === "esquerda" ? cx - 10 : lado === "direita" ? cx + 10 : cx;
        const anchor = lado === "esquerda" ? "end" : lado === "direita" ? "start" : "middle";
        const ty = lado === "acima" ? cy - 12 : cy - 2;
        const cor = p.destaque ? "hsl(var(--magenta-700))" : "hsl(var(--foreground))";
        return (
          <g key={p.nome}>
            <circle cx={cx} cy={cy} r={r} fill={e.fill} stroke={e.stroke} strokeWidth={e.strokeWidth} strokeDasharray={e.strokeDasharray} />
            <circle cx={cx} cy={cy} r={r + 1.5} fill="none" stroke="hsl(var(--background))" strokeWidth={1.2} />
            {p.rotulo && (
              <>
                <text x={tx} y={ty} textAnchor={anchor} fontSize={10.5} fontWeight={700} fill={cor}>{p.rotulo.texto}</text>
                {p.rotulo.apoio && <text x={tx} y={lado === "acima" ? cy + 20 : ty + 12} textAnchor={anchor} fontSize={9.5} fill={cor}>{p.rotulo.apoio}</text>}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
