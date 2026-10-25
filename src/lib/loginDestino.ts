/** Destinos locais permitidos; redirecionar não concede permissão. */
export function destinoAposLogin(isAdmin: boolean, destino?: string): string {
  const caminho = destino?.split(/[?#]/)[0];
  if (caminho === "/posts") return destino ?? "/posts";
  const admin = ["/admin", "/admin/coletas", "/admin/fontes", "/admin/seo", "/admin/google", "/admin/analytics", "/admin/noticias", "/admin/usuarios", "/admin/categorias", "/admin/compartilhamento", "/admin/mercado", "/admin/bairros", "/admin/leads", "/admin/simulacoes"];
  if (isAdmin && caminho && admin.includes(caminho)) return destino ?? "/admin";
  if (caminho === "/painel" || caminho === "/projetos") return destino ?? "/painel";
  return isAdmin ? "/admin" : "/painel";
}
