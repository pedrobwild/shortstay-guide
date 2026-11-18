import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus, Rss } from "lucide-react";
import { PaginaEstudo, CabecalhoTela, Container } from "@/components/estudo/Estrutura";
import { Seo } from "@/components/RouteSeo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import EnviarPost from "@/components/posts/EnviarPost";
import NovaAba from "@/components/NovaAba";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { listarCategorias } from "@/lib/categoriasRadar";
import { DESTINOS_NOTICIAS } from "@/lib/noticiasRadar";
import {
  CAMINHO_CONTEUDOS, CAMINHO_FEED, POR_PAGINA, TIPOS_CONTEUDO, TIPOS_CONTEUDO_LISTA, caminhoConteudo, caminhoTipo, dataExtenso,
  listarConteudosPublicos, type TipoConteudo,
} from "@/lib/conteudosRadar";
import { SEO_ROUTES } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * Índice dos conteúdos do Radar: textos próprios (artigos, releases e estudos, com página em
 * /conteudos/<slug>) e os links para análises do site Bewild, na mesma lista, do mais recente
 * para o mais antigo. Com `tipo`, é o índice daquele tipo (/conteudos/artigos etc.).
 */
export default function Conteudos({ tipo }: { tipo?: TipoConteudo }) {
  const { isAdmin, loading } = useIsAdmin();
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [categoria, setCategoria] = useState("todas");
  const caminho = tipo ? caminhoTipo(tipo) : CAMINHO_CONTEUDOS;
  const rota = SEO_ROUTES.find((r) => r.path === caminho);
  const categorias = useQuery({ queryKey: ["radar_categorias"], queryFn: listarCategorias });
  const consulta = useQuery({
    queryKey: ["noticias_publicadas", "conteudos", tipo ?? "todos", pagina, categoria],
    queryFn: () => listarConteudosPublicos(pagina, tipo, categoria === "todas" ? undefined : categoria),
    refetchInterval: 60000,
  });
  const total = consulta.data?.total ?? 0;
  const nomeCategoria = (id: string | null) => categorias.data?.find((c) => c.id === id)?.nome;
  const abas: { para: string; rotulo: string; ativa: boolean }[] = [
    { para: CAMINHO_CONTEUDOS, rotulo: "Tudo", ativa: !tipo },
    ...TIPOS_CONTEUDO_LISTA.map((t) => ({ para: caminhoTipo(t), rotulo: TIPOS_CONTEUDO[t].plural, ativa: t === tipo })),
  ];

  return (
    <PaginaEstudo>
      {/* /conteudos tem o head do RouteSeo; o índice por tipo define o próprio. */}
      {tipo && rota && <Seo title={rota.title} description={rota.description} path={rota.path} keywords={"keywords" in rota ? (rota.keywords as string) : undefined} />}
      <CabecalhoTela
        rotulo="Leituras · Bewild"
        titulo={tipo ? TIPOS_CONTEUDO[tipo].plural : "Conteúdos"}
        lead={tipo ? TIPOS_CONTEUDO[tipo].descricao : "Artigos, releases e estudos do Radar Bewild sobre studios e short stay em São Paulo, com a fonte e o período de cada número."}
        acao={loading ? undefined : isAdmin
          ? <div className="flex flex-wrap gap-2"><Button asChild className="min-h-11"><Link to="/admin/noticias"><Plus className="mr-2 h-4 w-4" />Novo texto</Link></Button><Button variant="outline" className="min-h-11" onClick={() => setAberto(true)}>Adicionar link</Button></div>
          : undefined}
      />
      <Container className="space-y-6 pb-12">
        <nav aria-label="Tipos de conteúdo" className="flex flex-wrap gap-2">
          {abas.map((a) => (
            <Link key={a.para} to={a.para} aria-current={a.ativa ? "page" : undefined} onClick={() => setPagina(0)}
              className={cn("inline-flex min-h-11 items-center rounded-sm border px-4 text-sm", a.ativa ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground")}>
              {a.rotulo}
            </Link>
          ))}
          <a href={CAMINHO_FEED} className="ml-auto inline-flex min-h-11 items-center gap-2 text-sm text-primary underline underline-offset-4"><Rss className="h-4 w-4" aria-hidden="true" />Feed RSS</a>
        </nav>
        {(categorias.data ?? []).some((c) => c.tipo === "post") && (
          <div className="max-w-sm space-y-2">
            <Label htmlFor="conteudos-categoria">Categoria</Label>
            <Select value={categoria} onValueChange={(v) => { setCategoria(v); setPagina(0); }}>
              <SelectTrigger id="conteudos-categoria" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {(categorias.data ?? []).filter((c) => c.tipo === "post").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {consulta.isPending ? <p role="status" className="py-12 text-muted-foreground">Carregando conteúdos…</p>
          : consulta.isError ? <div role="alert" className="space-y-4 py-12"><p>Não foi possível carregar os conteúdos.</p><Button variant="outline" className="min-h-11" onClick={() => consulta.refetch()}>Tentar novamente</Button></div>
          : !consulta.data?.itens.length ? <p role="status" className="py-12 text-muted-foreground">Nenhum texto publicado{categoria !== "todas" ? " nesta categoria" : tipo ? " neste tipo" : ""} ainda.</p>
          : (
            <ul className="divide-y divide-border border-y border-border">
              {consulta.data.itens.map((item) => {
                const proprio = item.tipo !== "link" && item.slug;
                const data = item.publicado_em ?? item.atualizado_em;
                return (
                  <li key={item.id} className="min-w-0 py-7 sm:py-9">
                    <article className="max-w-3xl space-y-3">
                      <div className="e-legenda flex flex-wrap gap-x-3 gap-y-1">
                        <span>{item.tipo === "link" ? "No site Bewild" : TIPOS_CONTEUDO[item.tipo].rotulo}</span>
                        <time dateTime={data}>{dataExtenso(data)}</time>
                        {nomeCategoria(item.categoria_id) && <span>{nomeCategoria(item.categoria_id)}</span>}
                      </div>
                      <h2 className="e-h2 break-words">
                        {proprio
                          ? <Link to={caminhoConteudo(item.slug as string)} className="inline-flex min-h-11 items-start text-foreground hover:text-primary">{item.titulo}</Link>
                          : <a href={item.url ?? "#"} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-start gap-3 text-foreground hover:text-primary">{item.titulo}<ArrowUpRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" /><NovaAba /></a>}
                      </h2>
                      {item.resumo && <p className="e-apoio break-words">{item.resumo}</p>}
                      <Link to={item.destino} className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">{DESTINOS_NOTICIAS.find((d) => d.caminho === item.destino)?.nome ?? "Ver dados no Radar"}</Link>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        {total > POR_PAGINA && (
          <nav aria-label="Páginas de conteúdos" className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" className="min-h-11" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <span className="text-sm tabular-nums">Página {pagina + 1} de {Math.ceil(total / POR_PAGINA)}</span>
            <Button variant="outline" className="min-h-11" disabled={consulta.isFetching || (pagina + 1) * POR_PAGINA >= total} onClick={() => setPagina(pagina + 1)}>Próxima</Button>
          </nav>
        )}
      </Container>
      {isAdmin && aberto && <EnviarPost aberto={aberto} fechar={() => setAberto(false)} />}
    </PaginaEstudo>
  );
}
