import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CabecalhoTela, Container, PaginaEstudo } from "@/components/estudo/Estrutura";
import { useAuth } from "@/hooks/useAuth";
import { ARTIGOS_EXCLUSIVOS, caminhoArtigoExclusivo } from "@/data/artigosExclusivos";
import { linkSimuladorBairro } from "@/data/navegacao";
import { slugifyBairro } from "@/lib/seo";

/**
 * Área exclusiva: o destino de quem entra com conta comum (admin vai para /admin).
 * Por enquanto reúne os artigos de análise de bairro; novos conteúdos entram em
 * src/data/artigosExclusivos.ts. Rota privada (sem indexação e sem medição).
 */
export default function AreaExclusiva() {
  const { user } = useAuth();
  const nome = user?.user_metadata?.full_name?.split(" ")[0] || "";
  return (
    <PaginaEstudo>
      <CabecalhoTela
        rotulo="Área exclusiva · Radar Bewild"
        titulo={nome ? `Olá, ${nome}` : "Sua área exclusiva"}
        lead="Análises de bairro feitas a partir da base do Radar, disponíveis só para quem tem conta. Cada artigo mostra a fonte, o período e o que é hipótese."
      />
      <Container className="pb-12">
        <h2 className="e-rotulo">Análises disponíveis</h2>
        <ul className="m-0 mt-4 list-none divide-y divide-foreground/10 border-y border-foreground p-0">
          {ARTIGOS_EXCLUSIVOS.map((a) => (
            <li key={a.slug} className="grid gap-3 py-7 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12 lg:py-9">
              <p className="e-rotulo lg:pt-2">{a.bairro}</p>
              <article className="min-w-0 max-w-[760px]">
                <h3 className="e-h2 text-balance">
                  <Link to={caminhoArtigoExclusivo(a.slug)} className="hover:text-ciano-700">{a.titulo}</Link>
                </h3>
                <p className="e-apoio mt-3 text-pretty">{a.resumo}</p>
                <p className="e-legenda mt-3">Base aprovada de {a.baseEm} · Leitura de {a.leituraMin} min</p>
                <div className="mt-4 flex flex-wrap gap-x-6">
                  <Link to={caminhoArtigoExclusivo(a.slug)} className="e-link inline-flex min-h-[44px] items-center gap-1.5 font-semibold" aria-label={`Ler a análise: ${a.titulo}`}>
                    Ler a análise<ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link to={linkSimuladorBairro(slugifyBairro(a.bairro))} className="e-link inline-flex min-h-[44px] items-center">Simular {a.bairro}</Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </PaginaEstudo>
  );
}
