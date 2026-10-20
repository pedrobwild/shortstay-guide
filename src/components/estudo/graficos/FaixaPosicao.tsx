import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { BairroBase } from "@/lib/radarUi";
import { descricaoNatureza } from "@/lib/radarUi";
import { temAmostraPequena } from "@/lib/estudo";
import { dominioEixo, empilharEnxame, fracao, marcasEixo } from "@/lib/estudoMercado";
import { cn } from "@/lib/utils";
import { estiloHtmlPonto, tipoPonto } from "@/components/estudo/graficos/LegendaPontos";

const DIAMETRO = 14;
const PASSO_NIVEL = 15;

/** Largura do contêiner (para separar pontos que encostam); 800 antes da medida. */
function useLargura() {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(800);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setLargura(Math.max(1, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, largura };
}

/**
 * Uma faixa horizontal (strip plot) com um ponto por bairro no mesmo eixo: pontos que
 * encostam sobem e descem (enxame), o bairro selecionado em magenta e por cima, a
 * referência (São Paulo) como linha vertical tracejada e rotulada. Cada ponto é um
 * link para a página do bairro, com aria-label "Bairro: valor". Eixo com unidade.
 */
export default function FaixaPosicao({
  titulo,
  unidade,
  bairros,
  valor,
  formatar,
  passo,
  referencia,
  selecionado,
  hrefDe,
  aoAbrir,
}: {
  titulo: string;
  unidade: string;
  bairros: BairroBase[];
  valor: (b: BairroBase) => number;
  formatar: (v: number) => string;
  /** Passo das marcas do eixo. */
  passo: number;
  referencia: { valor: number; rotulo: string };
  selecionado: string;
  hrefDe: (b: BairroBase) => string;
  aoAbrir?: (b: BairroBase) => void;
}) {
  const { ref, largura } = useLargura();
  const valores = bairros.map(valor);
  let dominio = dominioEixo([...valores, referencia.valor], passo);
  // Folga de meio passo quando um ponto cai em cima da borda do eixo.
  if (Math.max(...valores) > dominio[1] - passo * 0.15) dominio = [dominio[0], dominio[1] + passo];
  if (Math.min(...valores) < dominio[0] + passo * 0.15) dominio = [dominio[0] - passo, dominio[1]];
  const marcas = marcasEixo(dominio, passo);
  // O selecionado entra primeiro: no empate de posição, fica no nível 0 (centro da faixa).
  const entrada = [...bairros].sort((a, b) => Number(b.name === selecionado) - Number(a.name === selecionado));
  const pontos = empilharEnxame(entrada.map((b) => ({ item: b, x: fracao(valor(b), dominio) * largura })), DIAMETRO + 1);
  const sel = pontos.find((p) => p.item.name === selecionado);
  const nivelMax = Math.max(0, ...pontos.map((p) => Math.abs(p.nivel)));
  const altura = (2 * nivelMax + 1) * PASSO_NIVEL + 16;
  const meio = altura / 2;
  const xRef = fracao(referencia.valor, dominio);
  // O selecionado vai por último (fica por cima).
  const ordem = [...pontos].sort((a, b) => Number(a.item.name === selecionado) - Number(b.item.name === selecionado));
  // Rótulos do eixo: um a cada `salto` marcas, para caberem (~64px cada) sem encostar.
  const salto = Math.max(1, Math.ceil((marcas.length * 64) / largura));

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[15px] font-semibold leading-6">{titulo}</p>
        <p className="e-legenda">{unidade}</p>
      </div>
      <div ref={ref} className="relative mt-6" style={{ height: altura }}>
        {/* Referência (São Paulo) */}
        <div aria-hidden="true" className="absolute -top-5 bottom-0 w-0 border-l-[1.5px] border-dashed border-foreground" style={{ left: `${xRef * 100}%` }} />
        <span
          aria-hidden="true"
          className={cn("e-legenda absolute -top-6 whitespace-nowrap font-semibold text-foreground", xRef < 0.5 ? "pl-1.5" : "-translate-x-full pr-1.5")}
          style={{ left: `${xRef * 100}%` }}
        >
          {referencia.rotulo}
        </span>
        <ul className="m-0 list-none p-0">
          {ordem.map(({ item: b, x, nivel }) => {
            const eSel = b.name === selecionado;
            const estilo = estiloHtmlPonto(tipoPonto(b), eSel);
            const amostra = temAmostraPequena(b) ? ", amostra pequena" : "";
            return (
              <li key={b.name} className="absolute" style={{ left: x, top: meio - nivel * PASSO_NIVEL }}>
                <Link
                  to={hrefDe(b)}
                  onClick={() => aoAbrir?.(b)}
                  aria-label={`${b.name}: ${formatar(valor(b))}${descricaoNatureza(b)}${amostra}${eSel ? " (bairro desta página)" : ""}`}
                  aria-current={eSel ? "page" : undefined}
                  className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ciano focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{ width: eSel ? DIAMETRO + 4 : DIAMETRO, height: eSel ? DIAMETRO + 4 : DIAMETRO }}
                >
                  <span aria-hidden="true" className={cn("block h-full w-full rounded-full", estilo.className)} style={estilo.style} />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute bottom-full z-10 mb-1.5 hidden whitespace-nowrap rounded-[2px] border border-foreground bg-card px-2 py-1 text-[13px] leading-4 text-foreground group-hover:block group-focus-visible:block",
                      x < largura / 3 ? "left-0" : x > (2 * largura) / 3 ? "right-0" : "left-1/2 -translate-x-1/2",
                    )}
                  >
                    <span className="font-semibold">{b.name}</span> <span className="tabular-nums">{formatar(valor(b))}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Nome do bairro selecionado, numa linha própria logo abaixo dos pontos */}
      {sel && (
        <div aria-hidden="true" className="relative mt-1 h-5">
          <span
            className={cn(
              "absolute top-0 whitespace-nowrap text-[13px] font-semibold leading-5 text-magenta-700",
              sel.x < largura * 0.15 ? "left-0" : sel.x > largura * 0.85 ? "right-0" : "-translate-x-1/2",
            )}
            style={sel.x < largura * 0.15 || sel.x > largura * 0.85 ? undefined : { left: sel.x }}
          >
            ▲ {sel.item.name} <span className="tabular-nums">{formatar(valor(sel.item))}</span>
          </span>
        </div>
      )}
      {/* Eixo */}
      <div aria-hidden="true" className={cn("relative h-7 border-t border-foreground", sel ? "mt-1" : "mt-3")}>
        {marcas.map((m, i) => {
          const pos = fracao(m, dominio);
          const visivel = i % salto === 0;
          return (
            <span key={m} className="absolute top-0" style={{ left: `${pos * 100}%` }}>
              <span className="absolute left-0 top-0 h-1.5 w-px bg-foreground" />
              {visivel && (
                <span className={cn("e-legenda absolute top-2 whitespace-nowrap tabular-nums", i === 0 ? "left-0" : i === marcas.length - 1 ? "-translate-x-full" : "-translate-x-1/2")}>
                  {formatar(m)}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
