import { useState } from "react";
import { useRadarBase, alertasFonteRadar, rotuloFonteRadar } from "@/lib/radarBase";
import { bairroFinanciamento, DESPESAS_FINANCIAMENTO, projetarFinanciamentoRadar } from "@/lib/financiamentoRadar";
import { BRL } from "@/lib/financiamento";
import { formatPercent } from "@/lib/numberFormat";
import { TEXTO_DRE_PERCENTUAIS } from "@/data/dreGuia";
import FonteLink from "@/components/guide/FonteLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReceitaBairroFinanciamento({ nome, parcela, idPrefix }: {
  nome: string; parcela?: number; idPrefix: string;
}) {
  const radar = useRadarBase();
  const [despesas, setDespesas] = useState(DESPESAS_FINANCIAMENTO);
  if (!nome.trim()) return <p className="text-xs text-muted-foreground">Escolha um bairro para consultar diária e ocupação da base aprovada.</p>;
  if (radar.isLoading) return <p role="status" className="text-sm text-muted-foreground">Consultando coletas do bairro…</p>;
  const bairro = bairroFinanciamento(radar.data?.bairros ?? [], nome);
  if (!bairro) return <p role="status" className="text-sm text-muted-foreground">Sem diária e ocupação aprovadas para este bairro. O financiamento mantém os valores informados.</p>;
  const alertas = alertasFonteRadar(bairro);
  const resultado = projetarFinanciamentoRadar(bairro, parcela ?? 0, despesas);
  return <section aria-label={`Receita de referência — ${bairro.name}`} className="space-y-3 border-y border-border py-4">
    <h3 className="font-display font-semibold text-foreground">Receita de referência — {bairro.name}</h3>
    {radar.data?.offline && <div role="status" className="text-xs text-estimate-text">
      Consulta indisponível; exibindo a reserva offline aprovada, não uma coleta ao vivo.
      <Button type="button" variant="ghost" size="sm" onClick={() => void radar.refetch()}>Tentar novamente</Button>
    </div>}
    {bairro.ocupacaoFonte === "aproximacao" && <p className="text-xs text-estimate-text">Aproximação pelo Itaim Bibi; não é coleta direta deste bairro.</p>}
    {bairro.ocupacaoFonte === "bewild" && <p className="text-xs text-estimate-text">Estimativa Bewild, sem fonte pública atualizada.</p>}
    {alertas.amostraPequena && <p className="text-xs text-estimate-text">amostra pequena · {bairro.amostraN} anúncios</p>}
    {alertas.desatualizado && <p className="text-xs text-estimate-text">dado desatualizado</p>}
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <div><dt className="text-muted-foreground">Diária média</dt><dd className="font-semibold tabular-nums">{BRL(bairro.dailyAvg)}</dd></div>
      <div><dt className="text-muted-foreground">Ocupação</dt><dd className="font-semibold tabular-nums">{formatPercent(bairro.avgOccupancy)}</dd></div>
    </dl>
    <div className="text-xs text-muted-foreground break-words">{bairro.sourceUrl
      ? <FonteLink fonte={{ title: rotuloFonteRadar(bairro), url: bairro.sourceUrl }} />
      : rotuloFonteRadar(bairro)}</div>
    {parcela !== undefined && resultado && <>
      <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3">
        {([['condominio', 'Condomínio mensal'], ['iptu', 'IPTU mensal'], ['contas', 'Contas mensais']] as const).map(([chave, rotulo]) => <div key={chave} className="space-y-1">
          <Label htmlFor={`${idPrefix}-${chave}`} className="text-xs">{rotulo} (R$)</Label>
          <Input id={`${idPrefix}-${chave}`} type="number" min={0} max={100000} inputMode="decimal" className="h-11 text-base tabular-nums"
            value={despesas[chave]} onChange={(e) => setDespesas((d) => ({ ...d, [chave]: Math.max(0, Math.min(100000, Number(e.target.value) || 0)) }))} />
        </div>)}
      </div>
      <dl className="space-y-2 text-sm tabular-nums">
        <div className="flex flex-wrap justify-between gap-2"><dt>Receita bruta estimada / mês</dt><dd>{BRL(resultado.receitaBruta)}</dd></div>
        <div className="flex flex-wrap justify-between gap-2"><dt>Líquido estimado antes da parcela</dt><dd>{BRL(resultado.liquido)}</dd></div>
        <div className="flex flex-wrap justify-between gap-2"><dt>1ª parcela, seguros e tarifas</dt><dd>{BRL(parcela)}</dd></div>
        <div className="flex flex-wrap justify-between gap-2 font-semibold"><dt>Saldo estimado após a 1ª parcela</dt><dd>{BRL(resultado.aposParcela)}</dd></div>
      </dl>
      <p className="text-xs text-muted-foreground">Hipótese: diária × 30 dias × ocupação. Deduções: {TEXTO_DRE_PERCENTUAIS}, mais despesas informadas. Não representa receita garantida nem renda aceita pelo banco.</p>
    </>}
    <p className="text-xs text-muted-foreground">As coletas descrevem hospedagens, não preços de imóveis nem juros bancários. Valor do imóvel e condições do financiamento permanecem hipóteses.</p>
  </section>;
}