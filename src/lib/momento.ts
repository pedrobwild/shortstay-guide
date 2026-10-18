/**
 * Momento do investidor: em que ponto a pessoa está (procurando um studio, já tem
 * um imóvel, vai reformar para alugar). Define o atalho principal do celular e a
 * ordem das recomendações; não cria entrada de lead. Fica só neste navegador
 * (localStorage, 30 dias) — é uma escolha, não dado pessoal.
 */
import { useEffect, useState } from "react";

export const MOMENTOS = ["procurando", "tenho", "reformar"] as const;
export type Momento = (typeof MOMENTOS)[number];

/** Situação → ação principal (texto da home) e destino do atalho. */
export const CAMINHOS_MOMENTO: Record<Momento, { situacao: string; acao: string; texto: string; destino: string }> = {
  procurando: { situacao: "Estou procurando um studio", acao: "Comparar bairros", texto: "Diária, ocupação e fonte de cada bairro, lado a lado.", destino: "/comparar" },
  tenho: { situacao: "Já tenho um imóvel", acao: "Simular meu resultado", texto: "Receita, custos e resultado líquido com as premissas do seu imóvel.", destino: "/projecao" },
  reformar: { situacao: "Vou reformar para alugar", acao: "Planejar meu investimento", texto: "O que faz um studio performar e o orçamento da reforma.", destino: "#reforma" },
};

const CHAVE = "radar_momento";
const MAX_IDADE_MS = 30 * 24 * 60 * 60 * 1000;
export const EVENTO_MOMENTO = "radar:momento";

export const ehMomento = (v: unknown): v is Momento => typeof v === "string" && (MOMENTOS as readonly string[]).includes(v);

export function lerMomento(agora = Date.now()): Momento | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const v = JSON.parse(bruto) as { momento?: unknown; quando?: unknown };
    if (!ehMomento(v.momento) || typeof v.quando !== "number" || agora - v.quando > MAX_IDADE_MS) return null;
    return v.momento;
  } catch {
    return null;
  }
}

export function definirMomento(momento: Momento) {
  try { localStorage.setItem(CHAVE, JSON.stringify({ momento, quando: Date.now() })); } catch { /* sem armazenamento: vale só nesta tela */ }
  try { window.dispatchEvent(new CustomEvent(EVENTO_MOMENTO, { detail: momento })); } catch { /* sem window */ }
}

/** Momento salvo, lido depois da montagem (HTML pré-renderizado e hidratação coincidem). */
export function useMomento(): Momento | null {
  const [momento, setMomento] = useState<Momento | null>(null);
  useEffect(() => {
    setMomento(lerMomento());
    const aoMudar = () => setMomento(lerMomento());
    window.addEventListener(EVENTO_MOMENTO, aoMudar);
    window.addEventListener("storage", aoMudar);
    return () => {
      window.removeEventListener(EVENTO_MOMENTO, aoMudar);
      window.removeEventListener("storage", aoMudar);
    };
  }, []);
  return momento;
}
