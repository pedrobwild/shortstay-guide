import { useEffect } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { Seo } from "@/components/RouteSeo";
import NovaAba from "@/components/NovaAba";
import OrcamentoButton from "@/components/OrcamentoButton";
import BairroNoRadar from "@/components/empreendimentos/BairroNoRadar";
import FotoPredio from "@/components/empreendimentos/FotoPredio";
import SeloBewild from "@/components/empreendimentos/SeloBewild";
import { CabecalhoTela, Container, PaginaEstudo, Secao } from "@/components/estudo/Estrutura";
import Metadados from "@/components/estudo/Metadados";
import AvisoBase from "@/components/radar/AvisoBase";
import { Button } from "@/components/ui/button";
import { BairroProvider } from "@/hooks/useBairroData";
import { useBaseEstudo } from "@/hooks/useBaseEstudo";
import { definirBairroAtual } from "@/lib/bairroAtual";
import {
  bairroNaBase, buscarEmpreendimento, CAMINHO_CATALOGO, caminhoEmpreendimento, descricaoSeo, itensFicha, linkMapa, slugEmpreendimento,
  textoFonte, type Empreendimento,
} from "@/lib/empreendimentos";
import { slugifyBairro } from "@/lib/seo";

/**
 * /empreendimentos/:slug — página completa do prédio: ficha (bairro, endereço,
 * incorporadora, situação, unidades), localização com link para o mapa, diferenciais
 * com a fonte oficial e a data da consulta, os números do bairro no Radar (com a
 * natureza do dado) e o selo da Bewild. Sem nome de cliente nem unidade.
 */
export default function EmpreendimentoDetalhe() {
  return (
    <BairroProvider>
      <PaginaEstudo>
        <Pagina />
      </PaginaEstudo>
    </BairroProvider>
  );
}

function Pagina() {
  const { slug: bruto = "" } = useParams<{ slug: string }>();
  const { search, hash } = useLocation();
  const slug = slugEmpreendimento(bruto);
  const consulta = useQuery({ queryKey: ["empreendimento", slug], queryFn: () => buscarEmpreendimento(slug), enabled: slug.length > 0, staleTime: 5 * 60 * 1000 });

  if (bruto !== slug) return <Navigate to={`${caminhoEmpreendimento(slug)}${search}${hash}`} replace />;

  if (consulta.isPending) {
    return (
      <>
        <Seo title="Empreendimento" description="Empreendimento no Radar Bewild." path={caminhoEmpreendimento(slug)} noindex />
        <Container className="py-16"><p role="status" aria-busy="true" className="e-apoio">Carregando o empreendimento…</p></Container>
      </>
    );
  }

  if (consulta.isError) {
    return (
      <>
        <Seo title="Empreendimento" description="Empreendimento no Radar Bewild." path={caminhoEmpreendimento(slug)} noindex />
        <Container className="py-16">
          <AvisoBase tom="erro" onTentar={() => void consulta.refetch()}>Não foi possível carregar este empreendimento agora.</AvisoBase>
        </Container>
      </>
    );
  }

  if (!consulta.data) {
    return (
      <>
        <Seo title="Empreendimento não encontrado" description="Este empreendimento não está no catálogo do Radar Bewild." path={caminhoEmpreendimento(slug)} noindex />
        <CabecalhoTela rotulo="Empreendimentos" titulo="Este empreendimento não está no catálogo" lead="Ele pode ter saído da lista ou o endereço mudou. Veja os empreendimentos publicados.">
          <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold"><Link to={CAMINHO_CATALOGO}>Ver todos os empreendimentos</Link></Button>
        </CabecalhoTela>
      </>
    );
  }

  return <Conteudo e={consulta.data} />;
}

function Conteudo({ e }: { e: Empreendimento }) {
  const { bairros } = useBaseEstudo();
  const naBase = bairroNaBase(e.bairro, bairros);
  // Lembra o bairro para as outras telas do Radar, só quando ele está na base (como na página de bairro).
  useEffect(() => { if (naBase) definirBairroAtual(naBase.name); }, [naBase]);
  const voltar = `${CAMINHO_CATALOGO}?bairro=${slugifyBairro(e.bairro)}`;

  return (
    <>
      <Seo title={`${e.nome}, ${e.bairro}`} description={descricaoSeo(e)} path={caminhoEmpreendimento(e.slug)} keywords={`${e.nome}, ${e.bairro}, studio short stay, empreendimento são paulo`} />

      <Container className="pt-6">
        <nav aria-label="Caminho">
          <Link to={CAMINHO_CATALOGO} className="e-link inline-flex min-h-[44px] items-center gap-2"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Empreendimentos</Link>
        </nav>
      </Container>

      <Container className="grid gap-8 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-start lg:gap-14 lg:pb-14">
        <div className="min-w-0">
          <p className="e-rotulo mb-4">Empreendimento · {e.bairro}</p>
          <h1 className="e-h1 text-balance break-words">{e.nome}</h1>
          {e.resumo && <p className="e-lead mt-4 max-w-[640px] text-pretty">{e.resumo}</p>}
          {e.selo_bewild && <SeloBewild comNota className="mt-6" />}
          <Metadados itens={itensFicha(e)} className="mt-8" />
        </div>
        <FotoPredio e={e} prioridade credito className="min-w-0" />
      </Container>

      <Secao id="localizacao" rotulo="Localização" titulo={e.endereco ? `${e.endereco}, ${e.bairro}` : `Em ${e.bairro}, São Paulo`}>
        <div className="flex flex-wrap gap-x-6">
          <a href={linkMapa(e)} target="_blank" rel="noopener noreferrer" className="e-link inline-flex min-h-[44px] items-center gap-2">
            <MapPin aria-hidden="true" className="h-4 w-4" />Ver no Google Maps<NovaAba />
          </a>
          {naBase && (
            <Link to={`/mapa?bairro=${slugifyBairro(naBase.name)}`} className="e-link inline-flex min-h-[44px] items-center">Ver {naBase.name} no mapa do Radar</Link>
          )}
        </div>
        {!e.endereco && <p className="e-legenda mt-2">A página oficial não informa o número; o link busca pelo nome do prédio.</p>}
      </Secao>

      {e.diferenciais.length > 0 && (
        <Secao id="diferenciais" rotulo="Diferenciais" titulo="O que o prédio oferece">
          <ul className="grid max-w-[880px] gap-x-10 gap-y-3 sm:grid-cols-2">
            {e.diferenciais.map((d) => (
              <li key={d} className="flex min-w-0 gap-3 border-t border-border pt-3 text-[17px] leading-7">
                <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 bg-ciano-700" />
                <span className="min-w-0 break-words">{d}</span>
              </li>
            ))}
          </ul>
          <p className="e-legenda mt-6">
            Conforme {textoFonte(e)}.
            {e.fonte_url && (
              <> <a href={e.fonte_url} target="_blank" rel="noopener noreferrer" className="e-link inline-flex min-h-[44px] items-center gap-1">Abrir a página oficial<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /><NovaAba /></a></>
            )}
          </p>
        </Secao>
      )}

      <Secao id="bairro" rotulo="O bairro no Radar" titulo={naBase ? `Os números de ${naBase.name} para short stay` : `${e.bairro} ainda não está na base do Radar`}>
        <BairroNoRadar bairro={e.bairro} />
      </Secao>

      <Secao id="bewild" rotulo="Bewild" titulo="Reforma completa para studio, do projeto à entrega">
        <p className="e-apoio max-w-[720px]">
          {e.selo_bewild ? "A Bewild já atua neste prédio. " : ""}Se você tem ou vai comprar uma unidade, veja o custo e o prazo de uma reforma completa no Radar.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="min-h-[44px] px-5 text-[15px] font-semibold"><Link to="/reformar">Ver custo e prazo de reforma</Link></Button>
          <OrcamentoButton local="empreendimentos" variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold" />
          <Button asChild variant="ghost" className="min-h-[44px] px-5 text-[15px] font-semibold"><Link to={voltar}>Outros empreendimentos em {e.bairro}</Link></Button>
        </div>
      </Secao>
    </>
  );
}
