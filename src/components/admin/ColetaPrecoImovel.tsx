import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { carregarPrecos, precoImovelSchema, registrarPreco } from "@/lib/precosImoveis";
import { numeroColeta } from "@/lib/radarColetas";
import { formatBRL } from "@/lib/numberFormat";
import { toast } from "@/hooks/use-toast";

const inicial = () => ({ preco_m2: "", fonte_nome: "", url_origem: "", periodo_inicio: "", periodo_fim: "", coletado_em: new Date().toISOString().slice(0,10), amostra_n: "", observacao: "" });
const dataBR = (v: string) => v.split("-").reverse().join("/");
export default function ColetaPrecoImovel({ bairro, utms }: { bairro: string; utms: Record<string,string> }) {
  const [form,setForm] = useState(inicial);
  const [erro,setErro] = useState("");
  const [confirmar,setConfirmar] = useState(false);
  const [salvando,setSalvando] = useState(false);
  const [pagina,setPagina] = useState(0);
  const qc = useQueryClient();
  const historico = useQuery({ queryKey: ["radar_precos_historico",bairro,pagina], queryFn: () => carregarPrecos(bairro,pagina) });
  const payload = () => precoImovelSchema.safeParse({ ...form, bairro, preco_m2: numeroColeta(form.preco_m2), amostra_n: numeroColeta(form.amostra_n) });
  async function salvar() {
    const p=payload(); if (!p.success) return;
    setSalvando(true);
    try {
      const { error } = await registrarPreco(p.data,utms); if(error) throw error;
      await Promise.all(["radar_preco_atual","radar_precos_historico"].map((key) => qc.invalidateQueries({queryKey:[key]})));
      setForm(inicial()); setErro(""); toast({title:"Preço por m² atualizado",description:"A referência anterior permanece no histórico. Diária e ocupação foram preservadas."});
    } catch(e) { setErro(e && typeof e === "object" && "message" in e ? String(e.message) : "Não foi possível registrar o preço."); }
    finally {setSalvando(false);setConfirmar(false);}
  }
  const campo=(key: keyof ReturnType<typeof inicial>,titulo:string,tipo="text") => <label className="block space-y-1 text-sm"><span>{titulo}</span><Input required type={tipo} value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})} className="min-h-[44px] text-base" /></label>;
  return <section id="coleta-preco-imovel" aria-label="Coleta de preço do imóvel" className="space-y-5 border-t border-border pt-6">
    <h2 className="font-display text-xl font-semibold">Preço médio por m² — {bairro}</h2>
    <p className="text-sm text-muted-foreground">Fonte imobiliária própria · independente da coleta de hospedagem · referência do bairro, não preço de um imóvel específico.</p>
    <form onSubmit={(e)=>{e.preventDefault();const p=payload();if(!p.success){setErro(p.error.issues[0]?.message ?? "Revise os campos.");return;}setErro("");setConfirmar(true);}} className="space-y-4">
      <fieldset disabled={salvando} className="grid min-w-0 gap-4 md:grid-cols-2">
        {campo("preco_m2","Preço médio por m² (R$)")}{campo("fonte_nome","Nome da fonte imobiliária")}
        {campo("url_origem","Link da fonte imobiliária","url")}{campo("amostra_n","Amostra (número de imóveis)")}
        {campo("periodo_inicio","Início do período de preços","date")}{campo("periodo_fim","Fim do período de preços","date")}{campo("coletado_em","Data da coleta de preços","date")}
        <label className="space-y-1 text-sm"><span>Observação sobre os preços (opcional)</span><Textarea maxLength={4000} value={form.observacao} onChange={(e)=>setForm({...form,observacao:e.target.value})} className="text-base" /></label>
      </fieldset>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={salvando || bairro==="São Paulo"} className="min-h-[44px]"><Save className="mr-2 h-4 w-4" />Registrar preço por m²</Button>
    </form>
    <h3 className="font-display text-lg font-semibold">Histórico de preços</h3>
    {historico.isPending ? <p role="status">Carregando preços…</p> : historico.isError ? <p role="alert">Não foi possível carregar os preços. <Button variant="link" onClick={()=>historico.refetch()}>Tentar novamente</Button></p> : !historico.data?.linhas.length ? <p role="status" className="text-sm text-muted-foreground">Nenhuma coleta de preço registrada para {bairro}.</p> : <ul className="divide-y divide-border">{historico.data.linhas.map((p)=><li key={p.id} className="space-y-1 py-3 text-sm"><p className="font-medium">{formatBRL(p.preco_m2)}/m² · {p.ativo ? "Ativa" : "Substituída"}</p><p>{p.fonte_nome} · {dataBR(p.periodo_inicio)} a {dataBR(p.periodo_fim)} · coleta {dataBR(p.coletado_em)} · n={p.amostra_n}</p><a href={p.url_origem} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-primary underline">Conferir fonte imobiliária</a></li>)}</ul>}
    {(historico.data?.total ?? 0)>20 && <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={pagina===0} onClick={()=>setPagina(pagina-1)}>Anterior</Button><span>Página {pagina+1}</span><Button variant="outline" disabled={(pagina+1)*20 >= (historico.data?.total ?? 0)} onClick={()=>setPagina(pagina+1)}>Próxima</Button></div>}
    <AlertDialog open={confirmar} onOpenChange={setConfirmar}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Atualizar o preço de {bairro}?</AlertDialogTitle><AlertDialogDescription>{formatBRL(numeroColeta(form.preco_m2))}/m² · {form.fonte_nome}. A nova referência será pública; a anterior fica no histórico. Diária e ocupação não mudam.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={salvando} onClick={(e)=>{e.preventDefault();void salvar();}}>{salvando ? "Salvando…" : "Confirmar preço"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}