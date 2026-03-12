/**
 * Utilitários para parsing e validação de calendários iCal.
 * Extraídos para facilitar testes unitários.
 */

/**
 * Converte uma string de data iCal (ex: "20250315" ou "DTSTART;VALUE=DATE:20250315")
 * para formato ISO "YYYY-MM-DD".
 * Retorna null se a string for inválida.
 */
export function parseICalDate(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.includes(":") ? raw.split(":").pop()! : raw;
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  const m = parseInt(month), d = parseInt(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${year}-${month}-${day}`;
}

/**
 * Valida se a URL parece ser uma URL iCal válida:
 * - Deve ser HTTPS
 * - Deve conter ".ics" ou "ical" no path/href
 */
export function isValidIcalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const lowerPath = parsed.pathname.toLowerCase();
    if (lowerPath.includes(".ics") || lowerPath.includes("ical") || parsed.href.includes("ical")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
