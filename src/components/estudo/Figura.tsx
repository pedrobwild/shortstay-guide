import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Figura numerada (Fig. 1): título que afirma um achado, unidade, o gráfico,
 * a legenda e a fonte. Todo gráfico do Estudo aberto passa por aqui.
 */
export function Figura({
  numero,
  titulo,
  unidade,
  children,
  legenda,
  fonte,
  className,
  id,
}: {
  numero: number;
  titulo: ReactNode;
  unidade?: ReactNode;
  children: ReactNode;
  legenda?: ReactNode;
  fonte?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <figure id={id} className={cn("m-0 min-w-0", className)}>
      <figcaption className="mb-5">
        <span className="e-rotulo block">Fig. {numero}</span>
        <span className="e-h3 mt-1 block text-balance">{titulo}</span>
        {unidade && <span className="e-legenda mt-1 block">{unidade}</span>}
      </figcaption>
      {children}
      {legenda && <div className="e-legenda mt-4">{legenda}</div>}
      {fonte && <p className="e-legenda mt-2">Fonte: {fonte}</p>}
    </figure>
  );
}

/**
 * Tabela numerada (Tab. 1): legenda em cima, cabeçalho com linha de tinta cheia,
 * linhas finas (8% de tinta) entre as linhas. No celular a tabela rola dentro da
 * própria caixa (nunca a página), com a legenda indicando isso quando precisa.
 */
export function TabelaNumerada({
  numero,
  titulo,
  unidade,
  children,
  nota,
  className,
  rolavel = true,
}: {
  numero: number;
  titulo: ReactNode;
  unidade?: ReactNode;
  children: ReactNode;
  nota?: ReactNode;
  className?: string;
  rolavel?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn(rolavel && "overflow-x-auto")}>
        <table className="w-full border-collapse text-left text-[15px] leading-[22px]">
          <caption className="mb-4 text-left" style={{ captionSide: "top" }}>
            <span className="e-rotulo block">Tab. {numero}</span>
            <span className="e-h3 mt-1 block text-balance">{titulo}</span>
            {unidade && <span className="e-legenda mt-1 block font-normal">{unidade}</span>}
          </caption>
          {children}
        </table>
      </div>
      {nota && <div className="e-legenda mt-3">{nota}</div>}
    </div>
  );
}

/** Classes de célula das tabelas numeradas. */
export const TH = "e-rotulo border-b border-foreground px-2 py-2 align-bottom first:pl-0 last:pr-0";
export const TD = "e-fina border-b px-2 py-3 align-top first:pl-0 last:pr-0";
export const TD_NUM = "e-fina border-b px-2 py-3 text-right align-top tabular-nums first:pl-0 last:pr-0";
