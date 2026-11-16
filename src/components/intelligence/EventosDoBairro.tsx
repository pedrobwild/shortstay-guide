import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Secao } from "@/components/estudo/Estrutura";
import { Tag } from "@/components/estudo/Natureza";
import { carregarEventos, eventosComReferencia, eventosDoBairro, periodoDoEvento } from "@/lib/eventosRadar";
import { formatDecimal } from "@/lib/numberFormat";

const pct = (v: number) => `${v > 0 ? "+" : ""}${formatDecimal(v, 0)}%`;
const ano = (iso: string) => iso.slice(0, 4);

/**
 * Página do bairro — próximos eventos em que a edição de referência mexeu na
 * diária deste bairro. Mesma leitura e mesmas regras de /eventos; o percentual é o
 * que aconteceu numa edição passada, nunca previsão. A conta das noites fica em /eventos.
 */
export default function EventosDoBairro({ bairro }: { bairro: string }) {
  const consulta = useQuery({ queryKey: ["radar_eventos_publicos"], queryFn: carregarEventos, staleTime: 60 * 60 * 1000 });
  // Data de hoje lida depois da montagem, para o HTML pré-renderizado não depender do relógio.
  const [hoje, setHoje] = useState<string | null>(null);
  useEffect(() => { setHoje(new Date().toLocaleDateString("en-CA")); }, []);

  const linhas = useMemo(
    () => (hoje && consulta.data ? eventosDoBairro(eventosComReferencia(consulta.data.eventos, consulta.data.efeitos, hoje), bairro) : []),
    [consulta.data, hoje, bairro],
  );
  const carregando = consulta.isPending || hoje === null;
  const linkEventos = <Link to="/eventos" className="e-link inline-flex min-h-[44px] items-center">Ver todos os eventos e simular as noites</Link>;

  return (
    <Secao
      id="eventos"
      rotulo="Eventos"
      titulo={`Próximos eventos e a diária em ${bairro}`}
      lead="Quanto a diária do bairro mudou nas noites do evento, na edição anterior. Serve para planejar preço; não é previsão."
    >
      {carregando ? (
        <p role="status" className="text-muted-foreground">Carregando eventos…</p>
      ) : consulta.isError ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar os eventos agora.</p>
          {linkEventos}
        </div>
      ) : linhas.length === 0 ? (
        <div role="status" className="space-y-2">
          <p className="e-apoio max-w-[720px]">Nenhum dos próximos eventos teve efeito medido na diária de {bairro} na edição de referência.</p>
          {linkEventos}
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="max-w-[820px] divide-y divide-border border-y border-border">
            {linhas.map(({ evento, referencia, efeito, medido }) => (
              <li key={evento.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                <div className="min-w-0">
                  <p className="font-medium break-words">{evento.nome}</p>
                  <p className="e-legenda tabular-nums">
                    {periodoDoEvento(evento)}
                    {!evento.data_confirmada && " · data ainda não confirmada por fonte oficial"}
                  </p>
                </div>
                <div className="min-w-0 sm:text-right">
                  <p className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="e-numero-sm">{pct(efeito.efeito_diaria_pct)}</span>
                    <span className="text-sm">na diária</span>
                    {medido && <Tag tipo="observado" titulo="Medido em uma edição passada; não é previsão" />}
                  </p>
                  <p className="e-legenda">
                    {referencia.tipo === "mesma" ? `Edição de ${ano(referencia.evento.inicio)}` : `Referência: ${referencia.evento.nome} (${ano(referencia.evento.inicio)}), no mesmo local`}
                    {!medido && " · sinal mais fraco"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="e-legenda max-w-[720px]">Anúncios de até 1 quarto, de todos os padrões. O número fala da diária, não da ocupação.</p>
          {linkEventos}
        </div>
      )}
    </Secao>
  );
}
