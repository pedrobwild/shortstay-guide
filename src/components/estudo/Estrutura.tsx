import type { ReactNode } from "react";
import AppNavbar from "@/components/AppNavbar";
import PassosEstudo from "@/components/estudo/PassosEstudo";
import RodapeRadar from "@/components/RodapeRadar";
import { BotaoRecolhivel, classeConteudoRecolhivel, useRecolhivel } from "@/components/estudo/Recolhivel";
import { cn } from "@/lib/utils";

/**
 * Estrutura das telas do "Estudo aberto" (direção 2a, out/2026): largura de 1280px
 * com margens de 72px no desktop (16px no celular), seções separadas por espaço
 * (80–96px) e uma coluna lateral de rótulos de 200px. A hierarquia vem do espaço,
 * não de caixas.
 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-[72px]", className)}>{children}</div>;
}

/** Tela pública completa: navbar, conteúdo em <main id="conteudo"> (skip link) e rodapé. */
export function PaginaEstudo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <AppNavbar fixo={false} />
      <PassosEstudo />
      <main id="conteudo" tabIndex={-1} className={cn("pb-8 outline-none", className)}>
        {children}
      </main>
      <RodapeRadar />
    </div>
  );
}

/**
 * Cabeçalho de tela: rótulo, H1 (46/54; 54/62 na home), lead em tinta a 78% e,
 * abaixo, os metadados ou controles da tela.
 */
export function CabecalhoTela({
  rotulo,
  titulo,
  lead,
  children,
  home = false,
  acao,
}: {
  rotulo: ReactNode;
  titulo: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  home?: boolean;
  /** Ao lado do título no desktop (ex.: seletor de bairro). */
  acao?: ReactNode;
}) {
  return (
    <Container className="pb-8 pt-6 sm:pb-10 sm:pt-10 lg:pb-14 lg:pt-16">
      <p className="e-rotulo mb-3 sm:mb-4">{rotulo}</p>
      <div className={cn("flex flex-col gap-6", acao && "lg:flex-row lg:items-end lg:justify-between")}>
        <div className="min-w-0 max-w-[880px]">
          <h1 className={cn(home ? "e-h1-home" : "e-h1", "text-balance")}>{titulo}</h1>
          {lead && <p className="e-lead mt-4 max-w-[720px] text-pretty lg:mt-5">{lead}</p>}
        </div>
        {acao && <div className="min-w-0 lg:w-[320px] lg:shrink-0">{acao}</div>}
      </div>
      {children && <div className="mt-8 lg:mt-10">{children}</div>}
    </Container>
  );
}

/**
 * Seção com a coluna lateral de rótulo (200px + 1fr, 48px de espaço). No celular
 * o rótulo fica acima do conteúdo. `titulo` é o H2: um achado ou uma ação.
 * Com `recolhida` (precisa de `id` e rótulo de texto), a seção vira uma linha que abre
 * com um toque no celular e segue aberta no desktop (ver Recolhivel.tsx).
 */
export function Secao(props: PropsSecao) {
  return props.recolhida && props.id && typeof props.rotulo === "string"
    ? <SecaoRecolhida {...props} id={props.id} rotulo={props.rotulo} />
    : <SecaoAberta {...props} />;
}

interface PropsSecao {
  id?: string;
  rotulo: ReactNode;
  titulo?: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Recolhe a seção no celular; no desktop nada muda. */
  recolhida?: boolean;
  /** Linha de apoio sob o rótulo enquanto a seção está recolhida. */
  resumo?: string;
  /** Chamado quando a seção recolhida abre (para abrir junto um controle interno). */
  aoAbrir?: () => void;
}

function CorpoSecao({ idTitulo, titulo, lead, children }: Pick<PropsSecao, "titulo" | "lead" | "children"> & { idTitulo?: string }) {
  return (
    <>
      {titulo && <h2 id={idTitulo} className="e-h2 max-w-[820px] text-balance">{titulo}</h2>}
      {lead && <p className="e-apoio mt-3 max-w-[720px] text-pretty">{lead}</p>}
      {(titulo || lead) && children ? <div className="mt-8">{children}</div> : children}
    </>
  );
}

function SecaoAberta({ id, rotulo, titulo, lead, children, className }: PropsSecao) {
  const idTitulo = id ? `${id}-titulo` : undefined;
  return (
    <section id={id} data-indice={id && typeof rotulo === "string" ? rotulo : undefined} aria-labelledby={titulo ? idTitulo : undefined} className={cn("scroll-mt-20 py-10 lg:py-12", className)}>
      <Container className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          <p className="e-rotulo lg:pt-2">{rotulo}</p>
        </div>
        <div className="min-w-0">
          <CorpoSecao idTitulo={idTitulo} titulo={titulo} lead={lead}>{children}</CorpoSecao>
        </div>
      </Container>
    </section>
  );
}

function SecaoRecolhida({ id, rotulo, titulo, lead, children, className, resumo, aoAbrir }: PropsSecao & { id: string; rotulo: string }) {
  const { aberto, alternar, ref } = useRecolhivel(id, aoAbrir);
  const idTitulo = `${id}-titulo`;
  return (
    <section ref={ref} id={id} data-indice={rotulo} data-recolhida="" aria-label={rotulo} className={cn("scroll-mt-20 lg:py-12", className)}>
      <Container className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0 border-t border-border lg:border-0">
          <BotaoRecolhivel id={id} rotulo={rotulo} resumo={resumo} aberto={aberto} alternar={alternar} />
          <p className="e-rotulo hidden lg:block lg:pt-2">{rotulo}</p>
        </div>
        <div id={`${id}-conteudo`} className={cn("min-w-0 pb-10 pt-2 lg:p-0", classeConteudoRecolhivel(aberto))}>
          <CorpoSecao idTitulo={idTitulo} titulo={titulo} lead={lead}>{children}</CorpoSecao>
        </div>
      </Container>
    </section>
  );
}

/** Espaço vertical entre blocos de seções (80–96px), sem linha. */
export function Respiro() {
  return <div aria-hidden="true" className="h-8 lg:h-12" />;
}
