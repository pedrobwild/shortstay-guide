import { useEffect } from "react";

/**
 * Sobe o botão flutuante do chat no celular quando a página tem uma barra ou um
 * painel fixo embaixo (ex.: painel do bairro no mapa, barra de resultado da
 * projeção). `px` é a distância da base da tela; null mantém a posição padrão.
 * No desktop (lg) o chat continua no canto de sempre.
 */
export function useDeslocamentoChat(px: number | null) {
  useEffect(() => {
    if (px == null) return;
    const raiz = document.documentElement;
    raiz.style.setProperty("--chat-fab-bottom", `${Math.round(px)}px`);
    return () => { raiz.style.removeProperty("--chat-fab-bottom"); };
  }, [px]);
}
