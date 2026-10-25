import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react";
import { PaginaEstudo, CabecalhoTela, Container } from "@/components/estudo/Estrutura";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import EnviarPost from "@/components/posts/EnviarPost";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { listarCategorias } from "@/lib/categoriasRadar";
import { DESTINOS_NOTICIAS, listarPostsPublicos } from "@/lib/noticiasRadar";

export default function Posts() {
  const { user } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [categoria, setCategoria] = useState("todas");
  const categorias = useQuery({ queryKey: ["radar_categorias"], queryFn: listarCategorias });
  const consulta = useQuery({ queryKey: ["noticias_publicadas", "posts", pagina, categoria], queryFn: () => listarPostsPublicos(pagina, categoria === "todas" ? undefined : categoria), refetchInterval: 60000 });
  return <PaginaEstudo>
    <CabecalhoTela rotulo="Leituras · Bewild" titulo="Posts" lead="Análises do Bewild sobre studios, bairros e o mercado de short stay." acao={loading ? undefined : isAdmin ? <Button className="min-h-11" onClick={() => setAberto(true)}><Plus className="mr-2 h-4 w-4" />Enviar artigo</Button> : !user ? <Button asChild variant="outline" className="min-h-11"><Link to="/login" state={{ from: "/posts" }}>Entrar para enviar</Link></Button> : undefined} />
    <Container className="space-y-6 pb-12">
      <div className="max-w-sm space-y-2"><Label htmlFor="posts-categoria">Categoria</Label><Select value={categoria} onValueChange={(v) => { setCategoria(v); setPagina(0); }}><SelectTrigger id="posts-categoria" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as categorias</SelectItem>{(categorias.data ?? []).filter((c) => c.tipo === "post").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
      {consulta.isPending ? <p role="status" className="py-12 text-muted-foreground">Carregando artigos…</p> : consulta.isError ? <div role="alert" className="space-y-4 py-12"><p>Não foi possível carregar os artigos.</p><Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button></div> : !consulta.data?.posts.length ? <p role="status" className="py-12 text-muted-foreground">Nenhum artigo publicado{categoria !== "todas" ? " nesta categoria" : " ainda"}.</p> : <ul className="divide-y divide-border border-y border-border">{consulta.data.posts.map((post) => <li key={post.id} className="min-w-0 py-7 sm:py-9">
        <article className="max-w-3xl space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground"><span>Bewild</span>{categorias.data?.find((c) => c.id === post.categoria_id)?.nome && <span>{categorias.data.find((c) => c.id === post.categoria_id)?.nome}</span>}</div>
          <h2 className="e-h2 break-words"><a href={post.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-start gap-3 text-foreground hover:text-primary">{post.titulo}<ArrowUpRight aria-label="Abre em nova aba" className="mt-1 h-5 w-5 shrink-0" /></a></h2>
          {post.resumo && <p className="e-apoio break-words">{post.resumo}</p>}
          <Link to={post.destino} className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">{DESTINOS_NOTICIAS.find((d) => d.caminho === post.destino)?.nome ?? "Ver dados no Radar"}</Link>
        </article>
      </li>)}</ul>}
      {(consulta.data?.total ?? 0) > 12 && <nav aria-label="Páginas de posts" className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</Button><span className="text-sm">Página {pagina + 1}</span><Button variant="outline" disabled={consulta.isFetching || (pagina + 1) * 12 >= (consulta.data?.total ?? 0)} onClick={() => setPagina(pagina + 1)}>Próxima</Button></nav>}
    </Container>
    {isAdmin && aberto && <EnviarPost aberto={aberto} fechar={() => setAberto(false)} />}
  </PaginaEstudo>;
}