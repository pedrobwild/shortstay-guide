import {
  AVISO_CATALOGO, caminhoEmpreendimento, itensFicha, NOTA_SELO_BEWILD, ordenarEmpreendimentos, textoFonte, textosBairroNoRadar,
  TEXTO_SELO_BEWILD, type Empreendimento,
} from "@/lib/empreendimentos";
import { naturezaBairro, type BairroBase } from "@/lib/radarUi";
import { slugifyBairro } from "@/lib/seo";

/**
 * HTML estático do catálogo e das páginas de prédio (pré-renderização, scripts/prerender.mjs):
 * conteúdo e links já no HTML para robôs e leitores sem JavaScript. O app substitui ao abrir.
 * Sem números de bairro aqui: o link leva à página do bairro, que tem os números com a fonte.
 */
export function CatalogoEmpreendimentosEstatico({ h1, descricao, lista }: { h1: string; descricao: string; lista: Empreendimento[] }) {
  return (
    <main>
      <h1>{h1}</h1>
      <p>{descricao}</p>
      <p>{AVISO_CATALOGO}</p>
      <ul>
        {ordenarEmpreendimentos(lista).map((e) => (
          <li key={e.slug}><a href={caminhoEmpreendimento(e.slug)}>{e.nome}</a> — {e.bairro}</li>
        ))}
      </ul>
    </main>
  );
}

export function EmpreendimentoEstatico({ e, naBase }: { e: Empreendimento; naBase: BairroBase | null }) {
  const fonte = textoFonte(e);
  const textos = textosBairroNoRadar(naBase?.name ?? e.bairro, naBase ? naturezaBairro(naBase) : null);
  return (
    <main>
      <p><a href="/empreendimentos">Empreendimentos</a></p>
      <h1>{e.nome}</h1>
      {e.resumo && <p>{e.resumo}</p>}
      {e.selo_bewild && <p>{TEXTO_SELO_BEWILD}. {NOTA_SELO_BEWILD}</p>}
      <dl>
        {itensFicha(e).map((i) => (
          <div key={i.rotulo}><dt>{i.rotulo}</dt><dd>{i.valor}</dd></div>
        ))}
      </dl>
      {e.diferenciais.length > 0 && (
        <section>
          <h2>O que o prédio oferece</h2>
          <ul>{e.diferenciais.map((d) => <li key={d}>{d}</li>)}</ul>
          {fonte && e.fonte_url && <p>Conforme {fonte}. <a href={e.fonte_url} rel="noopener noreferrer">Abrir a fonte</a></p>}
        </section>
      )}
      <section>
        <h2>{textos.titulo}</h2>
        {naBase ? (
          <p>
            {textos.aproximacao ? `${textos.aproximacao} ` : ""}
            <a href={`/bairro/${slugifyBairro(naBase.name)}`}>Ver {naBase.name} no Radar</a>
          </p>
        ) : (
          <p>{textos.foraDaBase} <a href="/ranking">Ver os bairros com dados no Radar</a></p>
        )}
      </section>
    </main>
  );
}
