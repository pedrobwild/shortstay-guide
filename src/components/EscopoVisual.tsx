import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { isPrivatePath } from "@/lib/seo";

/** Classe do <html> que liga os tokens do redesign "Estudo aberto" (src/index.css). */
export const CLASSE_ESTUDO = "estudo";

/** As telas públicas usam o Estudo aberto; conta, painel e admin seguem no visual anterior. */
export const usaEstudo = (pathname: string) => !isPrivatePath(pathname);

const useLayoutIsomorfico = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Liga ou desliga a classe `estudo` no <html> conforme a rota, antes da pintura.
 * O index.html e as páginas pré-renderizadas já saem com a classe; ao navegar para
 * /login, /painel, /projetos ou /admin ela sai, e volta ao retornar a uma tela pública.
 * Fica no <html> (e não num wrapper) para que menus, diálogos e popovers em portal
 * também herdem os tokens.
 */
export default function EscopoVisual() {
  const { pathname } = useLocation();
  useLayoutIsomorfico(() => {
    document.documentElement.classList.toggle(CLASSE_ESTUDO, usaEstudo(pathname));
  }, [pathname]);
  return null;
}
