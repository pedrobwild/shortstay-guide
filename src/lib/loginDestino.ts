import { ARTIGOS_EXCLUSIVOS, CAMINHO_AREA_EXCLUSIVA, caminhoArtigoExclusivo } from "@/data/artigosExclusivos";

/** Destino padrão de quem entra sem papel de admin: a área exclusiva. */
export const DESTINO_PADRAO_CONTA = CAMINHO_AREA_EXCLUSIVA;

const AREA_EXCLUSIVA = [CAMINHO_AREA_EXCLUSIVA, ...ARTIGOS_EXCLUSIVOS.map((a) => caminhoArtigoExclusivo(a.slug))];

/**
 * Destinos locais permitidos; redirecionar não concede permissão. Admin volta à tela
 * de admin pedida (ou abre /admin); as demais contas voltam à página pedida da área
 * exclusiva, do painel ou dos projetos, ou abrem a área exclusiva.
 */
export function destinoAposLogin(isAdmin: boolean, destino?: string): string {
  const caminho = destino?.split(/[?#]/)[0];
  if (caminho === "/posts") return destino ?? "/posts";
  const admin = ["/admin", "/admin/coletas", "/admin/fontes", "/admin/seo", "/admin/google", "/admin/analytics", "/admin/noticias", "/admin/imoveis", "/admin/usuarios", "/admin/categorias", "/admin/compartilhamento", "/admin/mercado", "/admin/bairros", "/admin/leads", "/admin/simulacoes"];
  if (isAdmin && caminho && admin.includes(caminho)) return destino ?? "/admin";
  if (caminho && AREA_EXCLUSIVA.includes(caminho)) return destino ?? CAMINHO_AREA_EXCLUSIVA;
  if (caminho === "/painel" || caminho === "/projetos") return destino ?? "/painel";
  return isAdmin ? "/admin" : DESTINO_PADRAO_CONTA;
}
