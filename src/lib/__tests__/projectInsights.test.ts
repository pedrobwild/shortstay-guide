import { describe, it, expect } from "vitest";
import { generateDashboardSummary } from "../projectInsights";
import type {
  ProjectKpis, MonthlyOccupancy, ForwardWindowOccupancy, SeasonalityMonth,
  YoYMonth, BookingPatterns, BreakEvenAnalysis, InvestmentReturn, WeekendSplit,
} from "../projectAnalytics";

const baseKpis: ProjectKpis = {
  occupancyPct: 60,
  bookedNights: 100,
  blockedNights: 10,
  totalNights: 180,
  averageStayNights: 3,
  reservationsCount: 33,
  blockedCount: 3,
  estimatedRevenueBrl: 35_000,
  windowStart: new Date(Date.UTC(2026, 0, 1)),
  windowEnd: new Date(Date.UTC(2026, 5, 30)),
};

const baseOtb = (pct: number): ForwardWindowOccupancy => ({
  windowDays: 30,
  bookedNights: Math.round((pct / 100) * 30),
  blockedNights: 0,
  availableNights: 30 - Math.round((pct / 100) * 30),
  occupancyPct: pct,
  bookedPct: pct,
  estimatedRevenueBrl: Math.round((pct / 100) * 30) * 350,
});

const basePatterns: BookingPatterns = {
  reservationsCount: 33,
  blockedCount: 3,
  blockRatePct: 9,
  backToBackCount: 2,
  backToBackRatePct: 6,
  averageGapNights: 4,
  medianGapNights: 3,
  longestStayNights: 9,
  shortestStayNights: 1,
  weekendArrivalsPct: 40,
};

const baseBreakEven: BreakEvenAnalysis = {
  monthlyFixedCosts: 500,
  monthlyVariableRatio: 0.24,
  cleaningPerStay: 120,
  averageStayNights: 3,
  effectiveAdr: 310,
  contributionPerNight: 226,
  breakEvenNightsPerMonth: 2.2,
  breakEvenOccupancyPct: 7.4,
  currentMonthlyOccupancyPct: 60,
  marginVsBreakEvenPct: 52.6,
};

const baseReturns: InvestmentReturn = {
  propertyValueBrl: 0,
  monthsObserved: 6,
  annualizedGrossRevenueBrl: 70_000,
  annualizedNetRevenueBrl: 40_000,
  grossYieldPct: 0,
  capRatePct: 0,
  paybackYears: null,
  monthlyAvgGrossBrl: 5800,
  monthlyAvgNetBrl: 3300,
};

const baseWeekend: WeekendSplit = {
  weekendNights: 40,
  weekdayNights: 60,
  weekendPct: 40,
  weekdayPct: 60,
  weekendOccupancyPct: 70,
  weekdayOccupancyPct: 50,
  weekendRevenueBrl: 14000,
  weekdayRevenueBrl: 21000,
};

function defaultInput() {
  return {
    kpis: baseKpis,
    monthly: [
      { monthKey: "2026-01", monthLabel: "Jan/26", daysInMonth: 31, bookedNights: 15, blockedNights: 1, occupancyPct: 50, estimatedRevenueBrl: 5000 } as MonthlyOccupancy,
      { monthKey: "2026-02", monthLabel: "Fev/26", daysInMonth: 28, bookedNights: 18, blockedNights: 2, occupancyPct: 70, estimatedRevenueBrl: 6000 } as MonthlyOccupancy,
      { monthKey: "2026-03", monthLabel: "Mar/26", daysInMonth: 31, bookedNights: 20, blockedNights: 1, occupancyPct: 65, estimatedRevenueBrl: 7000 } as MonthlyOccupancy,
    ],
    otb30: baseOtb(50),
    otb60: baseOtb(45),
    seasonality: [] as SeasonalityMonth[],
    yoy: [] as YoYMonth[],
    patterns: basePatterns,
    breakEven: baseBreakEven,
    returns: baseReturns,
    weekendSplit: baseWeekend,
    longestGap: null,
    netMarginPct: 50,
    netRevenueBrl: 17500,
    hasPropertyValue: false,
  };
}

describe("generateDashboardSummary", () => {
  it("flags low OTB as warning and produces a recommendation", () => {
    const input = { ...defaultInput(), otb30: baseOtb(15) };
    const s = generateDashboardSummary(input);
    expect(s.highlights.some((h) => h.tone === "warning" && h.title.includes("OTB"))).toBe(true);
    expect(s.recommendations.length).toBeGreaterThan(0);
  });

  it("flags break-even risk as negative when margin is below zero", () => {
    const input = { ...defaultInput(), breakEven: { ...baseBreakEven, marginVsBreakEvenPct: -5, breakEvenOccupancyPct: 65 } };
    const s = generateDashboardSummary(input);
    expect(s.highlights.some((h) => h.tone === "negative")).toBe(true);
  });

  it("returns a healthy summary when metrics are strong", () => {
    const input = { ...defaultInput(), otb30: baseOtb(80) };
    const s = generateDashboardSummary(input);
    expect(s.healthScore).toBeGreaterThan(50);
    expect(s.highlights.some((h) => h.tone === "positive")).toBe(true);
  });

  it("identifies growth trend from monthly series", () => {
    const s = generateDashboardSummary(defaultInput());
    expect(s.trendLabel).toBe("Em crescimento");
    expect(s.trendTone).toBe("positive");
  });

  it("identifies declining trend", () => {
    const monthly: MonthlyOccupancy[] = [
      { monthKey: "2026-01", monthLabel: "Jan/26", daysInMonth: 31, bookedNights: 25, blockedNights: 0, occupancyPct: 80, estimatedRevenueBrl: 0 },
      { monthKey: "2026-02", monthLabel: "Fev/26", daysInMonth: 28, bookedNights: 18, blockedNights: 0, occupancyPct: 70, estimatedRevenueBrl: 0 },
      { monthKey: "2026-03", monthLabel: "Mar/26", daysInMonth: 31, bookedNights: 12, blockedNights: 0, occupancyPct: 40, estimatedRevenueBrl: 0 },
    ];
    const s = generateDashboardSummary({ ...defaultInput(), monthly });
    expect(s.trendLabel).toBe("Em desaceleração");
    expect(s.trendTone).toBe("negative");
  });

  it("limits highlights to 5 and recommendations to 3", () => {
    // Forçar muitos sinais
    const input = {
      ...defaultInput(),
      otb30: baseOtb(15),
      breakEven: { ...baseBreakEven, marginVsBreakEvenPct: -10 },
      patterns: { ...basePatterns, backToBackRatePct: 50, blockRatePct: 30 },
      longestGap: { from: new Date(), to: new Date(), nights: 12 },
      hasPropertyValue: true,
      returns: { ...baseReturns, capRatePct: 2.5, propertyValueBrl: 800_000 },
      yoy: [{
        monthKey: "2026-03", monthLabel: "Mar/26",
        currentBookedNights: 10, previousBookedNights: 25,
        currentOccupancyPct: 30, previousOccupancyPct: 80,
        occupancyDeltaPct: -50,
        currentRevenueBrl: 3000, previousRevenueBrl: 10000,
        revenueDeltaPct: -70,
      }],
    };
    const s = generateDashboardSummary(input);
    expect(s.highlights.length).toBeLessThanOrEqual(5);
    expect(s.recommendations.length).toBeLessThanOrEqual(3);
  });

  it("includes cap rate insight only when property value is set", () => {
    const withValue = generateDashboardSummary({
      ...defaultInput(),
      hasPropertyValue: true,
      returns: { ...baseReturns, capRatePct: 9, propertyValueBrl: 500_000 },
    });
    const withoutValue = generateDashboardSummary(defaultInput());
    expect(withValue.highlights.some((h) => h.title.toLowerCase().includes("cap rate"))).toBe(true);
    expect(withoutValue.highlights.some((h) => h.title.toLowerCase().includes("cap rate"))).toBe(false);
  });
});
