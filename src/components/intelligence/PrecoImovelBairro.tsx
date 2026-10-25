import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePrecoImovel, valorReferenciaImovel } from "@/lib/precosImoveis";
import { formatBRL } from "@/lib/numberFormat";
const dataBR=(v:string)=>v.split("-").reverse().join("/");
export default function PrecoImovelBairro({ bairro }: { bairro: string }) {
  const q=usePrecoImovel(bairro);
  const [area,setArea]=useState("");
  if(q.isPending) return <p role="status" className="e-apoio">Consultando referência de compra…</p>;
  if(q.isError) return <p role="alert" className="e-apoio">A referência de compra não carregou. <Button variant="link" onClick={()=>q.refetch()}>Tentar novamente</Button></p>;
  if(!q.data) return <p className="e-apoio">Ainda não há coleta de preço médio por m² para {bairro}. Dados de hospedagem não determinam o preço de compra.</p>;
  const p=q.data;
  const total=valorReferenciaImovel(p.preco_m2,Number(area.replace(",",".")));
  return <div className="space-y-3">
    <p className="e-numero">{formatBRL(p.preco_m2)}<span className="e-apoio">/m²</span></p>
    <p className="e-legenda"><a href={p.url_origem} target="_blank" rel="noopener noreferrer" className="e-link inline-flex min-h-[44px] items-center">{p.fonte_nome}</a> · {dataBR(p.periodo_inicio)} a {dataBR(p.periodo_fim)} · coleta {dataBR(p.coletado_em)} · amostra de {p.amostra_n} imóveis</p>
    <label className="block max-w-xs space-y-1"><span className="e-rotulo">Área do imóvel (m²)</span><Input inputMode="decimal" value={area} onChange={(e)=>setArea(e.target.value)} className="min-h-[44px] text-base" /></label>
    {total!==null && <p className="e-corpo">Valor de referência: {formatBRL(total)} · média por m² × área informada.</p>}
    <p className="e-legenda">Referência do bairro, não avaliação nem preço anunciado de um imóvel específico.</p>
  </div>;
}