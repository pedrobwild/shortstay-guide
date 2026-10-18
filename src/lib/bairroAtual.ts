/**
 * Bairro atual da pessoa: a escolha feita no hero, no mapa, no simulador ou na
 * página de bairro acompanha as outras telas (mapa, comparador e simulador) sem
 * precisar escolher de novo. Vive só neste navegador (localStorage, via retomada.ts,
 * 30 dias) e é só o nome e o slug do bairro — nenhum dado pessoal.
 *
 * A URL (?bairro=) continua mandando quando existe; o bairro atual só preenche o
 * que a URL não trouxe.
 */
import { useEffect, useState } from "react";
import { lembrarBairro, lerUltimoBairro, type UltimoBairro } from "@/lib/retomada";
import { slugifyBairro } from "@/lib/seo";

export const EVENTO_BAIRRO_ATUAL = "radar:bairro-atual";

/** Grava o bairro atual e avisa as telas abertas. */
export function definirBairroAtual(nome: string) {
  const slug = slugifyBairro(nome);
  lembrarBairro(slug, nome);
  try { window.dispatchEvent(new CustomEvent(EVENTO_BAIRRO_ATUAL, { detail: { slug, nome } })); } catch { /* sem window: nada a avisar */ }
}

/**
 * Bairro atual, lido depois da montagem (o HTML pré-renderizado não tem bairro,
 * então o servidor e a hidratação coincidem) e atualizado quando outra tela grava.
 */
export function useBairroAtual(): UltimoBairro | null {
  const [atual, setAtual] = useState<UltimoBairro | null>(null);
  useEffect(() => {
    setAtual(lerUltimoBairro());
    const aoMudar = () => setAtual(lerUltimoBairro());
    window.addEventListener(EVENTO_BAIRRO_ATUAL, aoMudar);
    window.addEventListener("storage", aoMudar);
    return () => {
      window.removeEventListener(EVENTO_BAIRRO_ATUAL, aoMudar);
      window.removeEventListener("storage", aoMudar);
    };
  }, []);
  return atual;
}

/** Acrescenta ?bairro=slug a um caminho interno quando há bairro atual. */
export function caminhoComBairro(caminho: string, bairro: UltimoBairro | null | undefined): string {
  if (!bairro) return caminho;
  const [base, hash] = caminho.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}bairro=${encodeURIComponent(bairro.slug)}${hash ? `#${hash}` : ""}`;
}
