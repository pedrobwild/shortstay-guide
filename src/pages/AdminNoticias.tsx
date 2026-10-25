import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Pencil, Plus, Save } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { DESTINOS_NOTICIAS, STATUS_NOTICIA, listarNoticias, salvarNoticia, noticiaSchema, type NoticiaEntrada, type NoticiaRadar } from "@/lib/noticiasRadar";

const vazio: NoticiaEntrada = { titulo: "", resumo: "", url: "", destino: "/mercado", status: "rascunho" };
export default function AdminNoticias() {
  const cache = useQueryClient();
  const [pagina, setPagina] = useState(0);
  const [filtro, setFiltro] = useState("todos");
  const [id, setId] = useState<string>();
  const [form, setForm] = useState<NoticiaEntrada>(vazio);
  const [erro, setErro] = useState("");
  const consulta = useQuery({ queryKey: ["noticias_admin", pagina, filtro], queryFn: () => listarNoticias(pagina, filtro), refetchInterval: 60000 });
  const salvar = useMutation({ mutationFn: () => salvarNoticia(form, id), onSuccess: (novoId) => {
    setId(novoId); setErro("");
    void cache.invalidateQueries({ queryKey: ["noticias_admin"] });
    void cache.invalidateQueries({ queryKey: ["noticias_publicadas"] });
    toast({ title: form.status === "publicado" ? "Link publicado no Radar" : "Artigo salvo" });
  }, onError: () => setErro("Não foi possível salvar. Confira seu acesso e tente novamente.") });
  function editar(n: NoticiaRadar) { setId(n.id); setForm({ titulo: n.titulo, resumo: n.resumo, url: n.url, destino: n.destino, status: n.status }); setErro(""); }
  return <div className="min-h-screen bg-background">
    <AppNavbar />
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminTabs />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Notícias</h1><p className="mt-2 text-sm text-muted-foreground">Artigos do Bewild · links associados às páginas do Radar</p></div>
        <Button variant="outline" disabled={salvar.isPending} onClick={() => { setId(undefined); setForm(vazio); setErro(""); }} className="min-h-[44px]"><Plus className="mr-2 h-4 w-4" />Novo artigo</Button>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4" aria-label="Artigos cadastrados">
          <Label htmlFor="filtro-noticias">Status</Label>
          <Select value={filtro} onValueChange={(v) => { setFiltro(v); setPagina(0); }}><SelectTrigger id="filtro-noticias" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{Object.entries(STATUS_NOTICIA).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
          {consulta.isPending ? <p role="status">Carregando artigos…</p> : consulta.isError ? <div role="alert"><p>Não foi possível carregar os artigos.</p><Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button></div> : !consulta.data?.noticias.length ? <p role="status" className="py-8 text-muted-foreground">Nenhum artigo neste status.</p> : <ul className="divide-y divide-border border-y border-border">{consulta.data.noticias.map((n) => <li key={n.id} className="space-y-2 py-4">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{STATUS_NOTICIA[n.status]}</Badge><span className="text-xs text-muted-foreground">{new Date(n.atualizado_em).toLocaleDateString("pt-BR")}</span></div>
            <h2 className="break-words font-display text-lg font-semibold">{n.titulo}</h2>
            <p className="break-words text-sm text-muted-foreground">{DESTINOS_NOTICIAS.find((d) => d.caminho === n.destino)?.nome ?? n.destino}</p>
            <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-[44px]" disabled={salvar.isPending} onClick={() => editar(n)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button asChild variant="ghost" className="min-h-[44px]"><a href={n.url} target="_blank" rel="noopener noreferrer">Artigo<ArrowUpRight className="ml-2 h-4 w-4" /></a></Button><Button asChild variant="ghost" className="min-h-[44px]"><Link to={n.destino}>Ver no Radar</Link></Button></div>
          </li>)}</ul>}
          <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</Button><span className="text-sm text-muted-foreground">Página {pagina + 1} · {consulta.data?.total ?? 0} artigos</span><Button variant="outline" disabled={consulta.isFetching || (pagina + 1) * 20 >= (consulta.data?.total ?? 0)} onClick={() => setPagina(pagina + 1)}>Próxima</Button></div>
        </section>
        <form aria-label="Editar artigo" className="min-w-0 space-y-5 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); const resultado = noticiaSchema.safeParse(form); if (!resultado.success) { setErro(resultado.error.issues[0]?.message ?? "Confira os campos."); return; } salvar.mutate(); }}>
          <h2 className="font-display text-xl font-semibold">{id ? "Editar artigo" : "Novo artigo"}</h2>
          <fieldset disabled={salvar.isPending} className="min-w-0 space-y-5">
            <div className="space-y-2"><Label htmlFor="titulo-noticia">Título</Label><Input id="titulo-noticia" required maxLength={180} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="min-h-[44px] text-base" /></div>
            <div className="space-y-2"><Label htmlFor="url-noticia">Link do artigo no Bewild</Label><Input id="url-noticia" type="url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://bewild.com.br/conteudos/…" className="min-h-[44px] text-base" /></div>
            <div className="space-y-2"><Label htmlFor="resumo-noticia">Resumo (opcional)</Label><Textarea id="resumo-noticia" maxLength={600} value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} className="text-base" /></div>
            <div className="space-y-2"><Label htmlFor="destino-noticia">Página do Radar</Label><Select value={form.destino} onValueChange={(v) => setForm({ ...form, destino: v })}><SelectTrigger id="destino-noticia" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{DESTINOS_NOTICIAS.map((d) => <SelectItem key={d.caminho} value={d.caminho}>{d.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="status-noticia">Publicação</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as NoticiaEntrada["status"] })}><SelectTrigger id="status-noticia" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_NOTICIA).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="min-h-[44px]"><Save className="mr-2 h-4 w-4" />{salvar.isPending ? "Salvando…" : "Salvar artigo"}</Button>
          </fieldset>
        </form>
      </div>
    </main>
  </div>;
}