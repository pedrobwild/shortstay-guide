import { Navigate, useLocation } from "react-router-dom";
import { caminhoCanonico } from "@/lib/seo";

/** Prefixos onde o caminho pode ter maiúsculas (ids) ou onde não mexemos. */
const PREFIXOS_LIVRES = ["/projeto/", "/admin", "/painel", "/reset-password"];

/**
 * Endereço com barra no fim ou com maiúsculas vira o canônico (minúsculas, sem barra),
 * mantendo query e hash — a versão do cliente do lowercasePathRedirect do bewild.com.br
 * (lá é 301 no servidor; aqui a SPA não controla o servidor, e o canonical + este
 * redirecionamento evitam duas URLs para a mesma página).
 */
export function caminhoNormalizado(pathname: string): string | null {
  if (PREFIXOS_LIVRES.some((p) => pathname.startsWith(p))) return null;
  // Compara a forma decodificada: "%C3%A9" e "%c3%a9" são o mesmo caminho e não podem gerar um laço.
  let atual = pathname;
  try { atual = decodeURI(pathname); } catch { /* mantém o valor bruto */ }
  const alvo = caminhoCanonico(atual).toLowerCase();
  return alvo === atual ? null : alvo;
}

export default function NormalizarCaminho() {
  const { pathname, search, hash } = useLocation();
  const alvo = caminhoNormalizado(pathname);
  return alvo ? <Navigate to={`${alvo}${search}${hash}`} replace /> : null;
}
