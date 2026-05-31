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

export interface ForwardWindowOccupancy {
  windowDays: number;          // 30 / 60 / 90 ...
  bookedNights: number;
  blockedNights: number;
  availableNights: number;     // window - booked - blocked (>=0)
  occupancyPct: number;        // (booked+blocked) / window * 100
  bookedPct: number;           // booked / window * 100
  estimatedRevenueBrl: number; // booked * adr
}

export interface SeasonalityMonth {
  month: number;               // 1..12
  monthLabel: string;          // "Jan" .. "Dez"
  avgOccupancyPct: number;     // média histórica do mês (entre os anos disponíveis)
  index: number;               // avgOccupancyPct / avgOccupancyAnual (1 = média)
  bookedNights: number;        // total booked across all years for this calendar month
  yearsObserved: number;       // quantos anos contribuíram
}

export interface WeekendSplit {
  weekendNights: number;       // sex (5) + sáb (6)
  weekdayNights: number;       // dom..qui
  weekendPct: number;          // weekendNights / total
  weekdayPct: number;
  weekendOccupancyPct: number; // weekendNights / weekendNightsAvailable
  weekdayOccupancyPct: number;
  weekendRevenueBrl: number;
  weekdayRevenueBrl: number;
}

export interface YoYMonth {
  monthKey: string;            // "YYYY-MM" do período atual
  monthLabel: string;          // "Jan/26"
  currentBookedNights: number;
  previousBookedNights: number;
  currentOccupancyPct: number;
  previousOccupancyPct: number;
  occupancyDeltaPct: number;   // current - previous (em pontos percentuais)
  currentRevenueBrl: number;
  previousRevenueBrl: number;
  revenueDeltaPct: number;     // % growth (current - previous) / previous * 100
}

export interface BookingPatterns {
  reservationsCount: number;
  blockedCount: number;
  blockRatePct: number;        // blockedNights / totalNights
  backToBackCount: number;     // reservas com gap=0 entre uma e a próxima
  backToBackRatePct: number;   // backToBackCount / (reservations-1)
  averageGapNights: number;    // média de gap entre reservas consecutivas
  medianGapNights: number;
  longestStayNights: number;
  shortestStayNights: number;
  weekendArrivalsPct: number;  // % de check-ins em sex/sáb
}

export interface BreakEvenAnalysis {
  monthlyFixedCosts: number;          // condomínio + taxas fixas
  monthlyVariableRatio: number;       // 0..1 (gestão + impostos como fração da receita bruta)
  cleaningPerStay: number;
  averageStayNights: number;
  effectiveAdr: number;               // adr − (cleaning/avgStay) (contribuição por noite, antes de var%)
  contributionPerNight: number;       // adr * (1-var%) − cleaning/avgStay
  breakEvenNightsPerMonth: number;    // monthlyFixed / contributionPerNight
  breakEvenOccupancyPct: number;      // breakEvenNightsPerMonth / 30
  currentMonthlyOccupancyPct: number; // média atual observada
  marginVsBreakEvenPct: number;       // current - breakeven (pp)
}

export interface InvestmentReturn {
  propertyValueBrl: number;
  monthsObserved: number;
  annualizedGrossRevenueBrl: number;  // (gross / monthsObserved) * 12
  annualizedNetRevenueBrl: number;    // (net / monthsObserved) * 12
  grossYieldPct: number;              // annualGross / propertyValue * 100
  capRatePct: number;                 // annualNet / propertyValue * 100
  paybackYears: number | null;        // propertyValue / annualNet (null se net <= 0)
  monthlyAvgGrossBrl: number;
  monthlyAvgNetBrl: number;
}

export const DEFAULT_ADR_BRL = 350;

/**
 * Índice de sazonalidade padrão para São Paulo (mercado corporativo + turismo).
 * 12 valores (Jan..Dez), média ≈ 1.0. Meses > 1 performam acima da média.
 * Usado pelo gerador de projeção quando o lead não tem dados reais.
 */
export const DEFAULT_SP_SEASONALITY: number[] = [
  0.85, // Jan — pós-festas, baixa corporativa
  0.95, // Fev — carnaval/férias
  1.10, // Mar — retomada corporativa
  1.10, // Abr
  1.05, // Mai
  0.95, // Jun — férias de inverno
  0.90, // Jul — férias escolares
  1.05, // Ago
  1.15, // Set — pico de eventos/negócios
  1.15, // Out
  1.10, // Nov
  0.80, // Dez — festas de fim de ano
];

export interface ProjectionParams {
  occupancyPct: number;        // ocupação média alvo do bairro (0-100)
  avgStayNights?: number;      // duração média de estadia (default 3)
  months?: number;             // janela de projeção em meses (default 12)
  startDate?: Date;            // início (default hoje); usa o 1º dia do mês
  seasonality?: number[];      // 12 índices mensais (mês 1..12); default plano (1.0)
}

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

/**
 * Ocupação numa janela futura a partir de `today`.
 * Conta noites de eventos que sobrepõem [today, today+windowDays).
 */
export function forwardOccupancy(
  events: NormalizedEvent[],
  windowDays: number,
  adr = DEFAULT_ADR_BRL,
  today: Date = new Date(),
): ForwardWindowOccupancy {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const end = addDaysUtc(start, windowDays);
  let booked = 0;
  let blocked = 0;
  for (const e of events) {
    const overlapStart = e.start.getTime() > start.getTime() ? e.start : start;
    const overlapEnd = e.end.getTime() < end.getTime() ? e.end : end;
    const overlap = diffDaysUtc(overlapStart, overlapEnd);
    if (overlap <= 0) continue;
    if (e.type === "reservation") booked += overlap;
    else blocked += overlap;
  }
  const occupied = booked + blocked;
  const available = Math.max(0, windowDays - occupied);
  return {
    windowDays,
    bookedNights: booked,
    blockedNights: blocked,
    availableNights: available,
    occupancyPct: (occupied / windowDays) * 100,
    bookedPct: (booked / windowDays) * 100,
    estimatedRevenueBrl: booked * adr,
  };
}

/**
 * Índice de sazonalidade por mês calendário.
 * Agrega ocupação média de cada mês (Jan..Dez) através de todos os anos disponíveis,
 * e devolve um índice relativo à média anual.
 */
export function seasonalityIndex(events: NormalizedEvent[]): SeasonalityMonth[] {
  if (events.length === 0) return [];
  // Agregação por mês calendário
  const perMonth = new Map<number, { booked: number; days: number; years: Set<number> }>();
  // Para cada (ano, mês) que aparece na janela, acumula booked + daysInMonth
  const monthly = occupancyByMonth(events);
  for (const m of monthly) {
    const [yy, mm] = m.monthKey.split("-").map(Number);
    const key = mm; // 1..12
    if (!perMonth.has(key)) perMonth.set(key, { booked: 0, days: 0, years: new Set() });
    const ref = perMonth.get(key)!;
    ref.booked += m.bookedNights;
    ref.days += m.daysInMonth;
    ref.years.add(yy);
  }
  // Média anual ponderada
  const totalBooked = monthly.reduce((acc, m) => acc + m.bookedNights, 0);
  const totalDays = monthly.reduce((acc, m) => acc + m.daysInMonth, 0);
  const avgAnnualPct = totalDays > 0 ? (totalBooked / totalDays) * 100 : 0;
  const out: SeasonalityMonth[] = [];
  for (let mm = 1; mm <= 12; mm++) {
    const ref = perMonth.get(mm);
    if (!ref || ref.days === 0) continue;
    const pct = (ref.booked / ref.days) * 100;
    out.push({
      month: mm,
      monthLabel: MONTH_LABELS[mm - 1],
      avgOccupancyPct: pct,
      index: avgAnnualPct > 0 ? pct / avgAnnualPct : 0,
      bookedNights: ref.booked,
      yearsObserved: ref.years.size,
    });
  }
  return out;
}

/**
 * Distribui noites entre fim de semana (Sex/Sáb) e dias de semana.
 * `windowNights` é o total de noites na janela observada (para cálculo de % ocupação).
 */
export function weekendVsWeekday(
  events: NormalizedEvent[],
  windowStart: Date | null,
  windowEnd: Date | null,
  adr = DEFAULT_ADR_BRL,
): WeekendSplit {
  let weekendBooked = 0;
  let weekdayBooked = 0;
  for (const e of events) {
    if (e.type !== "reservation") continue;
    let d = new Date(e.start);
    while (d.getTime() < e.end.getTime()) {
      const wd = d.getUTCDay();
      if (wd === 5 || wd === 6) weekendBooked++;
      else weekdayBooked++;
      d = addDaysUtc(d, 1);
    }
  }
  // Calcula nights disponíveis na janela por categoria
  let weekendAvailable = 0;
  let weekdayAvailable = 0;
  if (windowStart && windowEnd) {
    let d = new Date(windowStart);
    while (d.getTime() < windowEnd.getTime()) {
      const wd = d.getUTCDay();
      if (wd === 5 || wd === 6) weekendAvailable++;
      else weekdayAvailable++;
      d = addDaysUtc(d, 1);
    }
  }
  const total = weekendBooked + weekdayBooked;
  return {
    weekendNights: weekendBooked,
    weekdayNights: weekdayBooked,
    weekendPct: total > 0 ? (weekendBooked / total) * 100 : 0,
    weekdayPct: total > 0 ? (weekdayBooked / total) * 100 : 0,
    weekendOccupancyPct: weekendAvailable > 0 ? (weekendBooked / weekendAvailable) * 100 : 0,
    weekdayOccupancyPct: weekdayAvailable > 0 ? (weekdayBooked / weekdayAvailable) * 100 : 0,
    weekendRevenueBrl: weekendBooked * adr,
    weekdayRevenueBrl: weekdayBooked * adr,
  };
}

/**
 * Comparação Year-over-Year mês a mês: para cada mês com observação no ano atual e no ano anterior,
 * devolve ocupação e receita comparadas.
 */
export function yearOverYear(
  events: NormalizedEvent[],
  adr = DEFAULT_ADR_BRL,
): YoYMonth[] {
  const monthly = occupancyByMonth(events, adr);
  const byKey = new Map<string, MonthlyOccupancy>();
  for (const m of monthly) byKey.set(m.monthKey, m);
  const out: YoYMonth[] = [];
  for (const m of monthly) {
    const [yy, mm] = m.monthKey.split("-").map(Number);
    const prevKey = `${yy - 1}-${String(mm).padStart(2, "0")}`;
    const prev = byKey.get(prevKey);
    if (!prev) continue;
    const occDelta = m.occupancyPct - prev.occupancyPct;
    const revDelta =
      prev.estimatedRevenueBrl > 0
        ? ((m.estimatedRevenueBrl - prev.estimatedRevenueBrl) / prev.estimatedRevenueBrl) * 100
        : m.estimatedRevenueBrl > 0
          ? 100
          : 0;
    out.push({
      monthKey: m.monthKey,
      monthLabel: m.monthLabel,
      currentBookedNights: m.bookedNights,
      previousBookedNights: prev.bookedNights,
      currentOccupancyPct: m.occupancyPct,
      previousOccupancyPct: prev.occupancyPct,
      occupancyDeltaPct: occDelta,
      currentRevenueBrl: m.estimatedRevenueBrl,
      previousRevenueBrl: prev.estimatedRevenueBrl,
      revenueDeltaPct: revDelta,
    });
  }
  return out;
}

/** Padrões de reserva: back-to-back, gap médio, taxa de bloqueio, etc. */
export function bookingPatterns(events: NormalizedEvent[]): BookingPatterns {
  const reservations = events.filter((e) => e.type === "reservation");
  const blocked = events.filter((e) => e.type === "blocked");
  const totalNights = reservations.reduce((acc, e) => acc + e.nights, 0)
    + blocked.reduce((acc, e) => acc + e.nights, 0);
  const blockedNights = blocked.reduce((acc, e) => acc + e.nights, 0);

  let b2b = 0;
  const gaps: number[] = [];
  const sorted = [...reservations].sort((a, b) => a.start.getTime() - b.start.getTime());
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = diffDaysUtc(sorted[i].end, sorted[i + 1].start);
    gaps.push(gap);
    if (gap === 0) b2b++;
  }
  gaps.sort((a, b) => a - b);
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const medGap = gaps.length > 0
    ? gaps.length % 2 === 1
      ? gaps[(gaps.length - 1) / 2]
      : (gaps[gaps.length / 2 - 1] + gaps[gaps.length / 2]) / 2
    : 0;

  let weekendArrivals = 0;
  for (const e of reservations) {
    const wd = e.start.getUTCDay();
    if (wd === 5 || wd === 6) weekendArrivals++;
  }

  const stayLengths = reservations.map((r) => r.nights);
  return {
    reservationsCount: reservations.length,
    blockedCount: blocked.length,
    blockRatePct: totalNights > 0 ? (blockedNights / totalNights) * 100 : 0,
    backToBackCount: b2b,
    backToBackRatePct: sorted.length > 1 ? (b2b / (sorted.length - 1)) * 100 : 0,
    averageGapNights: avgGap,
    medianGapNights: medGap,
    longestStayNights: stayLengths.length > 0 ? Math.max(...stayLengths) : 0,
    shortestStayNights: stayLengths.length > 0 ? Math.min(...stayLengths) : 0,
    weekendArrivalsPct: reservations.length > 0 ? (weekendArrivals / reservations.length) * 100 : 0,
  };
}

/**
 * Ocupação mínima necessária para cobrir custos fixos + variáveis.
 * adr: diária bruta, variableRatio (0..1) sobre receita (gestão+impostos),
 * cleaningPerStay distribuído sobre avgStay.
 */
export function breakEvenAnalysis(params: {
  adr: number;
  variableRatio: number;          // 0..1 (gestão+impostos como fração)
  cleaningPerStay: number;
  monthlyFixedCosts: number;      // condomínio + outras despesas fixas mensais
  averageStayNights: number;      // se 0, assume 3
  currentMonthlyOccupancyPct: number;
}): BreakEvenAnalysis {
  const avgStay = params.averageStayNights > 0 ? params.averageStayNights : 3;
  const cleaningPerNight = params.cleaningPerStay / avgStay;
  const contribution = params.adr * (1 - params.variableRatio) - cleaningPerNight;
  const beNights = contribution > 0 ? params.monthlyFixedCosts / contribution : Infinity;
  const beOccupancyPct = beNights === Infinity ? 100 : Math.min(100, (beNights / 30) * 100);
  return {
    monthlyFixedCosts: params.monthlyFixedCosts,
    monthlyVariableRatio: params.variableRatio,
    cleaningPerStay: params.cleaningPerStay,
    averageStayNights: avgStay,
    effectiveAdr: params.adr - cleaningPerNight,
    contributionPerNight: contribution,
    breakEvenNightsPerMonth: beNights === Infinity ? 30 : beNights,
    breakEvenOccupancyPct: beOccupancyPct,
    currentMonthlyOccupancyPct: params.currentMonthlyOccupancyPct,
    marginVsBreakEvenPct: params.currentMonthlyOccupancyPct - beOccupancyPct,
  };
}

/**
 * Retorno do investimento (cap rate, payback) anualizando a receita observada.
 * Se propertyValueBrl <= 0, devolve cap rate 0 e payback null.
 */
export function investmentReturn(params: {
  propertyValueBrl: number;
  observedGrossBrl: number;
  observedNetBrl: number;
  monthsObserved: number;
}): InvestmentReturn {
  const months = Math.max(1, params.monthsObserved);
  const annualGross = (params.observedGrossBrl / months) * 12;
  const annualNet = (params.observedNetBrl / months) * 12;
  const value = params.propertyValueBrl;
  const grossYieldPct = value > 0 ? (annualGross / value) * 100 : 0;
  const capRatePct = value > 0 ? (annualNet / value) * 100 : 0;
  const paybackYears = value > 0 && annualNet > 0 ? value / annualNet : null;
  return {
    propertyValueBrl: value,
    monthsObserved: months,
    annualizedGrossRevenueBrl: annualGross,
    annualizedNetRevenueBrl: annualNet,
    grossYieldPct,
    capRatePct,
    paybackYears,
    monthlyAvgGrossBrl: params.observedGrossBrl / months,
    monthlyAvgNetBrl: params.observedNetBrl / months,
  };
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

/**
 * Gera eventos sintéticos de calendário a partir de premissas de mercado.
 *
 * Distribui, mês a mês ao longo da janela, um total de noites-reserva igual a
 * `daysInMonth * (occupancyPct/100) * seasonalityIndex(mês)`, repartido em
 * estadias de ~`avgStayNights` noites separadas por gaps regulares. O resultado
 * é determinístico (sem aleatoriedade) e usa a mesma estrutura `NormalizedEvent`
 * consumida pelo dashboard — assim todos os KPIs funcionam sem iCal real.
 *
 * Convenção mantida: `end` é exclusivo (checkout / primeiro dia não ocupado).
 */
export function generateProjectionEvents(params: ProjectionParams): NormalizedEvent[] {
  const occ = Math.min(100, Math.max(0, params.occupancyPct)) / 100;
  const stayLen = Math.max(1, Math.round(params.avgStayNights ?? 3));
  const months = Math.max(1, Math.round(params.months ?? 12));
  const seasonality = params.seasonality;
  const base = params.startDate ?? new Date();

  const events: NormalizedEvent[] = [];
  let cursorYear = base.getUTCFullYear();
  let cursorMonth = base.getUTCMonth(); // 0..11

  for (let i = 0; i < months; i++) {
    const daysInMonth = new Date(Date.UTC(cursorYear, cursorMonth + 1, 0)).getUTCDate();
    const seasonIdx = seasonality ? (seasonality[cursorMonth] ?? 1) : 1;
    let target = Math.round(daysInMonth * occ * seasonIdx);
    target = Math.min(daysInMonth, Math.max(0, target));

    if (target > 0) {
      const numStays = Math.max(1, Math.round(target / stayLen));
      const freeNights = daysInMonth - target;
      const gapLen = Math.floor(freeNights / numStays);
      const baseLen = Math.floor(target / numStays);
      const remainder = target - baseLen * numStays;

      let dayOffset = 0; // dias decorridos desde o dia 1 (0-indexed)
      for (let s = 0; s < numStays; s++) {
        let len = baseLen + (s < remainder ? 1 : 0);
        if (len <= 0) continue;
        // Garante que a estadia não ultrapasse o fim do mês
        if (dayOffset + len > daysInMonth) len = daysInMonth - dayOffset;
        if (len <= 0) break;
        const start = new Date(Date.UTC(cursorYear, cursorMonth, 1 + dayOffset));
        const end = new Date(Date.UTC(cursorYear, cursorMonth, 1 + dayOffset + len));
        events.push({
          id: `proj-${cursorYear}-${String(cursorMonth + 1).padStart(2, "0")}-${s}`,
          start,
          end,
          nights: len,
          summary: "Projeção de mercado",
          type: "reservation",
        });
        dayOffset += len + gapLen;
        if (dayOffset >= daysInMonth) break;
      }
    }

    cursorMonth++;
    if (cursorMonth > 11) {
      cursorMonth = 0;
      cursorYear++;
    }
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}
