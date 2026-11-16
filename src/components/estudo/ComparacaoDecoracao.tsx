import { Tag } from "@/components/estudo/Natureza";
import { formatBRL } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

/**
 * Lado a lado do resultado com a diária do nível de decoração (hipótese) e com a
 * média do bairro (auditoria de 16/11/2026, R1). O multiplicador da decoração não é
 * efeito medido: a pessoa precisa ver quanto do resultado vem dele. Usado em
 * /projecao e /resumo, sempre com os dois resultados do mesmo motor.
 */
export default function ComparacaoDecoracao({ nivel, bairro, diariaNivel, diariaBairro, liquidoNivel, liquidoBairro, className }: {
  nivel: string;
  bairro: string;
  diariaNivel: number;
  diariaBairro: number;
  liquidoNivel: number;
  liquidoBairro: number;
  className?: string;
}) {
  const diferenca = liquidoNivel - liquidoBairro;
  return (
    <div className={cn("max-w-[720px] border-y border-border py-4", className)}>
      <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
        Quanto do resultado vem do nível de decoração
        <Tag tipo="hipotese" titulo="O efeito da decoração na diária é hipótese do simulador, não foi medido" />
      </p>
      <table className="mt-3 w-full text-[15px]">
        <caption className="sr-only">Resultado líquido por mês com a diária do nível de decoração e com a diária média do bairro</caption>
        <thead>
          <tr className="e-legenda text-left">
            <th scope="col" className="py-1 pr-2 font-normal">Diária usada</th>
            <th scope="col" className="py-1 pl-2 text-right font-normal">Diária (R$)</th>
            <th scope="col" className="py-1 pl-2 text-right font-normal">Líquido (R$/mês)</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr>
            <th scope="row" className="py-1 pr-2 text-left font-normal">Nível {nivel} (hipótese)</th>
            <td className="py-1 pl-2 text-right">{formatBRL(diariaNivel)}</td>
            <td className={cn("py-1 pl-2 text-right font-semibold", liquidoNivel < 0 && "e-negativo")}>{formatBRL(liquidoNivel)}</td>
          </tr>
          <tr>
            <th scope="row" className="py-1 pr-2 text-left font-normal">Média de {bairro}</th>
            <td className="py-1 pl-2 text-right">{formatBRL(diariaBairro)}</td>
            <td className={cn("py-1 pl-2 text-right font-semibold", liquidoBairro < 0 && "e-negativo")}>{formatBRL(liquidoBairro)}</td>
          </tr>
        </tbody>
      </table>
      <p className="e-legenda mt-3">
        A diferença de {formatBRL(Math.abs(diferenca))} por mês vem dessa hipótese. O Radar não mediu o efeito da decoração na diária.
      </p>
    </div>
  );
}
