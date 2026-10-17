/**
 * Shared UI helpers for the Intelligence module.
 * Prevents duplication of grade color maps, formatters, etc.
 */

import { DISCLAIMERS } from "@/lib/productFoundation";

// ── Grade color mapping (used in Dashboard, Ranking, AnalysisSummary) ──
export const GRADE_STYLES: Record<string, string> = {
  "text-success-strong": "bg-success-soft text-success-strong",
  "text-info-strong": "bg-info-soft text-info-strong",
  "text-warning-strong": "bg-warning-soft text-warning-strong",
  "text-cat-4-strong": "bg-cat-4-soft text-cat-4-strong",
  "text-danger-strong": "bg-danger-soft text-danger-strong",
};

export function getGradeStyle(gradeColor: string): string {
  return GRADE_STYLES[gradeColor] || "bg-muted text-foreground";
}

// ── Shared disclaimer text ──────────────────────────────────────
export const FOOTER_DISCLAIMER = DISCLAIMERS.general;
export const SCORES_DISCLAIMER = DISCLAIMERS.scores;
export const DATA_SOURCE_DISCLAIMER = DISCLAIMERS.dataSource;
