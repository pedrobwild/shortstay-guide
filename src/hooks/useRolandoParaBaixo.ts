import { useEffect, useState } from "react";

/** Distância mínima (px) entre duas leituras para contar como mudança de direção. */
const FOLGA = 8;
/** Perto do topo o conteúdo ainda não está sob o botão: nada é recolhido. */
const TOPO = 80;

/**
 * Decide, a partir da posição anterior e da atual, se a pessoa está rolando para
 * baixo. Devolve `anterior` quando o deslocamento é menor que a folga (evita piscar).
 */
export function direcaoDaRolagem(yAnterior: number, yAtual: number, anterior: boolean): boolean {
  if (yAtual < TOPO) return false;
  const delta = yAtual - yAnterior;
  if (Math.abs(delta) < FOLGA) return anterior;
  return delta > 0;
}

/**
 * true enquanto a pessoa rola a página para baixo (lendo); false ao rolar para cima
 * ou perto do topo. Usado para recolher o botão flutuante do assistente no celular,
 * que cobria texto e números. Lido depois da montagem.
 */
export function useRolandoParaBaixo(): boolean {
  const [descendo, setDescendo] = useState(false);
  useEffect(() => {
    let y = window.scrollY;
    let estado = false;
    const aoRolar = () => {
      const atual = window.scrollY;
      const novo = direcaoDaRolagem(y, atual, estado);
      if (Math.abs(atual - y) >= FOLGA || atual < TOPO) y = atual;
      if (novo !== estado) { estado = novo; setDescendo(novo); }
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  return descendo;
}
