import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Settings } from "lucide-react";
import { PaginaEstudo, CabecalhoTela, Container } from "@/components/estudo/Estrutura";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { listarImoveis, POR_PAGINA_IMOVEIS } from "@/lib/imoveisRadar";

export default function Imoveis() {
  const { isAdmin } = useIsAdmin();
  const [pagina, setPagina] = useState(0);
  const consulta = useQuery({ queryKey: ["imoveis_publicados", pagina], queryFn: () => listarImoveis(pagina, true), refetchInterval: 60000 });
  return <PaginaEstudo>
    <CabecalhoTela rotulo="Oportunidades · Bewild" titulo="Imóveis" lead="Studios anunciados, com foto, descrição e o link para o anúncio original." acao={isAdmin ? <Button asChild variant="outline" className="min-h-11"><Link to="/admin/imoveis"><Settings className="mr-2 h-4 w-4" />Cadastrar imóveis</Link></Button> : undefined} />
    <Container className="space-y-6 pb-12">
      {consulta.isPending ? <p role="status" className="py-12 text-muted-foreground">Carregando imóveis…</p>
        : consulta.isError ? <div role="alert" className="space-y-4 py-12"><p>Não foi possível carregar os imóveis.</p><Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button></div>
        : !consulta.data?.imoveis.length ? <p role="status" className="py-12 text-muted-foreground">Nenhum imóvel publicado ainda.</p>
        : <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{consulta.data.imoveis.map((i) => <li key={i.id} className="min-w-0">
          <article className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-card">
            <img src={i.foto_url} alt={`Foto do imóvel: ${i.titulo}`} loading="lazy" className="aspect-[4/3] w-full object-cover bg-muted" />
            <div className="flex flex-1 flex-col gap-3 p-5">
              {i.bairro && <span className="text-sm text-muted-foreground">{i.bairro}</span>}
              <h2 className="e-h3 break-words">{i.titulo}</h2>
              {i.descricao && <p className="e-apoio flex-1 whitespace-pre-line break-words">{i.descricao}</p>}
              <Button asChild className="mt-2 min-h-11 w-full"><a href={i.anuncio_url} target="_blank" rel="noopener noreferrer">Ver imóvel<ArrowUpRight aria-label="Abre em nova aba" className="ml-2 h-4 w-4" /></a></Button>
            </div>
          </article>
        </li>)}</ul>}
      {(consulta.data?.total ?? 0) > POR_PAGINA_IMOVEIS && <nav aria-label="Páginas de imóveis" className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</Button><span className="text-sm">Página {pagina + 1}</span><Button variant="outline" disabled={consulta.isFetching || (pagina + 1) * POR_PAGINA_IMOVEIS >= (consulta.data?.total ?? 0)} onClick={() => setPagina(pagina + 1)}>Próxima</Button></nav>}
    </Container>
  </PaginaEstudo>;
}
