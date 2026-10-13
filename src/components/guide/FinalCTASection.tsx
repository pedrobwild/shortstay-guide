import { Link } from "react-router-dom";
import OrcamentoButton from "@/components/OrcamentoButton";
import SectionBlock from "./SectionBlock";

export default function FinalCTASection() {
  return (
    <SectionBlock id="cta-final" title="Quer saber quanto custa reformar o seu studio?" takeaway="Peça uma proposta para o seu imóvel à equipe Bewild." className="[&_h2]:text-primary-foreground [&_>div>p:first-of-type]:text-primary-foreground/80 [&_>div]:!opacity-100">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <OrcamentoButton local="final" size="lg" className="min-h-[48px] bg-accent text-accent-foreground font-body" />
        <Link to="/signup" className="min-h-[44px] inline-flex items-center text-sm font-body text-primary-foreground underline underline-offset-4">Criar acesso para salvar seus cenários</Link>
      </div>
    </SectionBlock>
  );
}
