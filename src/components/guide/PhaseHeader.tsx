interface PhaseHeaderProps {
  number: number;
  label: string;
  description: string;
}

/** Abertura de cada fase do guia como prancha numerada: régua de 2px, número e título. */
export default function PhaseHeader({ number, label, description }: PhaseHeaderProps) {
  return (
    <div className="pb-2 pt-14 md:pt-20">
      <div className="regua grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-5 pt-5 md:gap-x-8">
        <span className="font-display text-[40px] font-bold leading-none tabular-nums text-accent-text md:text-[56px]" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <p className="rotulo-secao mb-1">Fase {number} de 4</p>
          <h2 className="mb-1 font-display text-[26px] font-bold leading-[1.15] text-foreground text-balance md:text-[32px]">{label}</h2>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
