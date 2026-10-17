import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

/**
 * Controle segmentado (trilho cinza, opção ativa branca com sombra), sobre o
 * ToggleGroup do shadcn/Radix: navegação por setas e seleção única que não
 * pode ficar vazia.
 */
export default function Segmentado<T extends string>({
  valor,
  opcoes,
  onChange,
  rotulo,
  className,
  itemClassName,
}: {
  valor: T;
  opcoes: readonly { valor: T; rotulo: string }[];
  onChange: (valor: T) => void;
  /** Nome do grupo para leitores de tela. */
  rotulo: string;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={valor}
      onValueChange={(v) => { if (v) onChange(v as T); }}
      aria-label={rotulo}
      className={cn("flex rounded-[9px] bg-secondary p-[3px]", className)}
    >
      {opcoes.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.valor}
          value={o.valor}
          className={cn(
            // 38px visíveis + 3px acima e abaixo de área de toque (dentro do trilho) = 44px.
            "relative inline-flex min-h-[38px] flex-1 items-center justify-center whitespace-nowrap rounded-[7px] px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:inset-x-0 after:-inset-y-[3px] after:content-['']",
            "data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-segmented",
            itemClassName,
          )}
        >
          {o.rotulo}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
