import { useEffect, useRef, useState } from "react";

/**
 * Largura disponível de um elemento, em px (ResizeObserver). Os gráficos em SVG
 * próprio desenham na largura real, para o texto ficar sempre no mesmo tamanho
 * de tela. `inicial` vale na pré-renderização e antes da primeira medida.
 */
export function useLargura<T extends HTMLElement>(inicial: number) {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(inicial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => { const w = el.clientWidth; if (w > 0) setLargura(w); };
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, largura };
}
