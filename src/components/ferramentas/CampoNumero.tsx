import { useEffect, useId, useState, type ReactNode } from "react";
import { lerNumeroDigitado } from "@/lib/radarUi";
import { formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

/**
 * Campo numérico do Estudo aberto: rótulo em caixa-alta com a unidade, texto de 16px
 * (sem zoom no iOS), 44px de toque, unidade à direita e número tabular. Aceita
 * vírgula decimal; o valor só vale quando é legível (vazio = null).
 */
export default function CampoNumero({
  rotulo,
  valor,
  onChange,
  unidade,
  prefixo,
  casas = 0,
  ajuda,
  className,
  placeholder,
  tag,
}: {
  rotulo: string;
  valor: number | null;
  onChange: (v: number | null) => void;
  unidade?: string;
  prefixo?: string;
  casas?: number;
  ajuda?: ReactNode;
  className?: string;
  placeholder?: string;
  /** Etiqueta ao lado do rótulo (ex.: Tag de hipótese). */
  tag?: ReactNode;
}) {
  const id = useId();
  const formatar = (v: number | null) => (v == null ? "" : formatDecimal(v, Number.isInteger(v) ? 0 : casas));
  const [texto, setTexto] = useState(formatar(valor));
  const [editando, setEditando] = useState(false);
  useEffect(() => { if (!editando) setTexto(formatar(valor)); }, [valor, editando]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <label htmlFor={id} className="e-rotulo block">{rotulo}</label>
        {tag}
      </div>
      <div className="relative">
        {prefixo && <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-tinta-70">{prefixo}</span>}
        <input
          id={id}
          type="text"
          inputMode={casas > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          value={texto}
          placeholder={placeholder}
          aria-describedby={ajuda ? `${id}-ajuda` : undefined}
          onFocus={() => setEditando(true)}
          onChange={(e) => {
            setTexto(e.target.value);
            onChange(lerNumeroDigitado(e.target.value));
          }}
          onBlur={() => { setEditando(false); setTexto(formatar(valor)); }}
          className={cn(
            "min-h-[44px] w-full rounded-[2px] border border-input bg-card py-2 text-right text-base tabular-nums text-foreground",
            prefixo ? "pl-10" : "pl-3",
            unidade ? "pr-12" : "pr-3",
          )}
        />
        {unidade && <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base text-tinta-70">{unidade}</span>}
      </div>
      {ajuda && <p id={`${id}-ajuda`} className="e-legenda mt-1">{ajuda}</p>}
    </div>
  );
}
