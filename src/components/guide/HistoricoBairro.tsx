import { History } from "lucide-react";
import { useHistoricoRadar, type ColetaBairro } from "@/lib/historicoRadar";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { buscarAjuste, mapaAjustes, useBairroAjustes } from "@/lib/bairroAjustes";

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
    <figure className="min-w-0">
      <figcaption className="text-xs text-muted-foreground">{rotulo}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo} className="mt-1 h-10 w-full max-w-[200px] text-primary">
        <title>{titulo}</title>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {pontos.map((p, i) => <circle key={p.data} cx={x(i)} cy={y(p.valor)} r="2.5" fill="currentColor" />)}
      </svg>
      <p className="text-xs tabular-nums text-foreground">{formatar(pontos[0].valor)} → <strong>{formatar(pontos[pontos.length - 1].valor)}</strong></p>
    </figure>
  );
}

/**
 * Histórico público de coletas de um bairro (todas as fontes, mais recente primeiro) e, com
 * duas ou mais coletas da mesma fonte, a mini-série de diária e ocupação. Bairros com ajuste
 * manual do admin mostram outro número na tela e por isso ficam sem histórico (um bairro, um número).
 */
export default function HistoricoBairro({ bairro, className = "" }: { bairro: string; className?: string }) {
  const { data, isLoading, isError } = useHistoricoRadar(bairro);
  const { data: ajustes } = useBairroAjustes();
  if (buscarAjuste(mapaAjustes(ajustes), bairro)) return null;
  const coletas = (data?.coletas ?? []).filter((c) => c.fonteId !== "estimativa_bewild");
  if (!isLoading && !isError && coletas.length < 2) return null;
  const fontePrincipal = coletas.find((c) => c.ativo)?.fonteId;
  const serie = [...coletas].filter((c) => c.fonteId === fontePrincipal).sort((a, b) => a.coletadoEm.localeCompare(b.coletadoEm));
  const pontos = (campo: keyof Pick<ColetaBairro, "diaria" | "ocupacao">) => serie.flatMap((c) => (c[campo] === null ? [] : [{ data: c.coletadoEm, valor: c[campo] as number }]));
  const diaria = pontos("diaria"), ocupacao = pontos("ocupacao");
  return (
    <section aria-label={`Histórico de coletas de ${bairro}`} className={`rounded-xl border border-border bg-card p-4 text-sm ${className}`}>
      <p className="mb-2 flex items-center gap-2 font-semibold text-foreground"><History className="h-4 w-4 text-primary" aria-hidden="true" />Histórico de coletas</p>
      {isLoading && <p role="status" className="text-muted-foreground">Carregando histórico…</p>}
      {isError && <p role="alert" className="text-muted-foreground">Não foi possível carregar o histórico agora.</p>}
      {serie.length >= 2 && (
        <div className="mb-3 grid grid-cols-2 gap-4">
          {diaria.length >= 2 && <MiniSerie pontos={diaria} rotulo="Diária média" formatar={formatBRL} />}
          {ocupacao.length >= 2 && <MiniSerie pontos={ocupacao} rotulo="Ocupação média" formatar={(v) => formatPercent(v, 0)} />}
        </div>
      )}
      {coletas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-xs tabular-nums">
            <thead><tr className="text-muted-foreground"><th className="py-1 pr-2 font-medium">Coleta</th><th className="py-1 pr-2 font-medium">Período</th><th className="py-1 pr-2 font-medium">Diária</th><th className="py-1 pr-2 font-medium">Ocupação</th><th className="py-1 font-medium">Anúncios</th></tr></thead>
            <tbody>
              {coletas.map((c) => (
                <tr key={`${c.coletadoEm}|${c.fonteId}`} className={c.ativo ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  <td className="py-1 pr-2 font-normal">{dataBR(c.coletadoEm)}<span className="block text-[11px] font-normal text-muted-foreground">{c.fonteNome}{c.ativo ? " · em uso" : ""}</span></td>
                  <td className="py-1 pr-2">{c.periodo ?? "—"}</td>
                  <td className="py-1 pr-2">{c.diaria === null ? "—" : formatBRL(c.diaria)}</td>
                  <td className="py-1 pr-2">{c.ocupacao === null ? "—" : formatPercent(c.ocupacao, 0)}</td>
                  <td className="py-1">{c.anuncios === null ? "—" : formatDecimal(c.anuncios, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Coletas da mesma fonte em datas diferentes; a página da fonte pode revisar o mesmo período. Períodos diferentes refletem sazonalidade, não só tendência.{data?.offline ? " Mostrando a reserva offline." : ""}</p>
    </section>
  );
}
