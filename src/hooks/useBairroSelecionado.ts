import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { BairroCurado } from "@/data/bairrosCurados";
import { definirBairroAtual, useBairroAtual } from "@/lib/bairroAtual";
import { slugifyBairro } from "@/lib/seo";

/** Bairro padrão das telas quando a pessoa ainda não escolheu nenhum (direcionamento, seção 5). */
export const BAIRRO_PADRAO = "Pinheiros";

/**
 * Bairro selecionado, compartilhado entre todas as telas do Radar: a URL (?bairro=)
 * manda quando existe; depois vale o bairro atual guardado (bairroAtual.ts, lido após
 * a montagem); sem nenhum dos dois, Pinheiros. Selecionar grava o bairro atual e,
 * com `naUrl`, troca o ?bairro= sem empilhar histórico.
 */
export function useBairroSelecionado<T extends Pick<BairroCurado, "name">>(bairros: T[], { naUrl = true }: { naUrl?: boolean } = {}) {
  const [params, setParams] = useSearchParams();
  const atual = useBairroAtual();
  const slugUrl = params.get("bairro");
  const porSlug = useMemo(() => new Map(bairros.map((b) => [slugifyBairro(b.name), b])), [bairros]);
  const bairro =
    (slugUrl ? porSlug.get(slugUrl) : undefined) ??
    (atual ? porSlug.get(atual.slug) : undefined) ??
    porSlug.get(slugifyBairro(BAIRRO_PADRAO)) ??
    bairros[0] ??
    null;

  const selecionar = useCallback((nome: string) => {
    definirBairroAtual(nome);
    if (naUrl) {
      setParams((p) => { const n = new URLSearchParams(p); n.set("bairro", slugifyBairro(nome)); return n; }, { replace: true, preventScrollReset: true });
    }
  }, [naUrl, setParams]);

  return { bairro, selecionar, origem: slugUrl && porSlug.has(slugUrl) ? "url" as const : atual && porSlug.has(atual.slug) ? "guardado" as const : "padrao" as const };
}
