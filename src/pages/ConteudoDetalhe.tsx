import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { PaginaEstudo, Container } from "@/components/estudo/Estrutura";
import { Seo } from "@/components/RouteSeo";
import { Button } from "@/components/ui/button";
import OrcamentoButton from "@/components/OrcamentoButton";
import ConteudoArtigo from "@/components/conteudos/ConteudoArtigo";
import { CAMINHO_CONTEUDOS, caminhoConteudo, paginaSeoConteudo } from "@/lib/conteudosRadar";
import { buscarConteudo, conteudoDoRepositorio, conteudosRelacionados } from "@/lib/conteudosPublicos";
import { conteudoJsonLd, isoSaoPaulo } from "@/lib/seoJsonLd";

/**
 * /conteudos/<slug>: página de um artigo, release ou estudo publicado. Os índices por tipo
 * (/conteudos/artigos, /releases, /estudos) têm rota própria em App.tsx. Rascunho, arquivado
 * ou endereço que não existe: página não encontrada, com noindex.
 */
export default function ConteudoDetalhe() {
  const { slug = "" } = useParams<{ slug: string }>();
  // Texto do repositório já vem no pacote do app: abre sem esperar a rede.
  const consulta = useQuery({ queryKey: ["conteudo", slug], queryFn: () => buscarConteudo(slug), staleTime: 60_000, initialData: conteudoDoRepositorio(slug) ?? undefined });
  const c = consulta.data ?? null;
  const relacionados = useQuery({ queryKey: ["conteudo_relacionados", c?.id], queryFn: () => conteudosRelacionados(c!), enabled: Boolean(c), staleTime: 60_000 });

  // Carregando e erro: sem <Seo>, o head pré-renderizado da página continua valendo.
  if (consulta.isPending) {
    return <PaginaEstudo><Container className="py-16"><p role="status" className="text-muted-foreground">Carregando o texto…</p></Container></PaginaEstudo>;
  }
  if (consulta.isError) {
    return (
      <PaginaEstudo>
        <Container className="space-y-4 py-16">
          <div role="alert" className="space-y-4"><p>Não foi possível carregar este texto.</p><Button variant="outline" className="min-h-11" onClick={() => consulta.refetch()}>Tentar novamente</Button></div>
        </Container>
      </PaginaEstudo>
    );
  }
  if (!c) {
    return (
      <PaginaEstudo>
        <Seo title="Texto não encontrado" description="Este texto não está publicado no Radar Bewild." path={caminhoConteudo(slug)} noindex />
        <Container className="space-y-4 py-16">
          <h1 className="e-h1">Texto não encontrado</h1>
          <p className="e-lead max-w-[720px]">Este endereço não tem um texto publicado. Ele pode ter mudado de lugar ou saído do ar.</p>
          <p><Link to={CAMINHO_CONTEUDOS} className="e-link inline-flex min-h-11 items-center">Ver todos os conteúdos</Link></p>
        </Container>
      </PaginaEstudo>
    );
  }

  const seo = paginaSeoConteudo(c);
  return (
    <PaginaEstudo>
      <Seo
        title={seo.title}
        description={seo.description}
        path={seo.path}
        ogType="article"
        imagem={c.capa_url}
        imagemAlt={c.capa_alt}
        canonical={c.canonical_externo}
        artigo={{ publicado: c.publicado_em ? isoSaoPaulo(c.publicado_em) : null, modificado: isoSaoPaulo(c.atualizado_em) }}
      />
      {/* O HTML pré-renderizado já traz este nó; aqui ele cobre o texto publicado depois do último build. */}
      <Helmet><script type="application/ld+json">{JSON.stringify(conteudoJsonLd(c)).replace(/</g, "\\u003c")}</script></Helmet>
      <Container>
        <ConteudoArtigo c={c} relacionados={relacionados.data ?? []} />
        <section aria-label="Orçamento de reforma" className="mb-8 max-w-[720px] border-t border-border pt-6">
          <h2 className="e-h3">Vai reformar um studio?</h2>
          <p className="e-apoio mt-2">A Bewild faz a reforma completa, com projeto, obra, marcenaria sob medida e mobiliário em um só contrato.</p>
          <OrcamentoButton local="conteudos" className="mt-4" />
        </section>
      </Container>
    </PaginaEstudo>
  );
}
