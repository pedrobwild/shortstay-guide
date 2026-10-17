// Conteúdo estático das páginas de dados (/ranking, /mercado, /bairro/*) para a
// pré-renderização: robôs que não executam JavaScript leem os números com fonte,
// período e data da coleta. Usa a base aprovada (reserva offline); ao abrir no
// navegador o app substitui este HTML e lê os dados atuais do banco.
import { bairrosReserva, rotuloFonteRadar, notaFontesComplementares, type BairroRadar } from "@/lib/radarBase";
import { FONTE_BAIRROS_CURADOS, receitaMensalReferencia } from "@/data/bairrosCurados";
import { bairroPath, slugifyBairro } from "@/lib/seo";
import { ancoraReformaBairro, reformaBairroUrl, ARTIGOS_BEWILD } from "@/data/artigosBewild";
import { rotuloReferenciaBewild } from "@/lib/radarBase";

const n = new Intl.NumberFormat("pt-BR");
const brl = (v: number) => `R$ ${n.format(Math.round(v))}`;
const AVISO_RECEITA = "Receita de referência = diária × 30 × ocupação. É receita bruta, não lucro: não desconta limpeza, gestão, impostos, condomínio nem outras despesas.";

function Fonte({ b }: { b: BairroRadar }) {
  return b.sourceUrl ? <a href={b.sourceUrl} rel="noopener">{rotuloFonteRadar(b)}</a> : <span>{rotuloFonteRadar(b)}</span>;
}

export function TabelaBairrosEstatica({ h1, descricao }: { h1: string; descricao: string }) {
  const bairros = bairrosReserva();
  return (
    <main>
      <h1>{h1}</h1>
      <p>{descricao}</p>
      <table>
        <thead><tr><th>Bairro</th><th>Diária média</th><th>Ocupação</th><th>Quartis da diária (p25 / mediana / p75)</th><th>Anúncios na amostra</th><th>Receita de referência/mês</th><th>Fonte</th></tr></thead>
        <tbody>
          {bairros.map((b) => (
            <tr key={b.name}>
              <td><a href={bairroPath(b.name)}>{b.name}</a></td>
              <td>{brl(b.dailyAvg)}</td>
              <td>{n.format(b.avgOccupancy)}%</td>
              <td>{b.dailyQuartiles ? b.dailyQuartiles.map(brl).join(" / ") : "sem quartis publicados"}</td>
              <td>{b.amostraN != null ? n.format(b.amostraN) : "sem amostra por bairro"}</td>
              <td>{brl(receitaMensalReferencia(b))}</td>
              <td><Fonte b={b} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{FONTE_BAIRROS_CURADOS} {notaFontesComplementares(bairros)}</p>
      <p>{AVISO_RECEITA}</p>
      <p>Quer a análise bairro a bairro? Leia <a href={ARTIGOS_BEWILD.melhoresBairros.url}>{ARTIGOS_BEWILD.melhoresBairros.titulo}</a></p>
    </main>
  );
}

export function BairroEstatico({ nome, h1, descricao }: { nome: string; h1: string; descricao: string }) {
  const b = bairrosReserva().find((x) => slugifyBairro(x.name) === slugifyBairro(nome));
  return (
    <main>
      <h1>{h1}</h1>
      <p>{descricao}</p>
      {b ? (
        <>
          <ul>
            <li>Diária média: {brl(b.dailyAvg)}</li>
            <li>Ocupação: {n.format(b.avgOccupancy)}%</li>
            {b.dailyQuartiles && <li>Quartis da diária: p25 {brl(b.dailyQuartiles[0])} · mediana {brl(b.dailyQuartiles[1])} · p75 {brl(b.dailyQuartiles[2])}</li>}
            <li>Amostra: {b.amostraN != null ? `${n.format(b.amostraN)} anúncios ativos` : "sem contagem de anúncios por bairro"}</li>
            <li>Período: {b.period ?? "sem período publicado"}</li>
            <li>Receita de referência: {brl(receitaMensalReferencia(b))}/mês</li>
          </ul>
          <p>Fonte: <Fonte b={b} /></p>
          {b.referenciaBewild && <p>{rotuloReferenciaBewild(b.referenciaBewild)}</p>}
          <p>{AVISO_RECEITA}</p>
        </>
      ) : (
        <p>Ainda não há dado público de diária e ocupação para {nome} na base do Radar. Não publicamos números sem fonte.</p>
      )}
      <section>
        <h2>Vai reformar um studio em {nome}?</h2>
        <p><a href={reformaBairroUrl(nome)}>{ancoraReformaBairro(nome)}</a></p>
      </section>
      <p><a href="/ranking">Comparar com outros bairros no comparador do Radar</a></p>
    </main>
  );
}
