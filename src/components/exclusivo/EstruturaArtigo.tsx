import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/estudo/Estrutura";
import { Button } from "@/components/ui/button";
import OrcamentoButton from "@/components/OrcamentoButton";
import NovaAba from "@/components/NovaAba";
import { CAMINHO_AREA_EXCLUSIVA, type ArtigoExclusivo } from "@/data/artigosExclusivos";
import { cn } from "@/lib/utils";

/**
 * Estrutura de leitura dos artigos da área exclusiva (Estudo aberto): coluna de texto
 * de ~720px, figuras e tabelas que podem chegar a 880px, títulos que afirmam o achado.
 */

export function CabecalhoArtigo({ artigo, rotulo, lead, children }: { artigo: ArtigoExclusivo; rotulo: string; lead: ReactNode; children?: ReactNode }) {
  return (
    <Container className="pb-8 pt-6 lg:pb-12">
      <nav aria-label="Caminho" className="flex min-h-[44px] flex-wrap items-center gap-1.5 text-xs text-tinta-70">
        <Link to={CAMINHO_AREA_EXCLUSIVA} className="inline-flex min-h-[44px] items-center hover:text-foreground">Área exclusiva</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-foreground">{artigo.bairro}</span>
      </nav>
      <p className="e-rotulo mb-4 mt-4">{rotulo}</p>
      <h1 className="e-h1 max-w-[880px] text-balance">{artigo.titulo}</h1>
      <p className="e-lead mt-4 max-w-[720px] text-pretty lg:mt-5">{lead}</p>
      <p className="e-legenda mt-5 flex flex-wrap gap-x-4 gap-y-1">
        <span>Bewild</span>
        <span>Base aprovada de {artigo.baseEm}</span>
        <span>Leitura de {artigo.leituraMin} min</span>
      </p>
      {children && <div className="mt-8">{children}</div>}
    </Container>
  );
}

/** Corpo do artigo: coluna de leitura dentro do container do Estudo aberto. */
export function CorpoArtigo({ children }: { children: ReactNode }) {
  return (
    <Container>
      <article className="max-w-[880px] pb-8">{children}</article>
    </Container>
  );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("e-corpo mt-4 max-w-[720px] text-pretty", className)}>{children}</p>;
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return <h2 id={id} className="e-h2 mt-14 max-w-[720px] scroll-mt-20 text-balance lg:mt-16">{children}</h2>;
}

/** Frase-síntese da seção, com o fio magenta à esquerda. */
export function Destaque({ children }: { children: ReactNode }) {
  return <p className="e-lead my-8 max-w-[720px] border-l-[3px] border-magenta pl-4 text-foreground">{children}</p>;
}

/** Bloco de figura ou tabela com o espaço do Estudo aberto. */
export function Bloco({ children }: { children: ReactNode }) {
  return <div className="my-10 min-w-0 border-t border-foreground pt-5 lg:my-12">{children}</div>;
}

/** Lista numerada de verificação: a ordem é a sequência sugerida da decisão. */
export function Passos({ itens }: { itens: { titulo: string; texto: ReactNode }[] }) {
  return (
    <ol className="m-0 mt-6 grid max-w-[720px] list-none gap-5 p-0">
      {itens.map((i, n) => (
        <li key={i.titulo} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-ciano-700 text-[13px] font-semibold text-ciano-700 tabular-nums">{n + 1}</span>
          <p className="e-corpo m-0"><strong className="font-semibold">{i.titulo}</strong> {i.texto}</p>
        </li>
      ))}
    </ol>
  );
}

/** Link interno do Radar no corpo do texto. */
export function LinkRadar({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="e-link">{children}</Link>;
}

/** Link externo (bewild.com.br ou fonte) no corpo do texto, com aviso de nova aba. */
export function LinkExterno({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="e-link">{children}<NovaAba /></a>;
}

/** Fechamento do artigo: a ação principal é simular o bairro; o orçamento segue o controle central de CTAs. */
export function ChamadaFinal({ titulo, texto, simularHref, simularRotulo }: { titulo: string; texto: ReactNode; simularHref: string; simularRotulo: string }) {
  return (
    <section aria-labelledby="chamada-final" className="mt-16 max-w-[880px] border-y border-foreground py-8">
      <h2 id="chamada-final" className="e-h2">{titulo}</h2>
      <p className="e-apoio mt-3 max-w-[720px]">{texto}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="min-h-[44px] px-[18px] font-semibold"><Link to={simularHref}>{simularRotulo}</Link></Button>
        <OrcamentoButton local="area-exclusiva" variant="outline" className="min-h-[44px] px-[18px] font-semibold" />
      </div>
    </section>
  );
}

/** Fontes e método no fim do artigo. */
export function FontesMetodo({ itens }: { itens: ReactNode[] }) {
  return (
    <section aria-labelledby="fontes-metodo" className="mt-12 max-w-[720px]">
      <h2 id="fontes-metodo" className="e-rotulo">Fontes e método</h2>
      <ul className="e-apoio m-0 mt-3 grid list-disc gap-2 pl-5">
        {itens.map((i, n) => <li key={n}>{i}</li>)}
      </ul>
    </section>
  );
}
