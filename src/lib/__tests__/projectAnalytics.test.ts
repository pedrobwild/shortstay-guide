import { describe, it, expect } from "vitest";
import {
  classifyEvent,
  normalizeEvents,
  computeKpis,
  occupancyByMonth,
  stayLengthDistribution,
  occupancyByWeekday,
  upcomingStays,
  longestGaps,
  forwardOccupancy,
  seasonalityIndex,
  weekendVsWeekday,
  yearOverYear,
  bookingPatterns,
  breakEvenAnalysis,
  investmentReturn,
  generateProjectionEvents,
  projectionSummary,
  DEFAULT_ADR_BRL,
  DEFAULT_SP_SEASONALITY,
  type RawEvent,
} from "../projectAnalytics";

const raw = (s: string, e: string, summary = "Reserved", payloadType?: string): RawEvent => ({
  start_date: s,
  end_date: e,
  summary,
  raw_payload: payloadType ? { type: payloadType } : null,
});

describe("classifyEvent", () => {
  it("classifies blocked via summary keyword", () => {
    expect(classifyEvent({ start_date: "2026-01-01", end_date: "2026-01-02", summary: "Blocked — Manutenção" })).toBe("blocked");
    expect(classifyEvent({ start_date: "2026-01-01", end_date: "2026-01-02", summary: "Not available" })).toBe("blocked");
  });
  it("classifies reservation by default", () => {
    expect(classifyEvent({ start_date: "2026-01-01", end_date: "2026-01-02", summary: "Reserved — Ana" })).toBe("reservation");
  });
  it("respects raw_payload.type when present", () => {
    expect(classifyEvent({ start_date: "x", end_date: "y", summary: "anything", raw_payload: { type: "blocked" } })).toBe("blocked");
    expect(classifyEvent({ start_date: "x", end_date: "y", summary: "Blocked", raw_payload: { type: "reservation" } })).toBe("reservation");
  });
});

describe("normalizeEvents", () => {
  it("filters out 0-night events", () => {
    const evs = normalizeEvents([raw("2026-01-01", "2026-01-01")]);
    expect(evs).toHaveLength(0);
  });
  it("computes nights and sorts asc", () => {
    const evs = normalizeEvents([
      raw("2026-02-01", "2026-02-04"),
      raw("2026-01-10", "2026-01-12"),
    ]);
    expect(evs).toHaveLength(2);
    expect(evs[0].start.getUTCMonth()).toBe(0);
    expect(evs[0].nights).toBe(2);
    expect(evs[1].nights).toBe(3);
  });
});

describe("computeKpis", () => {
  it("returns empty kpis for no events", () => {
    const k = computeKpis([]);
    expect(k.occupancyPct).toBe(0);
    expect(k.windowStart).toBeNull();
  });
  it("computes single reservation kpis", () => {
    const evs = normalizeEvents([raw("2026-01-01", "2026-01-05")]);
    const k = computeKpis(evs, 200);
    expect(k.bookedNights).toBe(4);
    expect(k.reservationsCount).toBe(1);
    expect(k.estimatedRevenueBrl).toBe(800);
    expect(k.averageStayNights).toBe(4);
  });
  it("mixes reservation and blocked", () => {
    const evs = normalizeEvents([
      raw("2026-01-01", "2026-01-04"),
      raw("2026-01-10", "2026-01-12", "Blocked"),
    ]);
    const k = computeKpis(evs);
    expect(k.bookedNights).toBe(3);
    expect(k.blockedNights).toBe(2);
    expect(k.reservationsCount).toBe(1);
    expect(k.blockedCount).toBe(1);
  });
});

describe("occupancyByMonth", () => {
  it("splits a stay crossing month boundary", () => {
    const evs = normalizeEvents([raw("2026-01-30", "2026-02-03")]);
    const months = occupancyByMonth(evs, 100);
    expect(months).toHaveLength(2);
    expect(months[0].monthKey).toBe("2026-01");
    expect(months[0].bookedNights).toBe(2); // 30, 31
    expect(months[1].monthKey).toBe("2026-02");
    expect(months[1].bookedNights).toBe(2); // 1, 2
    expect(months[0].estimatedRevenueBrl).toBe(200);
  });
  it("returns empty for no events", () => {
    expect(occupancyByMonth([])).toEqual([]);
  });
});

describe("stayLengthDistribution", () => {
  it("buckets all categories", () => {
    const evs = normalizeEvents([
      raw("2026-01-01", "2026-01-02"), // 1
      raw("2026-01-03", "2026-01-05"), // 2
      raw("2026-01-06", "2026-01-10"), // 4
      raw("2026-01-12", "2026-01-19"), // 7
      raw("2026-01-20", "2026-02-05"), // 16
      raw("2026-02-10", "2026-02-12", "Blocked"), // ignored
    ]);
    const d = stayLengthDistribution(evs);
    expect(d.find((b) => b.bucket === "1")?.count).toBe(1);
    expect(d.find((b) => b.bucket === "2-3")?.count).toBe(1);
    expect(d.find((b) => b.bucket === "4-6")?.count).toBe(1);
    expect(d.find((b) => b.bucket === "7-13")?.count).toBe(1);
    expect(d.find((b) => b.bucket === "14+")?.count).toBe(1);
  });
});

describe("occupancyByWeekday", () => {
  it("returns 7 entries always", () => {
    expect(occupancyByWeekday([])).toHaveLength(7);
  });
  it("counts nights per weekday correctly", () => {
    // 2026-01-01 = quinta (4)
    const evs = normalizeEvents([raw("2026-01-01", "2026-01-04")]);
    const w = occupancyByWeekday(evs);
    expect(w[4].bookedNights).toBe(1); // qui
    expect(w[5].bookedNights).toBe(1); // sex
    expect(w[6].bookedNights).toBe(1); // sab
  });
});

describe("upcomingStays", () => {
  it("respects daysAhead window", () => {
    const today = new Date(Date.UTC(2026, 0, 1));
    const evs = normalizeEvents([
      raw("2026-01-05", "2026-01-08"),
      raw("2026-04-15", "2026-04-20"), // well out of 60d window
    ]);
    const u = upcomingStays(evs, 60, today);
    expect(u).toHaveLength(1);
    expect(u[0].nights).toBe(3);
  });
});

describe("longestGaps", () => {
  it("returns top N gaps sorted by size", () => {
    const evs = normalizeEvents([
      raw("2026-01-01", "2026-01-03"),
      raw("2026-01-05", "2026-01-06"), // gap of 2
      raw("2026-01-20", "2026-01-22"), // gap of 14
      raw("2026-01-25", "2026-01-26"), // gap of 3
    ]);
    const g = longestGaps(evs, 3);
    expect(g).toHaveLength(3);
    expect(g[0].nights).toBe(14);
    expect(g[1].nights).toBe(3);
    expect(g[2].nights).toBe(2);
  });
  it("returns empty for fewer than 2 events", () => {
    expect(longestGaps([])).toEqual([]);
  });
});

describe("DEFAULT_ADR_BRL", () => {
  it("defaults to 350", () => {
    expect(DEFAULT_ADR_BRL).toBe(350);
  });
});

describe("forwardOccupancy", () => {
  const today = new Date(Date.UTC(2026, 0, 1));
  it("returns zeros when there are no events", () => {
    const f = forwardOccupancy([], 30, 200, today);
    expect(f.bookedNights).toBe(0);
    expect(f.availableNights).toBe(30);
    expect(f.occupancyPct).toBe(0);
  });
  it("counts overlap with the future window", () => {
    const evs = normalizeEvents([
      raw("2026-01-05", "2026-01-10"), // 5 nights inside window
      raw("2026-02-15", "2026-02-20"), // outside 30d window
    ]);
    const f = forwardOccupancy(evs, 30, 100, today);
    expect(f.bookedNights).toBe(5);
    expect(f.estimatedRevenueBrl).toBe(500);
    expect(f.bookedPct).toBeCloseTo((5 / 30) * 100, 5);
  });
  it("clips overlap to the window edges", () => {
    const evs = normalizeEvents([raw("2025-12-28", "2026-01-04")]); // 3 nights inside (1-2-3)
    const f = forwardOccupancy(evs, 30, 100, today);
    expect(f.bookedNights).toBe(3);
  });
  it("separates blocked from booked", () => {
    const evs = normalizeEvents([raw("2026-01-05", "2026-01-08", "Blocked")]);
    const f = forwardOccupancy(evs, 30, 100, today);
    expect(f.blockedNights).toBe(3);
    expect(f.bookedNights).toBe(0);
    expect(f.occupancyPct).toBeCloseTo((3 / 30) * 100, 5);
  });
});

describe("seasonalityIndex", () => {
  it("returns empty for no events", () => {
    expect(seasonalityIndex([])).toEqual([]);
  });
  it("computes index per calendar month relative to overall avg", () => {
    const evs = normalizeEvents([
      raw("2026-01-01", "2026-01-31"), // Jan: 30/31 noites (alta temporada)
      raw("2026-07-01", "2026-07-15"), // Jul: 14/31 noites (baixa)
    ]);
    const s = seasonalityIndex(evs);
    const jan = s.find((m) => m.month === 1)!;
    const jul = s.find((m) => m.month === 7)!;
    expect(jan).toBeDefined();
    expect(jul).toBeDefined();
    // Jan deve ter ocupação maior que Jul (e índice maior)
    expect(jan.avgOccupancyPct).toBeGreaterThan(jul.avgOccupancyPct);
    expect(jan.index).toBeGreaterThan(jul.index);
    // E Jan deve estar acima da média global do período
    expect(jan.index).toBeGreaterThan(1);
  });
  it("aggregates same calendar month across years", () => {
    const evs = normalizeEvents([
      raw("2025-03-01", "2025-03-11"), // 10 nights
      raw("2026-03-05", "2026-03-15"), // 10 nights
    ]);
    const s = seasonalityIndex(evs);
    const mar = s.find((m) => m.month === 3)!;
    expect(mar.bookedNights).toBe(20);
    expect(mar.yearsObserved).toBe(2);
  });
});

describe("weekendVsWeekday", () => {
  it("returns zeros when no events", () => {
    const w = weekendVsWeekday([], null, null);
    expect(w.weekendNights).toBe(0);
    expect(w.weekdayNights).toBe(0);
  });
  it("splits booked nights by weekday correctly", () => {
    // 2026-01-01 = Quinta (4) → noites: qui, sex, sab → 1 weekday + 2 weekend
    const evs = normalizeEvents([raw("2026-01-01", "2026-01-04")]);
    const k = computeKpis(evs);
    const w = weekendVsWeekday(evs, k.windowStart, k.windowEnd, 100);
    expect(w.weekendNights).toBe(2);
    expect(w.weekdayNights).toBe(1);
    expect(w.weekendRevenueBrl).toBe(200);
    expect(w.weekdayRevenueBrl).toBe(100);
  });
});

describe("yearOverYear", () => {
  it("returns empty when no prior-year match", () => {
    const evs = normalizeEvents([raw("2026-01-01", "2026-01-10")]);
    expect(yearOverYear(evs)).toEqual([]);
  });
  it("matches months with prior year", () => {
    const evs = normalizeEvents([
      raw("2025-01-01", "2025-01-11"), // 10 nights
      raw("2026-01-01", "2026-01-21"), // 20 nights
    ]);
    const yoy = yearOverYear(evs, 100);
    const jan26 = yoy.find((m) => m.monthKey === "2026-01");
    expect(jan26).toBeDefined();
    expect(jan26!.previousBookedNights).toBe(10);
    expect(jan26!.currentBookedNights).toBe(20);
    expect(jan26!.revenueDeltaPct).toBe(100);
  });
});

describe("bookingPatterns", () => {
  it("counts back-to-back reservations and gaps", () => {
    const evs = normalizeEvents([
      raw("2026-01-01", "2026-01-04"),
      raw("2026-01-04", "2026-01-07"), // back-to-back, gap=0
      raw("2026-01-10", "2026-01-12"), // gap=3
    ]);
    const p = bookingPatterns(evs);
    expect(p.backToBackCount).toBe(1);
    expect(p.reservationsCount).toBe(3);
    expect(p.averageGapNights).toBeCloseTo(1.5, 5);
  });
  it("computes block rate", () => {
    const evs = normalizeEvents([
      raw("2026-01-01", "2026-01-05"),         // 4 booked
      raw("2026-01-10", "2026-01-12", "Blocked"), // 2 blocked
    ]);
    const p = bookingPatterns(evs);
    expect(p.blockedCount).toBe(1);
    expect(p.blockRatePct).toBeCloseTo((2 / 6) * 100, 5);
  });
});

describe("breakEvenAnalysis", () => {
  it("computes break-even nights per month", () => {
    const be = breakEvenAnalysis({
      adr: 400,
      variableRatio: 0.2,           // 20% gestão+impostos
      cleaningPerStay: 100,
      monthlyFixedCosts: 1000,
      averageStayNights: 4,         // cleaning/night = 25
      currentMonthlyOccupancyPct: 60,
    });
    // contribution = 400*0.8 - 25 = 295
    expect(be.contributionPerNight).toBeCloseTo(295, 1);
    // beNights ≈ 1000/295 ≈ 3.39
    expect(be.breakEvenNightsPerMonth).toBeCloseTo(1000 / 295, 3);
    expect(be.marginVsBreakEvenPct).toBeGreaterThan(0);
  });
  it("flags occupancy at 100% if contribution is non-positive", () => {
    const be = breakEvenAnalysis({
      adr: 100,
      variableRatio: 1.0,
      cleaningPerStay: 200,
      monthlyFixedCosts: 1000,
      averageStayNights: 1,
      currentMonthlyOccupancyPct: 60,
    });
    expect(be.breakEvenOccupancyPct).toBe(100);
  });
});

describe("investmentReturn", () => {
  it("annualizes observed revenue and computes cap rate / payback", () => {
    const r = investmentReturn({
      propertyValueBrl: 600_000,
      observedGrossBrl: 30_000,    // em 6 meses → 60k/ano
      observedNetBrl: 18_000,      // em 6 meses → 36k/ano
      monthsObserved: 6,
    });
    expect(r.annualizedGrossRevenueBrl).toBe(60_000);
    expect(r.annualizedNetRevenueBrl).toBe(36_000);
    expect(r.grossYieldPct).toBeCloseTo(10, 5);
    expect(r.capRatePct).toBeCloseTo(6, 5);
    expect(r.paybackYears).toBeCloseTo(600_000 / 36_000, 5);
  });
  it("returns null payback when net is non-positive", () => {
    const r = investmentReturn({
      propertyValueBrl: 600_000,
      observedGrossBrl: 10_000,
      observedNetBrl: -1000,
      monthsObserved: 6,
    });
    expect(r.paybackYears).toBeNull();
  });
  it("returns zero yield when property value is zero", () => {
    const r = investmentReturn({
      propertyValueBrl: 0,
      observedGrossBrl: 10_000,
      observedNetBrl: 5_000,
      monthsObserved: 6,
    });
    expect(r.capRatePct).toBe(0);
    expect(r.grossYieldPct).toBe(0);
    expect(r.paybackYears).toBeNull();
  });
});

describe("generateProjectionEvents", () => {
  const start = new Date(Date.UTC(2026, 0, 1)); // Jan/2026

  it("generates only reservations across the requested window", () => {
    const evs = generateProjectionEvents({ occupancyPct: 75, months: 12, startDate: start });
    expect(evs.length).toBeGreaterThan(0);
    expect(evs.every((e) => e.type === "reservation")).toBe(true);
    expect(evs.every((e) => e.nights > 0)).toBe(true);
    // Janela cobre ~12 meses (de Jan/2026 a Dez/2026)
    const months = occupancyByMonth(evs);
    expect(months.length).toBe(12);
  });

  it("is deterministic for the same params", () => {
    const a = generateProjectionEvents({ occupancyPct: 70, months: 6, startDate: start });
    const b = generateProjectionEvents({ occupancyPct: 70, months: 6, startDate: start });
    expect(a.map((e) => `${e.id}:${e.nights}`)).toEqual(b.map((e) => `${e.id}:${e.nights}`));
  });

  it("approximates the target occupancy with a flat seasonality", () => {
    // Sem sazonalidade: cada mês deve ficar próximo do alvo
    const evs = generateProjectionEvents({ occupancyPct: 60, months: 12, startDate: start });
    const months = occupancyByMonth(evs);
    for (const m of months) {
      // booked/daysInMonth deve estar perto de 60% (tolerância de arredondamento)
      expect(m.occupancyPct).toBeGreaterThanOrEqual(55);
      expect(m.occupancyPct).toBeLessThanOrEqual(65);
    }
  });

  it("never exceeds 100% occupancy in any month", () => {
    const evs = generateProjectionEvents({
      occupancyPct: 100,
      months: 12,
      startDate: start,
      seasonality: DEFAULT_SP_SEASONALITY, // índices > 1 não devem estourar
    });
    const months = occupancyByMonth(evs);
    for (const m of months) {
      expect(m.bookedNights).toBeLessThanOrEqual(m.daysInMonth);
      expect(m.occupancyPct).toBeLessThanOrEqual(100);
    }
  });

  it("reflects seasonality: high-index months book more than low-index months", () => {
    const evs = generateProjectionEvents({
      occupancyPct: 70,
      months: 12,
      startDate: start,
      seasonality: DEFAULT_SP_SEASONALITY,
    });
    const months = occupancyByMonth(evs);
    const sep = months.find((m) => m.monthKey === "2026-09")!; // índice 1.15
    const dec = months.find((m) => m.monthKey === "2026-12")!; // índice 0.80
    expect(sep.bookedNights).toBeGreaterThan(dec.bookedNights);
  });

  it("returns no events for zero occupancy", () => {
    const evs = generateProjectionEvents({ occupancyPct: 0, months: 6, startDate: start });
    expect(evs).toHaveLength(0);
  });

  it("feeds computeKpis without error and yields revenue", () => {
    const evs = generateProjectionEvents({ occupancyPct: 75, months: 12, startDate: start });
    const k = computeKpis(evs, DEFAULT_ADR_BRL);
    expect(k.bookedNights).toBeGreaterThan(0);
    expect(k.estimatedRevenueBrl).toBe(k.bookedNights * DEFAULT_ADR_BRL);
    expect(k.reservationsCount).toBeGreaterThan(0);
  });
});

describe("projectionSummary", () => {
  const base = {
    occupancyPct: 75,
    adr: 350,
    cleaningPerStay: 120,
    managementPct: 18,
    taxesPct: 6,
    condoMonthly: 500,
    startDate: new Date(Date.UTC(2026, 0, 1)),
  };

  it("computes positive gross/net revenue and net below gross", () => {
    const s = projectionSummary({ ...base, propertyValue: 0 });
    expect(s.grossRevenueBrl).toBeGreaterThan(0);
    expect(s.netRevenueBrl).toBeLessThan(s.grossRevenueBrl);
    expect(s.annualNetRevenueBrl).toBeGreaterThan(0);
    expect(s.netMarginPct).toBeGreaterThan(0);
    expect(s.netMarginPct).toBeLessThan(100);
  });

  it("returns no ROI when property value is zero", () => {
    const s = projectionSummary({ ...base, propertyValue: 0 });
    expect(s.capRatePct).toBe(0);
    expect(s.paybackYears).toBeNull();
  });

  it("derives cap rate and payback from property value", () => {
    const s = projectionSummary({ ...base, propertyValue: 800000 });
    expect(s.capRatePct).toBeGreaterThan(0);
    expect(s.paybackYears).not.toBeNull();
    // cap rate = annual net / property value * 100
    expect(s.capRatePct).toBeCloseTo((s.annualNetRevenueBrl / 800000) * 100, 5);
  });

  it("scales revenue with occupancy", () => {
    const low = projectionSummary({ ...base, occupancyPct: 40, propertyValue: 0 });
    const high = projectionSummary({ ...base, occupancyPct: 90, propertyValue: 0 });
    expect(high.grossRevenueBrl).toBeGreaterThan(low.grossRevenueBrl);
  });
});
