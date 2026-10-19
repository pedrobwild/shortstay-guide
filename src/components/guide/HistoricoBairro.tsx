import type { ReactNode } from "react";
import { useHistoricoRadar, type ColetaBairro } from "@/lib/historicoRadar";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { buscarAjuste, mapaAjustes, useBairroAjustes } from "@/lib/bairroAjustes";
import { TD, TD_NUM, TH } from "@/components/estudo/Figura";
import { cn } from "@/lib/utils";

const dataBR = (iso: string) => iso.split("-").reverse().join("/");

/** Mini-série em SVG puro (sem biblioteca): pontos em ordem cronológica, eixo oculto, valores no título. */
function MiniSerie({ pontos, rotulo, formatar }: { pontos: { data: string; valor: number }[]; rotulo: string; formatar: (v: number) => string }) {
  const W = 160, H = 40, P = 4;
  const vs = pontos.map((p) => p.valor);
  const min = Math.min(...vs), max = Math.max(...vs);
  const y = (v: number) => (max === min ? H / 2 : P + (H - 2 * P) * (1 - (v - min) / (max - min)));
  const x = (i: number) => (pontos.length === 1 ? W / 2 : P + ((W - 2 * P) * i) / (pontos.length - 1));
  const d = pontos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const titulo = `${rotulo}: ${pontos.map((p) => `${formatar(p.valor)} em ${dataBR(p.data)}`).join(", ")}`;
  return (
    <figure className="m-0 min-w-0">
      <figcaption className="e-rotulo">{rotulo}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo} className="mt-1 h-10 w-full max-w-[200px]">
        <title>{titulo}</title>
        <path d={d} fill="none" stroke="hsl(var(--ciano))" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {pontos.map((p, i) => <circle key={p.data} cx={x(i)} cy={y(p.valor)} r="2.5" fill="hsl(var(--ciano))" stroke="hsl(var(--ciano-700))" strokeWidth="1" />)}
      </svg>
      <p className="text-[15px] tabular-nums">{formatar(pontos[0].valor)} → <strong className="font-semibold">{formatar(pontos[pontos.length - 1].valor)}</strong></p>
    </figure>
  );
}

/**
 * Histórico público de coletas de um bairro (todas as fontes, mais recente primeiro) e, com
 * duas ou mais coletas da mesma fonte, a mini-série de diária e ocupação. Bairros com ajuste
 * manual do admin mostram outro número na tela e por isso ficam sem histórico (um bairro, um número).
 * Visual do Estudo aberto: sem caixa, tabela com cabeçalho de tinta cheia e linhas finas.
 */
export default function HistoricoBairro({
  bairro,
  className = "",
  moldura = (c) => c,
}: {
  bairro: string;
  className?: string;
  /** Envolve o histórico (ex.: numa seção com título) só quando há o que mostrar. */
  moldura?: (conteudo: ReactNode) => ReactNode;
}) {
  const { data, isLoading, isError } = useHistoricoRadar(bairro);
  const { data: ajustes } = useBairroAjustes();
  if (buscarAjuste(mapaAjustes(ajustes), bairro)) return null;
  const coletas = (data?.coletas ?? []).filter((c) => c.fonteId !== "estimativa_bewild");
  if (!isLoading && !isError && coletas.length < 2) return null;
  const fontePrincipal = coletas.find((c) => c.ativo)?.fonteId;
  const serie = [...coletas].filter((c) => c.fonteId === fontePrincipal).sort((a, b) => a.coletadoEm.localeCompare(b.coletadoEm));
  const pontos = (campo: keyof Pick<ColetaBairro, "diaria" | "ocupacao">) => serie.flatMap((c) => (c[campo] === null ? [] : [{ data: c.coletadoEm, valor: c[campo] as number }]));
  const diaria = pontos("diaria"), ocupacao = pontos("ocupacao");
  return moldura(
    <section aria-label={`Histórico de coletas de ${bairro}`} className={cn("min-w-0", className)}>
      {isLoading && <p role="status" className="e-apoio">Carregando o histórico…</p>}
      {isError && <p role="alert" className="e-apoio">Não foi possível carregar o histórico agora.</p>}
      {serie.length >= 2 && (
        <div className="mb-6 grid grid-cols-2 gap-6">
          {diaria.length >= 2 && <MiniSerie pontos={diaria} rotulo="Diária média (R$)" formatar={formatBRL} />}
          {ocupacao.length >= 2 && <MiniSerie pontos={ocupacao} rotulo="Ocupação média (%)" formatar={(v) => formatPercent(v, 0)} />}
        </div>
      )}
      {coletas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-[15px] leading-[22px]">
            <caption className="sr-only">Coletas de {bairro}, da mais recente para a mais antiga</caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>Coleta</th>
                <th scope="col" className={TH}>Período</th>
                <th scope="col" className={cn(TH, "text-right")}>Diária (R$)</th>
                <th scope="col" className={cn(TH, "text-right")}>Ocupação (%)</th>
                <th scope="col" className={cn(TH, "text-right")}><span className="e-var normal-case">n</span></th>
              </tr>
            </thead>
            <tbody>
              {coletas.map((c) => (
                <tr key={`${c.coletadoEm}|${c.fonteId}`} className={c.ativo ? "font-semibold" : "text-tinta-78"}>
                  <td className={cn(TD, "tabular-nums")}>
                    {dataBR(c.coletadoEm)}
                    <span className="e-legenda block font-normal">{c.fonteNome}{c.ativo ? " · em uso" : ""}</span>
                  </td>
                  <td className={TD}>{c.periodo ?? "—"}</td>
                  <td className={TD_NUM}>{c.diaria === null ? "—" : formatBRL(c.diaria)}</td>
                  <td className={TD_NUM}>{c.ocupacao === null ? "—" : formatPercent(c.ocupacao, 0)}</td>
                  <td className={TD_NUM}>{c.anuncios === null ? "—" : formatDecimal(c.anuncios, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="e-legenda mt-3">Coletas da mesma fonte em datas diferentes; a página da fonte pode revisar o mesmo período. Períodos diferentes refletem sazonalidade, não só tendência.{data?.offline ? " Mostrando a reserva offline." : ""}</p>
    </section>
  );
}
