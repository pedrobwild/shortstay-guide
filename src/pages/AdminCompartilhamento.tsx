import { useState } from "react";
import { Copy, Check, ArrowUpRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { linksCompartilhamento } from "@/lib/compartilhamento";

const normalizar=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const links=linksCompartilhamento();
export default function AdminCompartilhamento() {
  const [busca,setBusca]=useState("");
  const [copiado,setCopiado]=useState("");
  const filtrados=links.filter((l)=>normalizar(l.nome).includes(normalizar(busca)));
  async function copiar(texto:string,chave:string) {
    try {await navigator.clipboard.writeText(texto);setCopiado(chave);toast({title:"Links copiados"});}
    catch {setCopiado("");toast({title:"Não foi possível copiar",description:"Selecione o endereço e copie manualmente.",variant:"destructive"});}
  }
  return <div className="min-h-screen bg-background"><AppNavbar />
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminTabs />
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold md:text-3xl">Compartilhamento</h1><p className="mt-2 text-sm text-muted-foreground">Endereços finais · bairros e comparadores · Google Ads</p></div>
        <Button variant="outline" disabled={!filtrados.length} className="min-h-[44px]" onClick={()=>copiar(filtrados.map((l)=>l.url).join("\n"),"lista")}><Copy className="mr-2 h-4 w-4" />Copiar lista{busca ? " filtrada" : " completa"}</Button>
      </header>
      <div className="max-w-md space-y-2"><label htmlFor="buscar-links" className="text-sm font-medium">Buscar bairro ou comparador</label><Input id="buscar-links" value={busca} onChange={(e)=>setBusca(e.target.value)} className="min-h-[44px] text-base" placeholder="Nome do bairro" /></div>
      <p role="status" className="text-sm text-muted-foreground">{filtrados.length} endereços</p>
      {!filtrados.length ? <p className="py-8 text-muted-foreground">Nenhum endereço encontrado.</p> : <ul aria-label="Links para anúncios" className="divide-y divide-border border-y border-border">{filtrados.map((l)=><li key={l.url} className="flex min-w-0 flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-display text-lg font-semibold">{l.nome}</h2><Badge variant="outline">{l.tipo}</Badge></div><a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] max-w-full items-center gap-1 break-all py-2 text-sm text-primary underline underline-offset-4">{l.url}<ArrowUpRight aria-label="Abre em nova aba" className="h-4 w-4 shrink-0" /></a></div>
        <Button aria-label={`Copiar link de ${l.nome}`} variant="outline" onClick={()=>copiar(l.url,l.url)} className="min-h-[44px] shrink-0 self-start sm:self-center">{copiado===l.url ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copiado===l.url ? "Copiado" : "Copiar link"}</Button>
      </li>)}</ul>}
    </main>
  </div>;
}