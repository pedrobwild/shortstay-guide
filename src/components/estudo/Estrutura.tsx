import { createContext, useContext, type ReactNode } from "react";
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

/** Seções dentro de `ColunasComPainel`: no desktop, rótulo acima do título e sem margens próprias. */
const CtxColuna = createContext(false);
/** Seções recolhidas dentro de `GrupoCartoes`: no desktop viram cartões que abrem no lugar. */
const CtxCartoes = createContext(false);

/**
 * Desktop (decisão do Pedro, 17/11/2026): conteúdo à esquerda e um painel de 320px à direita
 * que acompanha a rolagem, para o próximo passo ficar sempre à vista. Abaixo de 1024px o
 * painel não aparece e as seções seguem como sempre.
 */
export function ColunasComPainel({ painel, rotuloPainel, children }: { painel: ReactNode; rotuloPainel: string; children: ReactNode }) {
  return (
    <Container className="px-0 sm:px-0 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14">
      <CtxColuna.Provider value={true}>
        <div className="min-w-0">{children}</div>
      </CtxColuna.Provider>
      <aside aria-label={rotuloPainel} className="hidden lg:sticky lg:top-6 lg:block">{painel}</aside>
    </Container>
  );
}

/**
 * Grupo de seções recolhidas que, no desktop, ficam lado a lado como cartões e abrem no
 * lugar (o cartão aberto ocupa a linha inteira). No celular continuam sendo as linhas de toque.
 */
export function GrupoCartoes({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  const emColuna = useContext(CtxColuna);
  const cartoes = <div className="lg:flex lg:flex-wrap lg:items-start lg:gap-4">{children}</div>;
  return (
    <CtxCartoes.Provider value={true}>
      <div className="lg:py-12">
        {emColuna ? (
          <>
            <p className="e-rotulo mb-4 hidden lg:block">{rotulo}</p>
            {cartoes}
          </>
        ) : (
          <Container className="px-0 sm:px-0 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
            <p className="e-rotulo hidden lg:block lg:pt-2">{rotulo}</p>
            {cartoes}
          </Container>
        )}
      </div>
    </CtxCartoes.Provider>
  );
}

/**
 * Seção com a coluna lateral de rótulo (200px + 1fr, 48px de espaço). No celular
 * o rótulo fica acima do conteúdo. `titulo` é o H2: um achado ou uma ação.
 * Com `recolhida` (precisa de `id` e rótulo de texto), a seção vira uma linha que abre
 * com um toque no celular e segue aberta no desktop (ver Recolhivel.tsx); dentro de
 * `GrupoCartoes`, no desktop ela é um cartão que abre no lugar.
 */
export function Secao(props: PropsSecao) {
  const emCartoes = useContext(CtxCartoes);
  if (!(props.recolhida && props.id && typeof props.rotulo === "string")) return <SecaoAberta {...props} />;
  return emCartoes
    ? <SecaoCartao {...props} id={props.id} rotulo={props.rotulo} />
    : <SecaoRecolhida {...props} id={props.id} rotulo={props.rotulo} />;
}

interface PropsSecao {
  id?: string;
  rotulo: ReactNode;
  titulo?: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Recolhe a seção no celular; no desktop nada muda (fora de `GrupoCartoes`). */
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
  const emColuna = useContext(CtxColuna);
  const idTitulo = id ? `${id}-titulo` : undefined;
  return (
    <section id={id} data-indice={id && typeof rotulo === "string" ? rotulo : undefined} aria-labelledby={titulo ? idTitulo : undefined} className={cn("scroll-mt-20 py-10", emColuna ? "lg:py-10" : "lg:py-12", className)}>
      <Container className={cn("grid gap-4", emColuna ? "lg:px-0" : "lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12")}>
        <div className="min-w-0">
          <p className={cn("e-rotulo", !emColuna && "lg:pt-2")}>{rotulo}</p>
        </div>
        <div className="min-w-0">
          <CorpoSecao idTitulo={idTitulo} titulo={titulo} lead={lead}>{children}</CorpoSecao>
        </div>
      </Container>
    </section>
  );
}

function SecaoRecolhida({ id, rotulo, titulo, lead, children, className, resumo, aoAbrir }: PropsSecao & { id: string; rotulo: string }) {
  const emColuna = useContext(CtxColuna);
  const { aberto, alternar, ref } = useRecolhivel(id, aoAbrir);
  const idTitulo = `${id}-titulo`;
  return (
    <section ref={ref} id={id} data-indice={rotulo} data-recolhida="" aria-label={rotulo} className={cn("scroll-mt-20", emColuna ? "lg:py-10" : "lg:py-12", className)}>
      <Container className={emColuna ? "lg:px-0" : "lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12"}>
        <div className="min-w-0 border-t border-border lg:border-0">
          <BotaoRecolhivel id={id} rotulo={rotulo} resumo={resumo} aberto={aberto} alternar={alternar} />
          <p className={cn("e-rotulo hidden lg:block", emColuna ? "lg:mb-4" : "lg:pt-2")}>{rotulo}</p>
        </div>
        <div id={`${id}-conteudo`} className={cn("min-w-0 pb-10 pt-2 lg:p-0", classeConteudoRecolhivel(aberto))}>
          <CorpoSecao idTitulo={idTitulo} titulo={titulo} lead={lead}>{children}</CorpoSecao>
        </div>
      </Container>
    </section>
  );
}

/** Seção recolhida dentro de `GrupoCartoes`: linha de toque no celular, cartão que abre no lugar no desktop. */
function SecaoCartao({ id, rotulo, titulo, lead, children, className, resumo, aoAbrir }: PropsSecao & { id: string; rotulo: string }) {
  const { aberto, alternar, ref } = useRecolhivel(id, aoAbrir);
  const idTitulo = `${id}-titulo`;
  return (
    <section
      ref={ref}
      id={id}
      data-indice={rotulo}
      data-recolhida=""
      aria-label={rotulo}
      className={cn("scroll-mt-20 lg:min-w-[220px] lg:rounded-lg lg:border lg:border-border", aberto ? "lg:basis-full" : "lg:flex-1 lg:basis-0", className)}
    >
      <div className="px-4 sm:px-6 lg:px-5 lg:py-1">
        <div className="border-t border-border lg:border-0">
          <BotaoRecolhivel id={id} rotulo={rotulo} resumo={resumo} aberto={aberto} alternar={alternar} noDesktop />
        </div>
        <div id={`${id}-conteudo`} className={cn("min-w-0 pb-10 pt-2 lg:pb-6", "e-recolhe", !aberto && "hidden")}>
          <CorpoSecao idTitulo={idTitulo} titulo={titulo} lead={lead}>{children}</CorpoSecao>
        </div>
      </div>
    </section>
  );
}

/** Espaço vertical entre blocos de seções (80–96px), sem linha. */
export function Respiro() {
  return <div aria-hidden="true" className="h-8 lg:h-12" />;
}
