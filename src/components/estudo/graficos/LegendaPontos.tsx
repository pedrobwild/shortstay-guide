import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BairroBase } from "@/lib/radarUi";
import { naturezaBairro } from "@/lib/radarUi";
import { temAmostraPequena } from "@/lib/estudo";

/**
 * Estilo dos pontos de bairro nas figuras de Mercado e Bairro (um só desenho para as
 * duas telas): observado em ciano; aproximação sem preenchimento, com contorno
 * tracejado (nunca ponto sólido); amostra pequena em ciano claro com contorno
 * pontilhado magenta (alerta); estimativa ou ajuste manual em neutro com contorno de
 * tinta a 55%; bairro selecionado em magenta (tracejado se for aproximação).
 */
export type TipoPonto = "observado" | "aproximacao" | "amostra" | "estimativa";

export const CONTORNO_TINTA = "hsl(var(--foreground) / 0.55)";

export function tipoPonto(b: BairroBase): TipoPonto {
  const n = naturezaBairro(b);
  if (n === "aproximacao") return "aproximacao";
  if (n === "estimativa") return "estimativa";
  return temAmostraPequena(b) ? "amostra" : "observado";
}

/** Atributos SVG (fill/stroke) do ponto. */
export function estiloSvgPonto(tipo: TipoPonto, selecionado: boolean) {
  if (tipo === "aproximacao") {
    return { fill: "hsl(var(--background))", stroke: selecionado ? "hsl(var(--magenta))" : "hsl(var(--neutro-600))", strokeWidth: selecionado ? 2 : 1.5, strokeDasharray: "3 2" };
  }
  if (selecionado) return { fill: "hsl(var(--magenta))", stroke: "hsl(var(--magenta-700))", strokeWidth: 1, strokeDasharray: undefined };
  if (tipo === "amostra") return { fill: "hsl(var(--ciano-200))", stroke: "hsl(var(--magenta-700))", strokeWidth: 1.5, strokeDasharray: "1.5 1.5" };
  if (tipo === "estimativa") return { fill: "hsl(var(--neutro-400))", stroke: CONTORNO_TINTA, strokeWidth: 1, strokeDasharray: undefined };
  return { fill: "hsl(var(--ciano))", stroke: "hsl(var(--ciano-700))", strokeWidth: 1, strokeDasharray: undefined };
}

/** Classes e estilo do ponto em HTML (botões do histograma). */
export function estiloHtmlPonto(tipo: TipoPonto, selecionado: boolean): { className: string; style?: CSSProperties } {
  if (tipo === "aproximacao") {
    return { className: cn("border-2 border-dashed bg-background", selecionado ? "border-magenta" : "border-neutro-600") };
  }
  if (selecionado) return { className: "border border-magenta-700 bg-magenta" };
  if (tipo === "amostra") return { className: "border-2 border-dotted border-magenta-700 bg-ciano-200" };
  if (tipo === "estimativa") return { className: "border bg-neutro-400", style: { borderColor: CONTORNO_TINTA } };
  return { className: "border border-ciano-700 bg-ciano" };
}

function Amostra({ tipo, selecionado = false }: { tipo: TipoPonto; selecionado?: boolean }) {
  const e = estiloSvgPonto(tipo, selecionado);
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <circle cx="7" cy="7" r="5.5" fill={e.fill} stroke={e.stroke} strokeWidth={e.strokeWidth} strokeDasharray={e.strokeDasharray} />
    </svg>
  );
}

function Item({ simbolo, children }: { simbolo: ReactNode; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-start gap-2">
      <span className="mt-[3px]">{simbolo}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/**
 * Legenda completa dos pontos. Só mostra os tipos presentes na figura; o bairro
 * selecionado e a linha de referência entram quando informados.
 */
export function LegendaPontos({
  bairros,
  selecionado,
  referencia,
  className,
}: {
  bairros: BairroBase[];
  selecionado?: string | null;
  referencia?: ReactNode;
  className?: string;
}) {
  const tipos = new Set(bairros.map(tipoPonto));
  const nomes = (t: TipoPonto) => bairros.filter((b) => tipoPonto(b) === t).map((b) => b.name).join(", ");
  const sel = selecionado ? bairros.find((b) => b.name === selecionado) : undefined;
  return (
    <ul className={cn("e-legenda grid gap-x-8 gap-y-1.5 sm:grid-cols-2", className)}>
      {tipos.has("observado") && <Item simbolo={<Amostra tipo="observado" />}>Dado observado no próprio bairro</Item>}
      {tipos.has("aproximacao") && <Item simbolo={<Amostra tipo="aproximacao" />}>Aproximação pelo Itaim Bibi, sem preenchimento ({nomes("aproximacao")})</Item>}
      {tipos.has("amostra") && <Item simbolo={<Amostra tipo="amostra" />}><span className="e-amostra">Amostra pequena</span>, menos de 200 anúncios ({nomes("amostra")}): leia com cautela</Item>}
      {tipos.has("estimativa") && <Item simbolo={<Amostra tipo="estimativa" />}>Estimativa ou ajuste manual da Bewild ({nomes("estimativa")})</Item>}
      {sel && <Item simbolo={<Amostra tipo={tipoPonto(sel)} selecionado />}>Bairro selecionado: {sel.name}</Item>}
      {referencia && (
        <Item simbolo={<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><line x1="7" x2="7" y1="0" y2="14" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeDasharray="3 2" /></svg>}>
          {referencia}
        </Item>
      )}
    </ul>
  );
}
