/**
 * Leitura das páginas públicas da GuestFavorites (airbnb-occupancy-rates-in-<bairro>-sao-paulo-brazil):
 * ocupação, diária média (ADR), quartis da faixa de preço, anúncios ativos, período e data de
 * atualização da página. Função pura sobre o HTML, sem DOM — a mesma cópia roda na Edge Function
 * `coletar-guestfavorites` (supabase/functions/coletar-guestfavorites/parser.ts); o teste
 * guestfavoritesParser.test.ts garante que as duas cópias são idênticas.
 *
 * Os números seguem exatamente o que a página mostra: a diária média é a média (ADR) do cabeçalho;
 * os quartis vêm da tabela "Pricing Tiers" (Budget = 25% mais baratos, Average = mediana,
 * High-performing = 25% mais caros). Nada é arredondado ou derivado aqui.
 */
export interface LeituraGuestFavorites {
  ocupacaoPct: number;
  adrBrl: number;
  /** [25% mais baratos, mediana, 25% mais caros] ou null quando a tabela não está na página. */
  quartis: [number, number, number] | null;
  anuncios: number;
  /** AAAA-MM-DD do primeiro dia do período ("January 2026" → 2026-01-01). */
  periodoInicio: string;
  /** AAAA-MM-DD do último dia do período ("September 2026" → 2026-09-30). */
  periodoFim: string;
  /** AAAA-MM-DD da linha "Last updated" da página (null se não houver). */
  atualizadoEm: string | null;
}

const MESES_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** HTML → texto corrido, como o textContent do navegador (sem script/style, entidades comuns, espaços colapsados). */
export function textoDaPagina(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ");
}

const numero = (s: string) => Number(s.replace(/[R$\s,]/g, ""));

const ultimoDia = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).getUTCDate();
const iso = (ano: number, mes: number, dia: number) => `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

/** "January 2026 - September 2026" → { inicio: "2026-01-01", fim: "2026-09-30" }; null se não entender. */
export function lerPeriodo(texto: string): { inicio: string; fim: string } | null {
  const m = texto.match(/Period:\s*([A-Za-z]+)\s+(\d{4})\s*-\s*([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const m1 = MESES_EN[m[1].toLowerCase()], m2 = MESES_EN[m[3].toLowerCase()];
  if (!m1 || !m2) return null;
  const a1 = Number(m[2]), a2 = Number(m[4]);
  return { inicio: iso(a1, m1, 1), fim: iso(a2, m2, ultimoDia(a2, m2)) };
}

/** Lê a página; devolve null quando falta diária, ocupação, anúncios ou período (não inventa nada). */
export function lerPaginaGuestFavorites(html: string): LeituraGuestFavorites | null {
  const t = textoDaPagina(html);
  const occ = t.match(/Occupancy Rate\s*(\d{1,3})%/);
  const adr = t.match(/Average Daily Rate \(ADR\)\s*R\$([\d,]+)/);
  const n = t.match(/Active Listings\s*([\d,]+)/);
  const periodo = lerPeriodo(t);
  const atualizado = t.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/);
  const tiers = t.match(/Airbnb Pricing Tiers in .*?Budget\s*\(Bottom 25%\)\s*R\$([\d,]+)\s*per night\s*R\$([\d,]+)\s*per night\s*R\$([\d,]+)\s*per night\s*R\$([\d,]+)\s*per night/);
  if (!occ || !adr || !n || !periodo) return null;
  const ocupacaoPct = Number(occ[1]), adrBrl = numero(adr[1]), anuncios = numero(n[1]);
  if (!(ocupacaoPct >= 0 && ocupacaoPct <= 100) || !(adrBrl > 0) || !(anuncios >= 0)) return null;
  let quartis: [number, number, number] | null = null;
  if (tiers) {
    const q: [number, number, number] = [numero(tiers[4]), numero(tiers[3]), numero(tiers[2])];
    if (q.every((v) => Number.isFinite(v) && v >= 0) && q[0] <= q[1] && q[1] <= q[2]) quartis = q;
  }
  return { ocupacaoPct, adrBrl, quartis, anuncios, periodoInicio: periodo.inicio, periodoFim: periodo.fim, atualizadoEm: atualizado ? atualizado[1] : null };
}

/** Slug da GuestFavorites a partir do nome do bairro ("Santa Cecília" → "santa-cecilia"; "Sé" → "se"). */
export function slugGuestFavorites(nome: string): string {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const URL_BAIRRO_GF = (nome: string) => `https://www.guestfavorites.com/airbnb-occupancy-rates-in-${slugGuestFavorites(nome)}-sao-paulo-brazil`;
export const URL_CIDADE_GF = "https://www.guestfavorites.com/airbnb-occupancy-rates-in-sao-paulo-brasil";
