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
  DEFAULT_ADR_BRL,
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
