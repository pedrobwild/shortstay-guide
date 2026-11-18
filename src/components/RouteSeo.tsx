import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  SITE_NAME, SEO_ROUTES, OG_IMAGEM, OG_IMAGEM_ALT, ROBOTS_INDEXAVEL, ROBOTS_NOINDEX,
  isPrivatePath, tituloComMarca, urlCanonica,
} from "@/lib/seo";

export type SeoProps = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  /** og:type da página: "article" nos temas do guia, "website" no resto. */
  ogType?: "website" | "article";
  keywords?: string;
  /** Imagem de compartilhamento da página (capa do texto); sem ela vale a imagem padrão do Radar. */
  imagem?: string | null;
  imagemAlt?: string | null;
  /** Canonical em outro endereço (texto cuja versão original está no bewild.com.br). */
  canonical?: string | null;
  /** Datas ISO do texto (og:type article). */
  artigo?: { publicado?: string | null; modificado?: string | null };
};

/**
 * Head de uma página (mesmas tags que o seoHead do bewild.com.br): título com a marca
 * quando cabe, description, robots, canonical + hreflang (pt-BR e x-default) só nas
 * páginas indexáveis, Open Graph e Twitter. A pré-renderização grava as mesmas tags com
 * data-rh para o Helmet assumir ao hidratar.
 */
export function Seo({ title, description, path, noindex, ogType = "website", keywords, imagem, imagemAlt, canonical, artigo }: SeoProps) {
  const url = urlCanonica(path);
  const og = imagem || OG_IMAGEM;
  const ogAlt = imagem ? imagemAlt || title : OG_IMAGEM_ALT;
  const titulo = tituloComMarca(title);
  return (
    <Helmet>
      <title>{titulo}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? ROBOTS_NOINDEX : ROBOTS_INDEXAVEL} />
      {!noindex && <link rel="canonical" href={canonical || url} />}
      {!noindex && !canonical && <link rel="alternate" hrefLang="pt-BR" href={url} />}
      {!noindex && !canonical && <link rel="alternate" hrefLang="x-default" href={url} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={titulo} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      {!noindex && <meta property="og:image" content={og} />}
      {!noindex && <meta property="og:image:alt" content={ogAlt} />}
      {!noindex && <meta name="twitter:image" content={og} />}
      {!noindex && <meta name="twitter:image:alt" content={ogAlt} />}
      {artigo?.publicado && <meta property="article:published_time" content={artigo.publicado} />}
      {artigo?.modificado && <meta property="article:modified_time" content={artigo.modificado} />}
      <meta name="twitter:title" content={titulo} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

/** Head padrão por rota. Páginas de bairro e de cada empreendimento definem o próprio head. */
export default function RouteSeo() {
  const { pathname } = useLocation();
  // Bairro define o próprio head; rotas antigas apenas redirecionam.
  // Página de texto (/conteudos/<slug>) e índices por tipo definem o próprio head.
  if (pathname.startsWith("/conteudos/")) return null;
  if (pathname.startsWith("/bairro/") || pathname.startsWith("/empreendimentos/") || pathname.startsWith("/intelligence") || pathname === "/mapa-bairros") return null;
  if (isPrivatePath(pathname)) {
    return <Seo title="Área do cliente" description="Área restrita do Radar Bewild." path={pathname} noindex />;
  }
  // Resumo do estudo: página montada com o que está no navegador da pessoa; não vai para a busca.
  if (pathname === "/resumo") {
    return <Seo title="Resumo do estudo" description="O bairro, a conta e a reforma do seu estudo no Radar Bewild, em uma página." path={pathname} noindex />;
  }
  const route = SEO_ROUTES.find((r) => r.path === pathname);
  if (!route) {
    return <Seo title="Página não encontrada" description="Esta página não existe no Radar Bewild." path={pathname} noindex />;
  }
  return (
    <Seo
      key={pathname}
      title={route.title}
      description={route.description}
      path={route.path}
      ogType={route.path.startsWith("/guia/") ? "article" : "website"}
      keywords={"keywords" in route ? (route.keywords as string) : undefined}
    />
  );
}
