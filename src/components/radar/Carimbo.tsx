import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CelulaCarimbo = {
  rotulo: string;
  /** Texto já formatado para exibição (numberFormat). */
  valor: string;
  /** Observação curta abaixo do valor (ex.: "amostra pequena"), em âmbar. */
  nota?: string;
};

const COLUNAS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

/**
 * Carimbo de fonte da direção Híbrida: moldura de 1px, cabeçalho com a natureza do dado,
 * células de números tabulares e rodapé com a fonte. É o mesmo desenho no hero da home
 * (referência de São Paulo) e no painel do mapa (bairro selecionado).
 * Até 360px os números diminuem e não quebram linha, para caber em 320px.
 */
export default function Carimbo({
  titulo,
  tag,
  celulas,
  rodape,
  className,
  valorClassName,
}: {
  titulo: ReactNode;
  tag?: ReactNode;
  celulas: CelulaCarimbo[];
  rodape?: ReactNode;
  className?: string;
  /** Tamanho dos números (padrão: 18px até 360px e 22px acima). */
  valorClassName?: string;
}) {
  return (
    <div className={cn("border border-foreground bg-card text-[13px] text-foreground", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-foreground px-3 py-2.5 min-[360px]:px-3.5">
        <strong className="font-semibold">{titulo}</strong>
        {tag}
      </div>
      <dl className={cn("grid", COLUNAS[celulas.length] ?? "grid-cols-3")}>
        {celulas.map((c, i) => (
          // Rótulo e nota em cima, número embaixo: os números ficam alinhados mesmo quando um rótulo quebra linha.
          <div key={c.rotulo} className={cn("flex min-w-0 flex-col px-2.5 py-3 min-[360px]:px-3.5", i < celulas.length - 1 && "border-r border-border")}>
            <dt className="text-xs leading-snug text-muted-foreground">{c.rotulo}</dt>
            {c.nota && <dd className="text-[11px] font-medium leading-snug text-estimate-text">{c.nota}</dd>}
            <dd className={cn("mt-auto whitespace-nowrap pt-0.5 text-lg font-semibold leading-tight tabular-nums min-[360px]:text-[22px]", valorClassName)}>{c.valor}</dd>
          </div>
        ))}
      </dl>
      {rodape && <div className="border-t border-foreground">{rodape}</div>}
    </div>
  );
}
