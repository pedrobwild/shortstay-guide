/**
 * Lembretes locais para retomar de onde a pessoa parou: última simulação e
 * último bairro visto. Ficam só neste navegador (localStorage), expiram em
 * 30 dias e não têm dado pessoal — só bairro e premissas da simulação.
 */
const CHAVE_SIMULACAO = "radar_ultima_simulacao";
const CHAVE_BAIRRO = "radar_ultimo_bairro";
export const RETOMADA_MAX_DIAS = 30;
const MAX_IDADE_MS = RETOMADA_MAX_DIAS * 24 * 60 * 60 * 1000;

export interface UltimaSimulacao { caminho: string; bairro: string; quando: number }
export interface UltimoBairro { slug: string; nome: string; quando: number }

function ler<T extends { quando: number }>(chave: string, agora = Date.now()): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;
    const v = JSON.parse(bruto) as T;
    if (typeof v?.quando !== "number" || agora - v.quando > MAX_IDADE_MS) return null;
    return v;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* armazenamento indisponível: segue sem lembrar */ }
}

export function lerUltimaSimulacao(agora?: number) {
  const v = ler<UltimaSimulacao>(CHAVE_SIMULACAO, agora);
  // Só aceita caminhos internos do simulador (evita abrir algo diferente do que foi gravado).
  return v && v.caminho.startsWith("/?") && v.caminho.endsWith("#simulador") ? v : null;
}
export function lembrarSimulacao(caminho: string, bairro: string) {
  gravar(CHAVE_SIMULACAO, { caminho, bairro, quando: Date.now() } satisfies UltimaSimulacao);
}

export function lerUltimoBairro(agora?: number) {
  const v = ler<UltimoBairro>(CHAVE_BAIRRO, agora);
  return v && /^[a-z0-9-]+$/.test(v.slug) ? v : null;
}
export function lembrarBairro(slug: string, nome: string) {
  gravar(CHAVE_BAIRRO, { slug, nome, quando: Date.now() } satisfies UltimoBairro);
}
