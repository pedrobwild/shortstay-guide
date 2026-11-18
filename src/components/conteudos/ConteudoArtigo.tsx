import CorpoConteudo from "@/components/conteudos/CorpoConteudo";
import { DESTINOS_NOTICIAS } from "@/lib/noticiasRadar";
import {
  CAMINHO_CONTEUDOS, TIPOS_CONTEUDO, caminhoConteudo, caminhoTipo, dataExtenso, foiAtualizado, tempoLeituraMin,
  type ConteudoRadar, type ItemLista,
} from "@/lib/conteudosRadar";

/**
 * Página de um texto (artigo, release ou estudo): trilha, tipo e datas, título, resumo,
 * autor, capa, corpo e a ponte para os dados do Radar. Componente puro, com links <a>
 * comuns: o mesmo HTML é usado no app (src/pages/ConteudoDetalhe.tsx) e no HTML estático
 * do build (src/components/conteudos/ConteudosEstatico.tsx).
 */
export const AUTOR_PADRAO = "Bewild";

export function CabecalhoConteudo({ c }: { c: ConteudoRadar }) {
  const tipo = TIPOS_CONTEUDO[c.tipo];
  return (
    <header className="pb-6 pt-6 lg:pb-10 lg:pt-10">
      <nav aria-label="Caminho" className="e-legenda flex min-h-[44px] flex-wrap items-center gap-x-2 gap-y-1">
        <a href="/" className="inline-flex min-h-[44px] items-center hover:text-foreground">Início</a>
        <span aria-hidden="true">›</span>
        <a href={CAMINHO_CONTEUDOS} className="inline-flex min-h-[44px] items-center hover:text-foreground">Conteúdos</a>
        <span aria-hidden="true">›</span>
        <a href={caminhoTipo(c.tipo)} className="inline-flex min-h-[44px] items-center hover:text-foreground">{tipo.plural}</a>
      </nav>
      <p className="e-rotulo mb-3 mt-3">{tipo.rotulo}</p>
      <h1 className="e-h1 max-w-[880px] text-balance">{c.titulo}</h1>
      <p className="e-lead mt-4 max-w-[720px] text-pretty lg:mt-5">{c.resumo}</p>
      <p className="e-legenda mt-5 flex flex-wrap gap-x-4 gap-y-1">
        <span>Por {c.autor_nome || AUTOR_PADRAO}</span>
        {c.publicado_em && <span>Publicado em <time dateTime={c.publicado_em}>{dataExtenso(c.publicado_em)}</time></span>}
        {foiAtualizado(c) && <span>Atualizado em <time dateTime={c.atualizado_em}>{dataExtenso(c.atualizado_em)}</time></span>}
        <span>Leitura de {tempoLeituraMin(c.corpo)} min</span>
      </p>
    </header>
  );
}

/** Capa com proporção fixa (16:9) para o texto não saltar quando a imagem carrega. */
export function CapaConteudo({ c }: { c: Pick<ConteudoRadar, "capa_url" | "capa_alt"> }) {
  if (!c.capa_url || !c.capa_alt) return null;
  return (
    <figure className="mb-8 max-w-[880px]">
      <img src={c.capa_url} alt={c.capa_alt} width={1600} height={900} decoding="async" fetchPriority="high" className="aspect-video h-auto w-full rounded-sm bg-muted object-cover" />
    </figure>
  );
}

/** Ponte para a página de dados relacionada ao texto (campo "Página do Radar" do cadastro). */
export function DadosRelacionados({ destino }: { destino: string }) {
  const pagina = DESTINOS_NOTICIAS.find((d) => d.caminho === destino);
  if (!pagina) return null;
  return (
    <aside aria-label="Dados relacionados" className="mt-12 max-w-[720px] border-t border-border pt-6">
      <h2 className="e-h3">Dados relacionados no Radar</h2>
      <p className="e-apoio mt-2">Os números citados neste texto têm fonte e período na página de dados.</p>
      <p className="mt-3"><a href={pagina.caminho} className="e-link inline-flex min-h-[44px] items-center">{pagina.nome}</a></p>
    </aside>
  );
}

export function LeiaTambem({ itens }: { itens: Pick<ItemLista, "id" | "slug" | "titulo" | "resumo">[] }) {
  const comPagina = itens.filter((i) => i.slug);
  if (!comPagina.length) return null;
  return (
    <aside aria-label="Leia também" className="mt-12 max-w-[720px] border-t border-border pt-6">
      <h2 className="e-h3">Leia também</h2>
      <ul className="mt-3 divide-y divide-border">
        {comPagina.map((i) => (
          <li key={i.id} className="py-3">
            <a href={caminhoConteudo(i.slug as string)} className="e-link inline-flex min-h-[44px] items-center font-medium">{i.titulo}</a>
            {i.resumo && <p className="e-apoio">{i.resumo}</p>}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function ConteudoArtigo({ c, relacionados = [] }: { c: ConteudoRadar; relacionados?: Pick<ItemLista, "id" | "slug" | "titulo" | "resumo">[] }) {
  return (
    <article className="pb-8">
      <CabecalhoConteudo c={c} />
      <CapaConteudo c={c} />
      <CorpoConteudo corpo={c.corpo} />
      <DadosRelacionados destino={c.destino} />
      <LeiaTambem itens={relacionados} />
    </article>
  );
}
