import { Link } from "react-router-dom";
import type { BairroBase } from "@/lib/radarUi";
import { descricaoNatureza } from "@/lib/radarUi";
import { classesHistograma, temAmostraPequena } from "@/lib/estudo";
import { fracao } from "@/lib/estudoMercado";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";
import { estiloHtmlPonto, tipoPonto } from "@/components/estudo/graficos/LegendaPontos";

/**
 * Fig. 1 de /mercado: histograma de pontos da receita de referência. Cada bairro é um
 * ponto empilhado na sua classe (R$ 500 por padrão), do menor valor (embaixo) ao maior
 * (em cima); a linha vertical marca a referência (São Paulo). Cada ponto é um link para
 * a página do bairro, com aria-label "Bairro: R$ X por mês". Pontos em HTML (alvos
 * focáveis com anel visível); cores só por tokens.
 */
export default function HistogramaPontos({
  bairros,
  referencia,
  selecionado,
  largura = 500,
  hrefDe,
  aoAbrir,
}: {
  bairros: BairroBase[];
  referencia: { valor: number; rotulo: string };
  selecionado?: string | null;
  largura?: number;
  hrefDe: (b: BairroBase) => string;
  aoAbrir?: (b: BairroBase) => void;
}) {
  const classes = classesHistograma(bairros, largura);
  if (!classes.length) return null;
  const dominio: [number, number] = [classes[0].inicio, classes[classes.length - 1].fim];
  const n = classes.length;
  const maxPorClasse = Math.max(...classes.map((c) => c.itens.length));
  const xRef = Math.min(1, Math.max(0, fracao(referencia.valor, dominio)));
  const marcas = [...classes.map((c) => c.inicio), dominio[1]];

  return (
    <div className="min-w-0">
      {/* Rótulo da linha de referência, numa faixa própria acima dos pontos */}
      <div className="relative h-6" aria-hidden="true">
        <span
          className={cn("e-legenda absolute bottom-1 whitespace-nowrap font-semibold text-foreground", xRef < 0.5 ? "pl-1.5" : "-translate-x-full pr-1.5")}
          style={{ left: `${xRef * 100}%` }}
        >
          {referencia.rotulo}
        </span>
      </div>

      <div className="relative">
        {/* Linha da referência (atrás dos pontos) */}
        <div aria-hidden="true" className="absolute -top-6 bottom-0 w-0 border-l-[1.5px] border-dashed border-foreground" style={{ left: `${xRef * 100}%` }} />

        <ul
          className="relative grid items-end [--passo-ponto:20px] sm:[--passo-ponto:26px]"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, minHeight: `calc(${maxPorClasse} * var(--passo-ponto) + 8px)` }}
        >
          {classes.map((c, ic) => (
            <li key={c.inicio} className="flex min-w-0 list-none flex-col-reverse items-center gap-[2px] pb-1 sm:gap-1">
              {c.itens.map(({ bairro, receita }) => {
                const sel = bairro.name === selecionado;
                const tipo = tipoPonto(bairro);
                const estilo = estiloHtmlPonto(tipo, sel);
                const amostra = temAmostraPequena(bairro) ? ", amostra pequena" : "";
                const rotulo = `${bairro.name}: ${formatBRL(receita)} por mês${descricaoNatureza(bairro)}${amostra}${sel ? " (bairro selecionado)" : ""}`;
                return (
                  <Link
                    key={bairro.name}
                    to={hrefDe(bairro)}
                    onClick={() => aoAbrir?.(bairro)}
                    aria-label={rotulo}
                    className="group relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ciano focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-[22px] sm:w-[22px]"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("block h-full w-full rounded-full transition-transform group-hover:scale-110 motion-reduce:transition-none", estilo.className, sel && "ring-2 ring-magenta/40 ring-offset-1 ring-offset-background")}
                      style={estilo.style}
                    />
                    {/* Dica no passar do mouse e no foco do teclado; ancorada para dentro da figura */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute bottom-full z-10 mb-1.5 hidden whitespace-nowrap rounded-[2px] border border-foreground bg-card px-2 py-1 text-[13px] leading-4 text-foreground group-hover:block group-focus-visible:block",
                        ic < n / 3 ? "left-0" : ic >= (2 * n) / 3 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      <span className="font-semibold">{bairro.name}</span> <span className="tabular-nums">{formatBRL(receita)}</span>
                    </span>
                  </Link>
                );
              })}
            </li>
          ))}
        </ul>
      </div>

      {/* Eixo x: linha de tinta cheia, marca em cada limite de classe */}
      <div aria-hidden="true" className="relative h-9 border-t border-foreground">
        {marcas.map((m, i) => {
          const pos = i / n;
          const milhar = m % 1000 === 0;
          return (
            <span key={m} className="absolute top-0" style={{ left: `${pos * 100}%` }}>
              <span className="absolute left-0 top-0 h-1.5 w-px bg-foreground" />
              <span
                className={cn(
                  "e-legenda absolute top-2 whitespace-nowrap tabular-nums",
                  i === 0 ? "left-0" : i === marcas.length - 1 ? "right-0" : "-translate-x-1/2",
                  !milhar && "hidden sm:inline",
                )}
              >
                {formatDecimal(m, 0)}
              </span>
            </span>
          );
        })}
      </div>
      <p className="e-legenda sm:text-right">Receita de referência (R$/mês), classes de {formatBRL(largura)}</p>
    </div>
  );
}
