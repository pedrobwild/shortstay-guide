/**
 * Cores a partir dos tokens HSL de src/index.css.
 *
 * - corCss: para style={{}} do React — devolve `hsl(var(--token) / a)`, que o
 *   navegador resolve e acompanha o tema.
 * - corToken: para quem não entende var() (paint do MapLibre). Lê o valor
 *   calculado no :root e devolve `hsla(h, s%, l%, a)` com vírgulas, a sintaxe
 *   aceita pelo parser de cores do MapLibre. Só roda no navegador; no SSR
 *   devolve cinza neutro (o mapa não é pré-renderizado).
 */
export type TokenCor =
  | "primary" | "foreground" | "muted-foreground" | "card" | "background" | "border"
  | "success" | "warning" | "danger" | "info"
  | "cat-1" | "cat-2" | "cat-3" | "cat-4";

export function corCss(token: TokenCor, alpha = 1): string {
  return alpha === 1 ? `hsl(var(--${token}))` : `hsl(var(--${token}) / ${alpha})`;
}

export function corToken(token: TokenCor, alpha = 1): string {
  if (typeof document === "undefined") return `hsla(0, 0%, 50%, ${alpha})`;
  const bruto = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  const partes = bruto.split(/\s+/);
  if (partes.length < 3) return `hsla(0, 0%, 50%, ${alpha})`;
  const [h, s, l] = partes;
  return `hsla(${h}, ${s}, ${l}, ${alpha})`;
}
