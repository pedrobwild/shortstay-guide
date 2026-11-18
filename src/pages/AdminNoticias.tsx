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
import { listarCategorias } from "@/lib/categoriasRadar";
import FormConteudo, { CONTEUDO_VAZIO } from "@/components/admin/FormConteudo";
import { DESTINOS_NOTICIAS, STATUS_NOTICIA, salvarNoticia, noticiaSchema, type NoticiaEntrada } from "@/lib/noticiasRadar";
import { TIPOS_CONTEUDO, caminhoConteudo, listarConteudosAdmin, type ConteudoEntrada } from "@/lib/conteudosRadar";
import { arquivosDoRepositorio, avisosDoConteudo } from "@/lib/conteudosRepositorio";

/** Textos publicados por PR: só leitura aqui (edita-se o arquivo em src/content/conteudos). */
function TextosDoRepositorio() {
  const lista = arquivosDoRepositorio();
  return <section aria-label="Textos publicados por PR" className="min-w-0 space-y-3 rounded-sm border border-border p-4">
    <h2 className="font-display text-lg font-semibold">Publicados por PR (repositório)</h2>
    <p className="text-sm text-muted-foreground">Estes textos vivem em src/content/conteudos e mudam só por PR. Aqui eles aparecem só para consulta.</p>
    {!lista.length ? <p className="text-sm text-muted-foreground">Nenhum texto no repositório ainda.</p> : <ul className="divide-y divide-border">{lista.map((c) => {
      const bloqueado = c.status === "publicado" && avisosDoConteudo(c).length > 0;
      return <li key={c.slug} className="flex flex-wrap items-center gap-2 py-3">
        <Badge variant="outline">{bloqueado ? "Com aviso (fora do ar)" : STATUS_NOTICIA[c.status]}</Badge>
        <Badge variant="secondary">{TIPOS_CONTEUDO[c.tipo].rotulo}</Badge>
        <span className="min-w-0 break-words font-medium">{c.titulo}</span>
        {c.status === "publicado" && !bloqueado && <Button asChild variant="ghost" className="min-h-[44px]"><Link to={caminhoConteudo(c.slug)}>Abrir o texto</Link></Button>}
      </li>;
    })}</ul>}
  </section>;
}

type Linha = Awaited<ReturnType<typeof listarConteudosAdmin>>["itens"][number];
/** O que está aberto no formulário: um link para o site Bewild ou um texto próprio (artigo, release, estudo). */
type Edicao = { modo: "link" } | { modo: "texto"; chave: string; inicial: ConteudoEntrada; jaPublicado: boolean };

const vazio: NoticiaEntrada = { titulo: "", resumo: "", url: "", destino: "/mercado", status: "rascunho" };
export default function AdminNoticias() {
  const cache = useQueryClient();
  const [pagina, setPagina] = useState(0);
  const [filtro, setFiltro] = useState("todos");
  const [id, setId] = useState<string>();
  const [form, setForm] = useState<NoticiaEntrada>(vazio);
  const [erro, setErro] = useState("");
  const [edicao, setEdicao] = useState<Edicao>({ modo: "link" });
  const consulta = useQuery({ queryKey: ["noticias_admin", pagina, filtro], queryFn: () => listarConteudosAdmin(pagina, filtro), refetchInterval: 60000 });
  const categorias = useQuery({ queryKey: ["radar_categorias"], queryFn: listarCategorias });
  const salvar = useMutation({ mutationFn: () => salvarNoticia(form, id), onSuccess: (novoId) => {
    setId(novoId); setErro("");
    void cache.invalidateQueries({ queryKey: ["noticias_admin"] });
    void cache.invalidateQueries({ queryKey: ["noticias_publicadas"] });
    toast({ title: form.status === "publicado" ? "Link publicado no Radar" : "Link salvo" });
  }, onError: () => setErro("Não foi possível salvar. Confira seu acesso e tente novamente.") });
  function editar(n: Linha) {
    setId(n.id); setErro("");
    if (n.tipo === "link") { setEdicao({ modo: "link" }); setForm({ titulo: n.titulo, resumo: n.resumo, url: n.url ?? "", destino: n.destino, status: n.status, categoria_id: n.categoria_id ?? null }); return; }
    setEdicao({ modo: "texto", chave: n.id, jaPublicado: Boolean(n.publicado_em), inicial: {
      tipo: n.tipo, titulo: n.titulo, slug: n.slug ?? "", resumo: n.resumo, corpo: n.corpo ?? "", capa_url: n.capa_url, capa_alt: n.capa_alt, autor_nome: n.autor_nome,
      seo_titulo: n.seo_titulo, seo_descricao: n.seo_descricao, canonical_externo: n.canonical_externo, destino: n.destino, status: n.status, categoria_id: n.categoria_id ?? null,
    } });
  }
  function novoTexto() { setId(undefined); setErro(""); setEdicao({ modo: "texto", chave: `novo-${Date.now()}`, inicial: CONTEUDO_VAZIO, jaPublicado: false }); }
  function novoLink() { setId(undefined); setForm(vazio); setErro(""); setEdicao({ modo: "link" }); }
  return <div className="min-h-screen bg-background">
    <AppNavbar />
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminTabs />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Conteúdos</h1><p className="mt-2 text-sm text-muted-foreground">Artigos, releases e estudos publicados no Radar · links para análises do site Bewild</p></div>
        <div className="flex flex-wrap gap-2"><Button disabled={salvar.isPending} onClick={novoTexto} className="min-h-[44px]"><Plus className="mr-2 h-4 w-4" />Novo texto</Button><Button variant="outline" disabled={salvar.isPending} onClick={novoLink} className="min-h-[44px]"><Plus className="mr-2 h-4 w-4" />Novo link</Button></div>
      </header>
      <TextosDoRepositorio />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4" aria-label="Conteúdos cadastrados">
          <Label htmlFor="filtro-noticias">Status</Label>
          <Select value={filtro} onValueChange={(v) => { setFiltro(v); setPagina(0); }}><SelectTrigger id="filtro-noticias" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{Object.entries(STATUS_NOTICIA).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
          {consulta.isPending ? <p role="status">Carregando conteúdos…</p> : consulta.isError ? <div role="alert"><p>Não foi possível carregar os conteúdos.</p><Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button></div> : !consulta.data?.itens.length ? <p role="status" className="py-8 text-muted-foreground">Nenhum conteúdo neste status.</p> : <ul className="divide-y divide-border border-y border-border">{consulta.data.itens.map((n) => <li key={n.id} className="space-y-2 py-4">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{STATUS_NOTICIA[n.status]}</Badge><Badge variant="secondary">{n.tipo === "link" ? "Link" : TIPOS_CONTEUDO[n.tipo].rotulo}</Badge><span className="text-xs text-muted-foreground">{new Date(n.atualizado_em).toLocaleDateString("pt-BR")}</span></div>
            <h2 className="break-words font-display text-lg font-semibold">{n.titulo}</h2>
            <p className="break-words text-sm text-muted-foreground">{DESTINOS_NOTICIAS.find((d) => d.caminho === n.destino)?.nome ?? n.destino}</p>
            <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-[44px]" disabled={salvar.isPending} onClick={() => editar(n)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>{n.tipo === "link"
              ? n.url && <Button asChild variant="ghost" className="min-h-[44px]"><a href={n.url} target="_blank" rel="noopener noreferrer">Artigo<ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
              : n.status === "publicado" && n.slug && <Button asChild variant="ghost" className="min-h-[44px]"><Link to={caminhoConteudo(n.slug)}>Abrir o texto</Link></Button>}<Button asChild variant="ghost" className="min-h-[44px]"><Link to={n.destino}>Ver no Radar</Link></Button></div>
          </li>)}</ul>}
          <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</Button><span className="text-sm text-muted-foreground">Página {pagina + 1} · {consulta.data?.total ?? 0} itens</span><Button variant="outline" disabled={consulta.isFetching || (pagina + 1) * 20 >= (consulta.data?.total ?? 0)} onClick={() => setPagina(pagina + 1)}>Próxima</Button></div>
        </section>
        {edicao.modo === "texto"
          ? <FormConteudo key={edicao.chave} id={id} inicial={edicao.inicial} jaPublicado={edicao.jaPublicado} aoSalvar={(novoId) => setId(novoId)} />
          : <form aria-label="Editar link" className="min-w-0 space-y-5 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); const resultado = noticiaSchema.safeParse(form); if (!resultado.success) { setErro(resultado.error.issues[0]?.message ?? "Confira os campos."); return; } salvar.mutate(); }}>
          <h2 className="font-display text-xl font-semibold">{id ? "Editar link" : "Novo link para o site Bewild"}</h2>
          <fieldset disabled={salvar.isPending} className="min-w-0 space-y-5">
            <div className="space-y-2"><Label htmlFor="titulo-noticia">Título</Label><Input id="titulo-noticia" required maxLength={180} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="min-h-[44px] text-base" /></div>
            <div className="space-y-2"><Label htmlFor="url-noticia">Link do artigo no Bewild</Label><Input id="url-noticia" type="url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://bewild.com.br/conteudos/…" className="min-h-[44px] text-base" /></div>
            <div className="space-y-2"><Label htmlFor="resumo-noticia">Resumo (opcional)</Label><Textarea id="resumo-noticia" maxLength={600} value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} className="text-base" /></div>
            <div className="space-y-2"><Label htmlFor="destino-noticia">Página do Radar</Label><Select value={form.destino} onValueChange={(v) => setForm({ ...form, destino: v })}><SelectTrigger id="destino-noticia" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{DESTINOS_NOTICIAS.map((d) => <SelectItem key={d.caminho} value={d.caminho}>{d.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="categoria-noticia">Categoria</Label><Select value={form.categoria_id ?? "nenhuma"} onValueChange={(v) => setForm({ ...form, categoria_id: v === "nenhuma" ? null : v })}><SelectTrigger id="categoria-noticia" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhuma">Sem categoria</SelectItem>{(categorias.data ?? []).filter((c) => c.tipo === "post").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="status-noticia">Publicação</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as NoticiaEntrada["status"] })}><SelectTrigger id="status-noticia" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_NOTICIA).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="min-h-[44px]"><Save className="mr-2 h-4 w-4" />{salvar.isPending ? "Salvando…" : "Salvar link"}</Button>
          </fieldset>
        </form>}
      </div>
    </main>
  </div>;
}