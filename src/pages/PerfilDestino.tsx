import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CabecalhoTela, Container, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import FerramentaReformar from "@/components/ferramentas/FerramentaReformar";
import FerramentaOperar from "@/components/ferramentas/FerramentaOperar";
import AvisoBase from "@/components/radar/AvisoBase";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { perfilDoMomento } from "@/data/perfisRadar";
import { ROTULO_ESTUDO_REFORMA } from "@/data/provasBewild";
import type { BairroCurado } from "@/data/bairrosCurados";

type Etapa = "reformar" | "tenho";

/** Conteúdo compartilhado com o HTML inicial, sem depender de consultas no servidor. */
export function ConteudoPerfil({ etapa, bairros, aviso }: { etapa: Etapa; bairros: BairroCurado[]; aviso?: React.ReactNode }) {
  const perfil = perfilDoMomento(etapa);
  if (!perfil) return null;
  const reforma = etapa === "reformar";
  return (
    <PaginaEstudo>
      <CabecalhoTela
        rotulo={`${perfil.numero} · ${perfil.rotulo}`}
        titulo={reforma ? "Planeje a reforma do seu studio" : "Acompanhe a operação do seu studio"}
        lead={reforma
          ? `Custo, escopo e prazo: uma referência do ${ROTULO_ESTUDO_REFORMA} da Bewild para planejar o imóvel que você já tem.`
          : "Compare seus resultados com os dados do bairro e avalie o que sobra depois dos custos, sem tratar receita de referência como garantia."}
      >
        <nav aria-label="Etapas do investidor" className="flex flex-wrap gap-3 border-t border-foreground pt-4">
          <Button asChild variant="outline"><Link to="/ferramentas">Vou comprar</Link></Button>
          <Button asChild variant={reforma ? "default" : "outline"}><Link to="/reformar" aria-current={reforma ? "page" : undefined}>Vou reformar</Link></Button>
          <Button asChild variant={!reforma ? "default" : "outline"}><Link to="/operar" aria-current={!reforma ? "page" : undefined}>Já opero</Link></Button>
        </nav>
      </CabecalhoTela>
      {aviso && <Container>{aviso}</Container>}
      <Secao
        id={reforma ? "reformar" : "operar"}
        rotulo={reforma ? "Estimativa de reforma" : "Meu studio contra o bairro"}
        titulo={reforma ? "Estime custo e prazo pela área do imóvel" : "Compare sua diária e ocupação com o bairro"}
        lead={reforma
          ? "A faixa vem do estudo de reforma completa da Bewild. É uma estimativa, não um orçamento do seu projeto."
          : "Use médias do seu extrato para comparar períodos equivalentes. A referência do bairro traz fonte, período e amostra."}
      >
        {reforma ? <FerramentaReformar /> : bairros.length ? <FerramentaOperar bairros={bairros} /> : <p className="e-apoio">Nenhum bairro disponível para comparação.</p>}
      </Secao>
      <Secao id="aprofundar" rotulo="Próximos passos" titulo={reforma ? "Decisões para preparar o studio" : "Da receita ao resultado líquido"}>
        <ul className="divide-y divide-border border-y border-border">
          {perfil.ferramentas.slice(1).map((f) => (
            <li key={f.to}>
              <Link to={f.to} className="e-link flex min-h-[44px] items-center justify-between gap-4 py-4">
                {f.rotulo}<ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
              </Link>
            </li>
          ))}
          {reforma && <li><Link to="/guia/reforma" className="e-link flex min-h-[44px] items-center justify-between gap-4 py-4">Planejamento da reforma<ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" /></Link></li>}
        </ul>
      </Secao>
    </PaginaEstudo>
  );
}

function PerfilComBase({ etapa }: { etapa: Etapa }) {
  const { bairros, offline, recarregar } = useBaseEstudo();
  return <ConteudoPerfil etapa={etapa} bairros={bairros} aviso={etapa === "tenho" && offline ? <AvisoBase tom="aviso" onTentar={recarregar}>A base não respondeu agora. A comparação usa a reserva aprovada do Radar.</AvisoBase> : undefined} />;
}

export default function PerfilDestino({ etapa }: { etapa: Etapa }) {
  return <BairroProvider><PerfilComBase etapa={etapa} /></BairroProvider>;
}