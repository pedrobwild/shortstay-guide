/**
 * Biblioteca pura de analytics para eventos de calendário OTA (iCal).
 * Sem dependências de React ou Supabase. Todas as datas tratadas em UTC.
 *
 * Convenção iCal: `end_date` é EXCLUSIVO (primeiro dia não ocupado / checkout).
 */

export type EventType = "reservation" | "blocked";

export interface RawEvent {
  id?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (exclusivo)
  summary?: string | null;
  raw_payload?: { type?: string; source?: string; [k: string]: unknown } | null;
}

export interface NormalizedEvent {
  id?: string;
  start: Date;       // UTC
  end: Date;         // UTC, exclusivo
  nights: number;
  summary: string;
  type: EventType;
}

export interface ProjectKpis {
  occupancyPct: number;        // 0-100
  bookedNights: number;        // só reservas
  blockedNights: number;       // só bloqueios
  totalNights: number;         // janela completa em noites
  averageStayNights: number;   // média de noites por reserva
  reservationsCount: number;
  blockedCount: number;
  estimatedRevenueBrl: number; // bookedNights * adr
  windowStart: Date | null;
  windowEnd: Date | null;
}

export interface MonthlyOccupancy {
  monthKey: string;            // "YYYY-MM"
  monthLabel: string;          // ex "Jan/26"
  daysInMonth: number;
  bookedNights: number;
  blockedNights: number;
  occupancyPct: number;        // 0-100 (booked / daysInMonth)
  estimatedRevenueBrl: number;
}

export interface StayLengthBucket {
  bucket: "1" | "2-3" | "4-6" | "7-13" | "14+";
  count: number;
}

export interface WeekdayOccupancy {
  weekday: number;             // 0=Dom .. 6=Sáb
  label: string;               // "Dom" .. "Sáb"
  bookedNights: number;
}

export interface UpcomingStay {
  start: Date;
  end: Date;
  nights: number;
  type: EventType;
  summary: string;
}

export interface VacancyGap {
  from: Date;                  // primeiro dia vago (inclusivo)
  to: Date;                    // último dia vago (inclusivo)
  nights: number;
}

export const DEFAULT_ADR_BRL = 350;

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/** Parseia "YYYY-MM-DD" em Date UTC à meia-noite. */
function parseUtcDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/** Adiciona dias em UTC, retornando novo Date. */
function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Diferença em dias inteiros entre duas datas UTC. */
function diffDaysUtc(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Classifica um evento em reservation ou blocked.
 * Usa raw_payload.type quando disponível, senão palavras-chave no summary.
 */
export function classifyEvent(ev: RawEvent): EventType {
  const t = ev.raw_payload?.type;
  if (t === "blocked") return "blocked";
  if (t === "reservation") return "reservation";
  const s = (ev.summary || "").toString();
  if (/block|not available|indispon|manuten|uso pessoal|limpeza/i.test(s)) {
    return "blocked";
  }
  return "reservation";
}

/**
 * Normaliza uma lista de RawEvent: parse UTC, calcula nights,
 * filtra noites <= 0 e ordena por start ascendente.
 */
export function normalizeEvents(events: RawEvent[]): NormalizedEvent[] {
  const out: NormalizedEvent[] = [];
  for (const ev of events) {
    if (!ev.start_date || !ev.end_date) continue;
    const start = parseUtcDate(ev.start_date);
    const end = parseUtcDate(ev.end_date);
    const nights = diffDaysUtc(start, end);
    if (nights <= 0) continue;
    out.push({
      id: ev.id,
      start,
      end,
      nights,
      summary: (ev.summary || "").toString(),
      type: classifyEvent(ev),
    });
  }
  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}

/** Calcula KPIs agregados sobre a janela total dos eventos. */
export function computeKpis(events: NormalizedEvent[], adr = DEFAULT_ADR_BRL): ProjectKpis {
  if (events.length === 0) {
    return {
      occupancyPct: 0,
      bookedNights: 0,
      blockedNights: 0,
      totalNights: 0,
      averageStayNights: 0,
      reservationsCount: 0,
      blockedCount: 0,
      estimatedRevenueBrl: 0,
      windowStart: null,
      windowEnd: null,
    };
  }
  const windowStart = events[0].start;
  const windowEnd = events.reduce(
    (acc, e) => (e.end.getTime() > acc.getTime() ? e.end : acc),
    events[0].end,
  );
  const totalNights = Math.max(1, diffDaysUtc(windowStart, windowEnd));

  let bookedNights = 0;
  let blockedNights = 0;
  let reservationsCount = 0;
  let blockedCount = 0;

  for (const e of events) {
    if (e.type === "reservation") {
      bookedNights += e.nights;
      reservationsCount++;
    } else {
      blockedNights += e.nights;
      blockedCount++;
    }
  }

  const occupiedNights = bookedNights + blockedNights;
  const occupancyPct = (occupiedNights / totalNights) * 100;
  const averageStayNights = reservationsCount > 0 ? bookedNights / reservationsCount : 0;
  const estimatedRevenueBrl = bookedNights * adr;

  return {
    occupancyPct,
    bookedNights,
    blockedNights,
    totalNights,
    averageStayNights,
    reservationsCount,
    blockedCount,
    estimatedRevenueBrl,
    windowStart,
    windowEnd,
  };
}

/**
 * Calcula ocupação mês a mês entre primeiro e último evento.
 * Distribui noites de estadias que cruzam meses no mês correspondente.
 */
export function occupancyByMonth(
  events: NormalizedEvent[],
  adr = DEFAULT_ADR_BRL,
): MonthlyOccupancy[] {
  if (events.length === 0) return [];

  const first = events[0].start;
  const last = events.reduce(
    (acc, e) => (e.end.getTime() > acc.getTime() ? e.end : acc),
    events[0].end,
  );

  // Map: "YYYY-MM" -> {booked, blocked}
  const bucket = new Map<string, { booked: number; blocked: number }>();

  const ensureMonth = (y: number, m: number) => {
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    if (!bucket.has(key)) bucket.set(key, { booked: 0, blocked: 0 });
    return key;
  };

  // Inicializa todos os meses no range
  let cur = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
  const endMark = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1));
  while (cur.getTime() <= endMark.getTime()) {
    ensureMonth(cur.getUTCFullYear(), cur.getUTCMonth());
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
  }

  for (const e of events) {
    let d = new Date(e.start);
    while (d.getTime() < e.end.getTime()) {
      const key = ensureMonth(d.getUTCFullYear(), d.getUTCMonth());
      const ref = bucket.get(key)!;
      if (e.type === "reservation") ref.booked++;
      else ref.blocked++;
      d = addDaysUtc(d, 1);
    }
  }

  const out: MonthlyOccupancy[] = [];
  for (const [key, val] of bucket.entries()) {
    const [yy, mm] = key.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    const occupied = val.booked + val.blocked;
    const occupancyPct = (occupied / daysInMonth) * 100;
    out.push({
      monthKey: key,
      monthLabel: `${MONTH_LABELS[mm - 1]}/${String(yy).slice(2)}`,
      daysInMonth,
      bookedNights: val.booked,
      blockedNights: val.blocked,
      occupancyPct,
      estimatedRevenueBrl: val.booked * adr,
    });
  }
  out.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  return out;
}

/** Distribui reservas (não bloqueios) em buckets de duração. */
export function stayLengthDistribution(events: NormalizedEvent[]): StayLengthBucket[] {
  const buckets: Record<StayLengthBucket["bucket"], number> = {
    "1": 0, "2-3": 0, "4-6": 0, "7-13": 0, "14+": 0,
  };
  for (const e of events) {
    if (e.type !== "reservation") continue;
    const n = e.nights;
    if (n === 1) buckets["1"]++;
    else if (n <= 3) buckets["2-3"]++;
    else if (n <= 6) buckets["4-6"]++;
    else if (n <= 13) buckets["7-13"]++;
    else buckets["14+"]++;
  }
  return (["1", "2-3", "4-6", "7-13", "14+"] as const).map((b) => ({
    bucket: b,
    count: buckets[b],
  }));
}

/** Conta noites reservadas por dia da semana (0=Dom..6=Sáb). */
export function occupancyByWeekday(events: NormalizedEvent[]): WeekdayOccupancy[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const e of events) {
    if (e.type !== "reservation") continue;
    let d = new Date(e.start);
    while (d.getTime() < e.end.getTime()) {
      counts[d.getUTCDay()]++;
      d = addDaysUtc(d, 1);
    }
  }
  return counts.map((bookedNights, weekday) => ({
    weekday,
    label: WEEKDAY_LABELS[weekday],
    bookedNights,
  }));
}

/** Próximas estadias dentro da janela (today..today+daysAhead). */
export function upcomingStays(
  events: NormalizedEvent[],
  daysAhead = 60,
  today: Date = new Date(),
): UpcomingStay[] {
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const limit = addDaysUtc(todayUtc, daysAhead);
  const out: UpcomingStay[] = [];
  for (const e of events) {
    if (e.end.getTime() <= todayUtc.getTime()) continue;
    if (e.start.getTime() > limit.getTime()) continue;
    out.push({
      start: e.start,
      end: e.end,
      nights: e.nights,
      type: e.type,
      summary: e.summary,
    });
  }
  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}

/** Maiores períodos de vacância entre eventos consecutivos. */
export function longestGaps(events: NormalizedEvent[], topN = 3): VacancyGap[] {
  if (events.length < 2) return [];
  const gaps: VacancyGap[] = [];
  // Ordenado em normalizeEvents; reordenar por start só para garantir
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    // gap é dos dias entre end (exclusivo) e start do próximo (exclusivo)
    const nights = diffDaysUtc(cur.end, next.start);
    if (nights > 0) {
      gaps.push({
        from: cur.end,                       // primeiro dia vago
        to: addDaysUtc(next.start, -1),      // último dia vago
        nights,
      });
    }
  }
  gaps.sort((a, b) => b.nights - a.nights);
  return gaps.slice(0, topN);
}
