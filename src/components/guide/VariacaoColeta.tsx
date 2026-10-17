import { ArrowDownRight, ArrowRight, ArrowUpRight, History } from "lucide-react";
import { useVariacoesColeta, type VariacaoBairro, type VariacaoIndicador } from "@/lib/variacaoColeta";
import { formatDecimal, formatPercent } from "@/lib/numberFormat";
import { fmt } from "@/data/guide-data";
import { buscarAjuste, mapaAjustes, useBairroAjustes } from "@/lib/bairroAjustes";

/**
 * Bairros com ajuste manual do admin mostram outro número na tela; para não
 * exibir dois valores para o mesmo bairro, a variação entre coletas some neles.
 */
export function useVariacoesVisiveis() {
  const { data: variacoes } = useVariacoesColeta();
  const { data: ajustes } = useBairroAjustes();
  const mapa = mapaAjustes(ajustes);
  return (variacoes ?? []).filter((v) => !buscarAjuste(mapa, v.bairro));
}

const data = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

function Seta({ diferenca }: { diferenca: number }) {
  if (diferenca > 0) return <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-label="subiu" />;
  if (diferenca < 0) return <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-label="caiu" />;
  return <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-label="estável" />;
}

const sinal = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "");

function LinhaAdr({ v }: { v: VariacaoIndicador }) {
  return (
    <li className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums">
      <span className="text-muted-foreground">Diária média:</span>
      <span>R$ {fmt(v.anterior.valor)}</span>
      <Seta diferenca={v.diferenca} />
      <strong className="text-foreground">R$ {fmt(v.atual.valor)}</strong>
      {v.percentual !== null && <span className="text-muted-foreground">({sinal(v.diferenca)}{formatDecimal(Math.abs(v.percentual), 1)}%)</span>}
    </li>
  );
}

function LinhaOcupacao({ v }: { v: VariacaoIndicador }) {
  return (
    <li className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums">
      <span className="text-muted-foreground">Ocupação média:</span>
      <span>{formatPercent(v.anterior.valor, 0)}</span>
      <Seta diferenca={v.diferenca} />
      <strong className="text-foreground">{formatPercent(v.atual.valor, 0)}</strong>
      <span className="text-muted-foreground">({sinal(v.diferenca)}{formatDecimal(Math.abs(v.diferenca), 1)} p.p.)</span>
    </li>
  );
}

function referencia(v: VariacaoBairro) {
  const i = v.adr ?? v.ocupacao!;
  const ant = `${i.anterior.periodo ?? "período anterior"}, coleta de ${data(i.anterior.coletadoEm)}`;
  const atu = `${i.atual.periodo ?? "período atual"}, coleta de ${data(i.atual.coletadoEm)}`;
  return `Comparação entre coletas da mesma fonte: ${ant} → ${atu}. Períodos diferentes podem refletir sazonalidade, não só tendência.`;
}

/** Variação de um bairro desde a coleta anterior. Não renderiza nada quando ainda não há duas coletas. */
export function VariacaoColetaBairro({ bairro, className = "" }: { bairro: string; className?: string }) {
  const v = useVariacoesVisiveis().find((x) => x.bairro === bairro);
  if (!v) return null;
  return (
    <section aria-label={`O que mudou em ${bairro} nesta coleta`} className={`rounded-xl border border-border bg-card p-4 text-sm ${className}`}>
      <p className="mb-2 flex items-center gap-2 font-semibold text-foreground"><History className="h-4 w-4 text-primary" aria-hidden="true" />O que mudou nesta coleta</p>
      <ul className="space-y-1">
        {v.adr && <LinhaAdr v={v.adr} />}
        {v.ocupacao && <LinhaOcupacao v={v.ocupacao} />}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{referencia(v)}</p>
    </section>
  );
}

/** Lista dos bairros com mudança desde a coleta anterior. Some enquanto não houver nenhum. */
export function VariacaoColetaResumo() {
  const variacoes = useVariacoesVisiveis();
  if (!variacoes.length) return null;
  return (
    <section aria-label="O que mudou nesta coleta" className="mt-6 rounded-xl border border-border bg-card p-4 md:p-5">
      <p className="mb-3 flex items-center gap-2 font-semibold text-foreground"><History className="h-4 w-4 text-primary" aria-hidden="true" />O que mudou nesta coleta</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {variacoes.map((v) => (
          <div key={v.bairro} className="min-w-0 text-sm">
            <p className="font-medium text-foreground">{v.bairro}</p>
            <ul className="space-y-0.5">
              {v.adr && <LinhaAdr v={v.adr} />}
              {v.ocupacao && <LinhaOcupacao v={v.ocupacao} />}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Cada bairro é comparado com a sua coleta anterior da mesma fonte. Períodos diferentes podem refletir sazonalidade, não só tendência.</p>
    </section>
  );
}
