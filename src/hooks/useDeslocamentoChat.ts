import { useEffect } from "react";

/**
 * Sobe o botão flutuante do chat no celular quando a página tem uma barra ou um
 * painel fixo embaixo (ex.: painel do bairro no mapa, barra de resultado da
 * projeção). `posicao` é a distância da base da tela: número em px ou um comprimento
 * CSS (ex.: "calc(24px + env(safe-area-inset-bottom))"); null mantém a posição padrão.
 * No desktop (lg) o chat continua no canto de sempre.
 */
export function useDeslocamentoChat(posicao: number | string | null) {
  useEffect(() => {
    if (posicao == null) return;
    const raiz = document.documentElement;
    raiz.style.setProperty("--chat-fab-bottom", typeof posicao === "number" ? `${Math.round(posicao)}px` : posicao);
    return () => { raiz.style.removeProperty("--chat-fab-bottom"); };
  }, [posicao]);
}
