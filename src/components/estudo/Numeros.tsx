import type { ReactNode } from "react";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { AVISO_RECEITA } from "@/lib/estudo";
import { cn } from "@/lib/utils";

/** Indicador: rótulo com a unidade, número de destaque (34–48, peso 600) e nota curta. */
export function Indicador({
  rotulo,
  valor,
  nota,
  pequeno = false,
  className,
}: {
  rotulo: ReactNode;
  valor: ReactNode;
  nota?: ReactNode;
  pequeno?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="e-rotulo">{rotulo}</dt>
      <dd className="m-0">
        <span className={cn(pequeno ? "e-numero-sm" : "e-numero", "mt-1 block")}>{valor}</span>
        {nota && <span className="e-legenda mt-1 block">{nota}</span>}
      </dd>
    </div>
  );
}

/** Grade de indicadores (2 colunas no celular, até 4 no desktop) como lista de definição. */
export function GradeIndicadores({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-10", className)}>{children}</dl>;
}

/**
 * Diferença com sinal (+ / − / ±) e cor: ciano 700 positivo, magenta 700 negativo,
 * tinta quando zero. `formato`: reais, pontos percentuais ou percentual.
 */
export function Diferenca({ valor, formato = "brl", sufixo, className }: { valor: number; formato?: "brl" | "pp" | "pct"; sufixo?: string; className?: string }) {
  const sinal = valor > 0 ? "+" : valor < 0 ? "−" : "±";
  const abs = Math.abs(valor);
  const texto = formato === "brl" ? formatBRL(abs) : formato === "pp" ? `${formatDecimal(abs, Number.isInteger(abs) ? 0 : 1)} p.p.` : `${formatDecimal(abs, 0)}%`;
  return (
    <span className={cn("tabular-nums", valor > 0 ? "e-positivo" : valor < 0 ? "e-negativo" : "", className)}>
      {sinal}{texto}{sufixo ? ` ${sufixo}` : ""}
    </span>
  );
}

/** Variável de fórmula em itálico verdadeiro. */
export function V({ children }: { children: ReactNode }) {
  return <var className="e-var">{children}</var>;
}

/**
 * Fórmula da receita de referência na tela (princípio 2): R = d × 30 × o e,
 * quando há valores, a conta com os números ao lado.
 */
export function FormulaReceita({ diaria, ocupacaoPct, receita, className }: { diaria?: number; ocupacaoPct?: number; receita?: number; className?: string }) {
  const comValores = diaria != null && ocupacaoPct != null && receita != null;
  return (
    <p className={cn("text-[17px] leading-7", className)}>
      <span className="whitespace-nowrap"><V>R</V> = <V>d</V> × 30 × <V>o</V></span>
      {comValores && (
        <>
          <span aria-hidden="true" className="mx-3 text-tinta-70">→</span>
          <span className="whitespace-nowrap tabular-nums">{formatBRL(receita)} = {formatBRL(diaria)} × 30 × {formatDecimal(ocupacaoPct / 100, 2)}</span>
        </>
      )}
      <span className="e-legenda mt-1 block">
        <V>R</V> receita de referência por mês, antes de custos · <V>d</V> diária média · <V>o</V> ocupação média
      </span>
    </p>
  );
}

/** Aviso que acompanha toda tela com número de receita. */
export function AvisoReceita({ className }: { className?: string }) {
  return <p className={cn("e-legenda max-w-[720px]", className)}>{AVISO_RECEITA}</p>;
}
