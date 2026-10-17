import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Aviso de carga da base do Radar. "erro" (vermelho) quando a base não respondeu;
 * "aviso" (âmbar) quando a tela segue com a reserva offline. Com `onTentar`,
 * mostra o botão "Tentar novamente".
 */
export default function AvisoBase({
  tom = "erro",
  children,
  onTentar,
  className,
}: {
  tom?: "erro" | "aviso";
  children: ReactNode;
  onTentar?: () => void;
  className?: string;
}) {
  return (
    <div
      role={tom === "erro" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-4 py-3 text-[15px] leading-normal",
        tom === "erro" ? "border-destructive-border bg-destructive-light text-destructive-text" : "border-estimate-border/60 bg-estimate-light text-estimate-text",
        className,
      )}
    >
      <p className="m-0 min-w-0 flex-1 basis-60">{children}</p>
      {onTentar && (
        <button
          type="button"
          onClick={onTentar}
          className={cn(
            "min-h-[44px] shrink-0 rounded-lg border bg-card px-3.5 text-sm font-semibold transition-colors",
            tom === "erro" ? "border-destructive text-destructive hover:bg-destructive-light" : "border-estimate text-estimate-text hover:bg-estimate-light",
          )}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
