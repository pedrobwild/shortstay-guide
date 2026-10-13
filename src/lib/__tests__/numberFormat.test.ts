import { describe, expect, it } from "vitest";
import { formatDecimal, formatPercent } from "@/lib/numberFormat";

describe("números exibidos em português", () => {
  it("exibe ocupação de 62 como 62,0%", () => expect(formatPercent(62)).toBe("62,0%"));
  it("exibe taxa de 18 como 18,0%", () => expect(formatPercent(18)).toBe("18,0%"));
  it("exibe estadia de 4.5 com vírgula", () => expect(formatDecimal(4.5)).toBe("4,5"));
  it("preserva a precisão solicitada", () => expect(formatDecimal(4.92, 2)).toBe("4,92"));
});