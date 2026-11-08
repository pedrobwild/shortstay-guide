import { Link } from "react-router-dom";
import OrcamentoButton from "@/components/OrcamentoButton";
import { cn } from "@/lib/utils";
import NovaAba from "@/components/NovaAba";

/** Rodapé das telas públicas do Radar: "Um produto Bewild", privacidade, ferramentas e o aviso de não garantia. */
export default function RodapeRadar({ className }: { className?: string }) {
  return (
    <footer className={cn("mx-auto w-full max-w-[1280px] px-5 pb-12 pt-8 font-body text-[13px] text-muted-foreground lg:px-10", className)}>
      <div className="flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="space-y-1">
          <p>© 2026 Bewild · Radar Bewild — São Paulo</p>
          <p>Um produto <a href="https://bewild.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Bewild<NovaAba /></a></p>
          <nav aria-label="Rodapé" className="flex flex-wrap items-center gap-x-4">
            <Link to="/ferramentas" className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-2">Comprar imóvel</Link>
            <Link to="/empreendimentos" className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-2">Empreendimentos</Link>
            <Link to="/metodologia" className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-2">Metodologia e dados abertos</Link>
            <a href="https://bewild.com.br/privacidade" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-primary underline underline-offset-2">Política de privacidade<NovaAba /></a>
            <OrcamentoButton local="rodape" variant="link" className="min-h-[44px] px-0 text-[13px]" />
          </nav>
        </div>
        <p className="max-w-[460px] md:text-right">Receita de referência e simulações não incluem todos os custos e não são garantia de resultado.</p>
      </div>
    </footer>
  );
}
