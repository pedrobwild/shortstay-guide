import { useId } from "react";
import type { BairroCurado } from "@/data/bairrosCurados";
import { marcaNatureza } from "@/lib/radarUi";
import { cn } from "@/lib/utils";

/**
 * Seletor de bairro do Estudo aberto: <select> nativo (funciona no celular, 44px de
 * toque, 16px de texto para o iOS não dar zoom), com o rótulo visível em caixa-alta.
 * Aproximações aparecem marcadas na própria opção.
 */
export default function SeletorBairro({
  bairros,
  valor,
  onChange,
  rotulo = "Bairro",
  className,
  semRotulo = false,
  incluirVazio,
}: {
  bairros: Pick<BairroCurado, "name" | "ocupacaoFonte">[];
  valor: string | null;
  onChange: (nome: string) => void;
  rotulo?: string;
  className?: string;
  semRotulo?: boolean;
  /** Texto da opção vazia (ex.: "Escolher bairro"); sem ele, não há opção vazia. */
  incluirVazio?: string;
}) {
  const id = useId();
  const ordenados = [...bairros].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={cn("e-rotulo mb-1.5 block", semRotulo && "sr-only")}>{rotulo}</label>
      <div className="relative">
        <select
          id={id}
          value={valor ?? ""}
          onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
          className="min-h-[44px] w-full appearance-none rounded-[2px] border border-input bg-card py-2 pl-3 pr-10 text-base text-foreground"
        >
          {incluirVazio && <option value="">{incluirVazio}</option>}
          {ordenados.map((b) => {
            const marca = marcaNatureza(b);
            return <option key={b.name} value={b.name}>{b.name}{marca ? ` (${marca})` : ""}</option>;
          })}
        </select>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-70">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
