import { useEffect, useState } from "react";

/**
 * Acompanha uma media query (ex.: "(min-width: 1024px)"). O valor inicial já é
 * lido no primeiro render do navegador para evitar troca de layout; fora do
 * navegador (pré-renderização) usa `padrao`.
 */
export function useMediaQuery(query: string, padrao = false): boolean {
  const ler = () => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : padrao);
  const [corresponde, setCorresponde] = useState(ler);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const atualizar = () => setCorresponde(mql.matches);
    atualizar();
    mql.addEventListener("change", atualizar);
    return () => mql.removeEventListener("change", atualizar);
  }, [query]);
  return corresponde;
}
