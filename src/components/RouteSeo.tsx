import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SITE_NAME, SITE_URL, SEO_ROUTES, isPrivatePath } from "@/lib/seo";

type SeoProps = { title: string; description: string; path: string; noindex?: boolean };

export function Seo({ title, description, path, noindex }: SeoProps) {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

/** Head padrão por rota. Páginas de bairro definem o próprio head. */
export default function RouteSeo() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/bairro/")) return null;
  if (isPrivatePath(pathname)) {
    return <Seo title={`Área do cliente | ${SITE_NAME}`} description="Área restrita do Radar Bewild." path={pathname} noindex />;
  }
  const route = SEO_ROUTES.find((r) => r.path === pathname);
  if (!route) {
    return <Seo title={`Página não encontrada | ${SITE_NAME}`} description="Página não encontrada." path={pathname} noindex />;
  }
  return <Seo title={route.title} description={route.description} path={route.path} />;
}
