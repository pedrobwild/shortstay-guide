/** Destinos locais permitidos; redirecionar não concede permissão. */
export function destinoAposLogin(isAdmin: boolean, destino?: string): string {
  const caminho = destino?.split(/[?#]/)[0];
  const admin = ["/admin", "/admin/coletas", "/admin/fontes", "/admin/mercado", "/admin/bairros", "/admin/leads", "/admin/simulacoes", "/admin/usuarios"];
  if (isAdmin && caminho && admin.includes(caminho)) return destino ?? "/admin";
  if (caminho === "/painel" || caminho === "/projetos") return destino ?? "/painel";
  return isAdmin ? "/admin" : "/painel";
}
