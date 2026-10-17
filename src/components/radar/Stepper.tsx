import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { lerNumeroDigitado } from "@/lib/radarUi";

/**
 * Campo numérico com − e + (alvos de 44px). O centro também aceita digitação:
 * mostra o valor formatado e, ao focar, o número cru; confirma ao sair do campo
 * ou com Enter (Esc desfaz). O valor sempre fica entre mínimo e máximo.
 */
export default function Stepper({
  valor,
  onChange,
  passo,
  min,
  max,
  formatar,
  rotulo,
  casas = 0,
  alto = 44,
  className,
}: {
  valor: number;
  onChange: (valor: number) => void;
  passo: number;
  min: number;
  max: number;
  formatar: (valor: number) => string;
  /** Nome do campo (ex.: "Diária média"): rótulo do campo e dos botões. */
  rotulo: string;
  /** Casas decimais aceitas na digitação. */
  casas?: number;
  alto?: 44 | 48;
  className?: string;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const cancelado = useRef(false);
  useEffect(() => { setEditando(null); }, [valor]);

  const limitar = (v: number) => {
    const fator = 10 ** casas;
    return Math.min(max, Math.max(min, Math.round(v * fator) / fator));
  };
  const confirmar = () => {
    if (editando === null) return;
    const lido = cancelado.current ? null : lerNumeroDigitado(editando);
    cancelado.current = false;
    setEditando(null);
    if (lido !== null) onChange(limitar(lido));
  };
  const nome = rotulo.toLowerCase();
  const botao = "flex items-center justify-center bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-[0.45]";

  return (
    <div
      className={cn("grid items-center overflow-hidden rounded-lg border border-input bg-card", className)}
      style={{ gridTemplateColumns: `${alto}px minmax(0,1fr) ${alto}px` }}
    >
      <button type="button" className={botao} style={{ height: alto }} onClick={() => onChange(limitar(valor - passo))} disabled={valor <= min} aria-label={`Diminuir ${nome}`}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode={casas > 0 ? "decimal" : "numeric"}
        aria-label={rotulo}
        value={editando ?? formatar(valor)}
        onFocus={(e) => { setEditando(String(valor).replace(".", ",")); requestAnimationFrame(() => e.target.select()); }}
        onChange={(e) => setEditando(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Escape") { cancelado.current = true; (e.target as HTMLInputElement).blur(); }
        }}
        className="h-full w-full min-w-0 bg-transparent px-1 text-center text-base font-semibold tabular-nums text-foreground outline-none focus-visible:bg-accent-light"
      />
      <button type="button" className={botao} style={{ height: alto }} onClick={() => onChange(limitar(valor + passo))} disabled={valor >= max} aria-label={`Aumentar ${nome}`}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
