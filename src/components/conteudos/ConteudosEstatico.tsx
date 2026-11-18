import ConteudoArtigo from "@/components/conteudos/ConteudoArtigo";
import { CAMINHO_CONTEUDOS, CAMINHO_FEED, TIPOS_CONTEUDO, TIPOS_CONTEUDO_LISTA, caminhoConteudo, caminhoTipo, dataExtenso, ordenarConteudos, type ConteudoRadar } from "@/lib/conteudosRadar";

/**
 * HTML estático dos conteúdos (pré-renderização, scripts/prerender.mjs): o texto completo e
 * os links já no HTML para robôs e leitores sem JavaScript. O app substitui ao abrir.
 */
export function ConteudoEstatico({ c, relacionados }: { c: ConteudoRadar; relacionados: ConteudoRadar[] }) {
  return (
    <main>
      <ConteudoArtigo c={c} relacionados={relacionados} />
    </main>
  );
}

export function IndiceConteudosEstatico({ h1, descricao, lista }: { h1: string; descricao: string; lista: ConteudoRadar[] }) {
  const tiposComTexto = TIPOS_CONTEUDO_LISTA.filter((t) => lista.some((c) => c.tipo === t));
  return (
    <main>
      <h1>{h1}</h1>
      <p>{descricao}</p>
      <p>
        <a href={CAMINHO_CONTEUDOS}>Todos os conteúdos</a>
        {tiposComTexto.map((t) => <span key={t}> · <a href={caminhoTipo(t)}>{TIPOS_CONTEUDO[t].plural}</a></span>)}
        {" · "}<a href={CAMINHO_FEED}>Feed RSS</a>
      </p>
      <ul>
        {ordenarConteudos(lista).map((c) => (
          <li key={c.slug}>
            <article>
              <h2><a href={caminhoConteudo(c.slug)}>{c.titulo}</a></h2>
              <p>{TIPOS_CONTEUDO[c.tipo].rotulo}{c.publicado_em ? <> · <time dateTime={c.publicado_em}>{dataExtenso(c.publicado_em)}</time></> : null}</p>
              <p>{c.resumo}</p>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
