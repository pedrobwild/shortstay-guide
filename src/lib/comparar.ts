/** Seleção do comparador de bairros na URL (?b=slug,slug,slug). */
export const MAX_COMPARAR = 3;

/** Lê a lista da URL, mantendo só slugs conhecidos, sem repetição e no máximo 3. */
export function lerComparar(bruto: string | null, conhecidos: string[]): string[] {
  if (!bruto) return [];
  const vistos: string[] = [];
  for (const s of bruto.split(",").map((x) => x.trim().toLowerCase())) {
    if (s && conhecidos.includes(s) && !vistos.includes(s)) vistos.push(s);
    if (vistos.length === MAX_COMPARAR) break;
  }
  return vistos;
}

export function caminhoComparar(slugs: string[]): string {
  return slugs.length ? `/comparar?b=${slugs.slice(0, MAX_COMPARAR).map(encodeURIComponent).join(",")}` : "/comparar";
}
