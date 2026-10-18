import { cn } from "@/lib/utils";
import { ROTULO_SITUACAO, type SituacaoUsuario } from "@/lib/adminUsuarios";

/** Cores só de tokens do tema (claro e escuro). */
const CLASSE: Record<SituacaoUsuario, string> = {
  bloqueado: "bg-destructive-light text-destructive-text border-destructive-border",
  nao_confirmado: "bg-estimate-light text-estimate-text border-estimate-border",
  inativo: "bg-muted text-muted-foreground border-border",
  ativo: "bg-primary-soft text-primary border-transparent",
};

export default function SituacaoBadge({ situacao, className }: { situacao: SituacaoUsuario; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", CLASSE[situacao], className)}>
      {ROTULO_SITUACAO[situacao]}
    </span>
  );
}
