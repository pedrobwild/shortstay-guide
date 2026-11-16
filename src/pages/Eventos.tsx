import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CabecalhoTela, Container, PaginaEstudo } from "@/components/estudo/Estrutura";
import { Tag } from "@/components/estudo/Natureza";
import { AvisoReceita } from "@/components/estudo/Numeros";
import FonteLink from "@/components/guide/FonteLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FONTES_GUIA } from "@/data/fontesGuia";
import { linkSimuladorBairro } from "@/data/navegacao";
import {
  carregarEventos, edicaoDeReferencia, eventosFuturos, lerAcrescimo, noitesDoEvento, periodoDoEvento, receitaDasNoites,
  ROTULO_CATEGORIA, separarEfeitos, type EfeitoEvento, type EventoRadar, type Referencia,
} from "@/lib/eventosRadar";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { alertasFonteRadar, useRadarBase, type BairroRadar } from "@/lib/radarBase";
import { slugifyBairro } from "@/lib/seo";

const TODOS = "todos";
const pct = (v: number) => `${v > 0 ? "+" : ""}${formatDecimal(v, 0)}%`;
const ano = (iso: string) => iso.slice(0, 4);

/**
 * /eventos — calendário dos próximos eventos de São Paulo e o efeito medido na
 * diária em cada bairro na edição de referência (decisão do Pedro, 16/11/2026).
 * O percentual é o que aconteceu numa edição passada; a conta das noites é uma
 * simulação editável, que parte da hipótese de noites reservadas. Sem promessa.
 */
export default function Eventos() {
  const consulta = useQuery({ queryKey: ["radar_eventos_publicos"], queryFn: carregarEventos, staleTime: 60 * 60 * 1000 });
  const base = useRadarBase();
  const [filtro, setFiltro] = useState(TODOS);
  // Data de hoje lida depois da montagem, para o HTML pré-renderizado não depender do relógio.
  const [hoje, setHoje] = useState<string | null>(null);
  useEffect(() => { setHoje(new Date().toLocaleDateString("en-CA")); }, []);

  const { cartoes, bairros } = useMemo(() => {
    const eventos = consulta.data?.eventos ?? [];
    const efeitos = consulta.data?.efeitos ?? [];
    const porEvento = new Map<string, EfeitoEvento[]>();
    for (const f of efeitos) porEvento.set(f.evento_id, [...(porEvento.get(f.evento_id) ?? []), f]);
    const comEfeito = new Set(porEvento.keys());
    const lista = (hoje ? eventosFuturos(eventos, hoje) : []).map((evento) => {
      const referencia = edicaoDeReferencia(evento, eventos, comEfeito);
      const partes = separarEfeitos(referencia ? porEvento.get(referencia.evento.id) ?? [] : []);
      return { evento, referencia, ...partes };
    });
    const nomes = [...new Set(lista.flatMap((c) => c.medidos.map((m) => m.bairro)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    return { cartoes: lista, bairros: nomes };
  }, [consulta.data, hoje]);

  const visiveis = filtro === TODOS ? cartoes : cartoes.filter((c) => c.medidos.some((m) => m.bairro === filtro));
  const carregando = consulta.isPending || hoje === null;

  return (
    <PaginaEstudo>
      <CabecalhoTela
        rotulo="Consulta · Eventos"
        titulo="Próximos eventos e quanto a diária mudou em cada bairro"
        lead="Datas com fonte e o efeito medido na diária na edição anterior, bairro a bairro. Serve para planejar preço; não é previsão."
        acao={bairros.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="eventos-bairro">Filtrar por bairro</Label>
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger id="eventos-bairro" className="min-h-11 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os bairros</SelectItem>
                {bairros.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : undefined}
      />
      <Container className="space-y-8 pb-12">
        {carregando ? (
          <p role="status" className="py-12 text-muted-foreground">Carregando eventos…</p>
        ) : consulta.isError ? (
          <div role="alert" className="space-y-4 py-12">
            <p>Não foi possível carregar os eventos.</p>
            <Button variant="outline" className="min-h-11" onClick={() => consulta.refetch()}>Tentar novamente</Button>
          </div>
        ) : cartoes.length === 0 ? (
          <div role="status" className="max-w-2xl space-y-3 py-12">
            <p className="e-h3">Ainda não há eventos publicados.</p>
            <p className="e-apoio">Enquanto isso, veja a diária e a ocupação de cada bairro no <Link to="/ranking" className="e-link">ranking dos bairros</Link>.</p>
          </div>
        ) : visiveis.length === 0 ? (
          <div role="status" className="max-w-2xl space-y-3 py-12">
            <p className="e-h3">Nenhum dos próximos eventos tem efeito medido em {filtro}.</p>
            <Button variant="outline" className="min-h-11" onClick={() => setFiltro(TODOS)}>Ver todos os bairros</Button>
          </div>
        ) : (
          <ul className="grid gap-6 xl:grid-cols-2">
            {visiveis.map((c) => (
              <li key={c.evento.id} className="min-w-0">
                <CartaoEvento {...c} bairroDoFiltro={filtro === TODOS ? null : filtro} base={base.data?.bairros ?? []} baseCarregando={base.isPending} />
              </li>
            ))}
          </ul>
        )}

        {!carregando && !consulta.isError && cartoes.length > 0 && (
          <section aria-labelledby="eventos-metodo" className="max-w-3xl space-y-2 border-t border-border pt-6">
            <h2 id="eventos-metodo" className="e-h3">Como o efeito foi medido</h2>
            <p className="e-legenda">A diária das noites do evento foi comparada com a do mesmo dia da semana nas quatro semanas anteriores e nas quatro seguintes. Entram como “efeito medido” só os bairros em que a variação superou 99% das semanas comuns.</p>
            <p className="e-legenda">Limites: cada evento tem uma edição medida; o número fala da diária, não da ocupação; a base são anúncios de até 1 quarto de todos os padrões, não um studio específico.</p>
            <AvisoReceita />
            <p className="e-legenda">Fonte do efeito: <FonteLink fonte={FONTES_GUIA.airdna} />. A diária em reais de cada bairro vem da base do Radar; veja a <Link to="/metodologia" className="e-link inline-flex min-h-11 items-center">metodologia</Link>.</p>
          </section>
        )}
      </Container>
    </PaginaEstudo>
  );
}

function CartaoEvento({ evento, referencia, medidos, fracos, bairroDoFiltro, base, baseCarregando }: {
  evento: EventoRadar;
  referencia: Referencia | null;
  medidos: EfeitoEvento[];
  fracos: EfeitoEvento[];
  bairroDoFiltro: string | null;
  base: BairroRadar[];
  baseCarregando: boolean;
}) {
  const [todos, setTodos] = useState(false);
  const noites = noitesDoEvento(evento);
  const mostrados = todos ? medidos : medidos.slice(0, 4);
  const rotuloReferencia = !referencia ? null
    : referencia.tipo === "mesma" ? `Efeito medido na diária na edição de ${ano(referencia.evento.inicio)}`
    : `Referência: ${referencia.evento.nome} (${ano(referencia.evento.inicio)}), no mesmo local`;

  return (
    <article className="flex h-full flex-col gap-4 rounded-[12px] border border-border bg-card p-5 sm:p-6">
      <header className="space-y-1">
        <p className="e-rotulo">{ROTULO_CATEGORIA[evento.categoria]}</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="e-h2 break-words">{evento.nome}</h2>
          <p className="e-numero-sm whitespace-nowrap">{periodoDoEvento(evento)}</p>
        </div>
        {evento.local && <p className="e-apoio">{evento.local}</p>}
        {!evento.data_confirmada && <p className="e-amostra text-[13px] leading-5">Data ainda não confirmada por fonte oficial.</p>}
      </header>

      {rotuloReferencia && medidos.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="e-legenda font-medium text-foreground">{rotuloReferencia}</p>
            <Tag tipo="observado" titulo="Medido em uma edição passada; não é previsão" />
          </div>
          <ul className="flex flex-wrap gap-2">
            {mostrados.map((m) => (
              <li key={m.bairro} className="rounded-full border border-border bg-background px-3 py-1 text-sm">
                {m.bairro} <span className="font-medium tabular-nums">{pct(m.efeito_diaria_pct)}</span>
              </li>
            ))}
          </ul>
          {medidos.length > 4 && (
            <button type="button" className="e-link min-h-11 text-sm" aria-expanded={todos} onClick={() => setTodos(!todos)}>
              {todos ? "Mostrar menos" : `Ver os ${medidos.length} bairros`}
            </button>
          )}
        </div>
      ) : (
        <p className="e-apoio">
          {referencia ? "Na edição de referência, nenhum bairro teve variação acima do comum." : "Sem medição: não há edição anterior na série lida."}
        </p>
      )}

      {fracos.length > 0 && (
        <p className="e-legenda">Sinal mais fraco, fora das contas: {fracos.map((f) => `${f.bairro} ${pct(f.efeito_diaria_pct)}`).join(", ")}.</p>
      )}

      {medidos.length > 0 && (
        <ContaDasNoites
          chave={evento.id}
          noites={noites}
          medidos={medidos}
          bairroDoFiltro={bairroDoFiltro}
          base={base}
          baseCarregando={baseCarregando}
        />
      )}

      {evento.fonte_url && evento.fonte_titulo && (
        <p className="e-legenda mt-auto">Fonte da data: <FonteLink fonte={{ title: evento.fonte_titulo, url: evento.fonte_url }} /></p>
      )}
    </article>
  );
}

function ContaDasNoites({ chave, noites, medidos, bairroDoFiltro, base, baseCarregando }: {
  chave: string;
  noites: number;
  medidos: EfeitoEvento[];
  bairroDoFiltro: string | null;
  base: BairroRadar[];
  baseCarregando: boolean;
}) {
  const id = useId();
  const inicial = bairroDoFiltro && medidos.some((m) => m.bairro === bairroDoFiltro) ? bairroDoFiltro : medidos[0].bairro;
  const [bairro, setBairro] = useState(inicial);
  const efeito = medidos.find((m) => m.bairro === bairro) ?? medidos[0];
  const [texto, setTexto] = useState(formatDecimal(efeito.efeito_diaria_pct, 0));
  // Troca de bairro (pelo seletor do cartão ou pelo filtro da tela): o campo volta ao valor observado.
  useEffect(() => { setBairro(inicial); }, [inicial, chave]);
  useEffect(() => { setTexto(formatDecimal(efeito.efeito_diaria_pct, 0)); }, [efeito.bairro, efeito.efeito_diaria_pct]);

  const linha = base.find((b) => b.name === efeito.bairro);
  const acrescimo = lerAcrescimo(texto);
  const conta = linha && acrescimo != null ? receitaDasNoites(linha.dailyAvg, noites, acrescimo) : null;
  const observado = acrescimo != null && formatDecimal(acrescimo, 0) === formatDecimal(efeito.efeito_diaria_pct, 0);

  return (
    <section aria-label="Receita nas noites do evento" className="space-y-4 rounded-[10px] bg-secondary p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="e-h3">Receita nas noites do evento</h3>
        <Tag tipo="hipotese" titulo="Simulação editável: parte da hipótese de noites reservadas">Simulação</Tag>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-bairro`}>Bairro</Label>
          <Select value={efeito.bairro} onValueChange={setBairro}>
            <SelectTrigger id={`${id}-bairro`} className="min-h-11 bg-background text-base"><SelectValue /></SelectTrigger>
            <SelectContent>{medidos.map((m) => <SelectItem key={m.bairro} value={m.bairro}>{m.bairro}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-acrescimo`}>Acréscimo sobre a diária (%)</Label>
          <Input
            id={`${id}-acrescimo`}
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-invalid={acrescimo == null}
            aria-describedby={`${id}-ajuda`}
            className="min-h-11 bg-background text-base tabular-nums"
          />
        </div>
      </div>
      <p id={`${id}-ajuda`} className="e-legenda">
        {acrescimo == null ? "Informe um percentual, por exemplo 10."
          : observado ? "Valor observado neste bairro na edição de referência. Você pode trocar."
          : `Valor informado por você. O observado neste bairro foi ${pct(efeito.efeito_diaria_pct)}.`}
      </p>

      {baseCarregando ? (
        <p role="status" className="e-legenda">Carregando a diária do bairro…</p>
      ) : !linha ? (
        <p role="status" className="e-legenda">Não há diária de {efeito.bairro} na base do Radar para fazer a conta.</p>
      ) : conta ? (
        <div className="space-y-4" aria-live="polite">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="e-legenda">Sem o evento</dt>
              <dd className="e-numero-sm">{formatBRL(Math.round(conta.sem))}</dd>
              <dd className="e-legenda">{noites} {noites === 1 ? "noite" : "noites"} × {formatBRL(Math.round(linha.dailyAvg))}</dd>
            </div>
            <div>
              <dt className="e-legenda">Com o acréscimo</dt>
              <dd className="e-numero-sm">{formatBRL(Math.round(conta.com))}</dd>
              <dd className="e-legenda">{noites} {noites === 1 ? "noite" : "noites"} × {formatBRL(Math.round(conta.diariaComAcrescimo))}</dd>
            </div>
          </dl>
          <p className="text-sm font-medium">
            Diferença de {formatBRL(Math.round(conta.diferenca))} de receita bruta, se {noites === 1 ? "a noite for reservada" : `as ${noites} noites forem reservadas`}.
          </p>
          <p className="e-legenda">Diária média de {efeito.bairro}: {linha.period ? `${linha.fonteNome}, ${linha.period}` : linha.fonteNome}.</p>
          {alertasFonteRadar(linha).amostraPequena && <p className="e-amostra text-[13px] leading-5">Amostra pequena neste bairro: leia com cautela.</p>}
          <Link to={linkSimuladorBairro(slugifyBairro(efeito.bairro))} className="e-link inline-flex min-h-11 items-center text-sm">Simular o mês inteiro em {efeito.bairro}</Link>
        </div>
      ) : null}
    </section>
  );
}
