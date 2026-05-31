import { describe, it, expect } from "vitest";
import { deriveDeal } from "../dealStatus";

const base = {
  projectId: "p1",
  hasNeighborhood: false,
  hasPropertyValue: false,
  hasConnection: false,
  hasRealEvents: false,
};

describe("deriveDeal", () => {
  it("starts at the projection stage with 0% progress", () => {
    const d = deriveDeal(base);
    expect(d.stage).toBe("projecao");
    expect(d.progressPct).toBe(0);
    expect(d.nextStep.to).toBe("/projeto/p1");
  });

  it("advances to the property-value stage once neighborhood is set", () => {
    const d = deriveDeal({ ...base, hasNeighborhood: true });
    expect(d.stage).toBe("valor");
    expect(d.progressPct).toBe(25);
    expect(d.steps[0].done).toBe(true);
    expect(d.steps[1].done).toBe(false);
  });

  it("advances to the connection stage once property value is informed", () => {
    const d = deriveDeal({ ...base, hasNeighborhood: true, hasPropertyValue: true });
    expect(d.stage).toBe("conexao");
    expect(d.progressPct).toBe(50);
  });

  it("reaches operating stage when fully set up", () => {
    const d = deriveDeal({
      projectId: "p1",
      hasNeighborhood: true,
      hasPropertyValue: true,
      hasConnection: true,
      hasRealEvents: true,
    });
    expect(d.stage).toBe("operando");
    expect(d.progressPct).toBe(100);
    expect(d.label).toBe("Operando");
  });

  it("treats a connected-but-empty calendar as operating stage, not yet operating label", () => {
    const d = deriveDeal({
      projectId: "p1",
      hasNeighborhood: true,
      hasPropertyValue: true,
      hasConnection: true,
      hasRealEvents: false,
    });
    expect(d.stage).toBe("operando");
    expect(d.progressPct).toBe(75);
    expect(d.label).not.toBe("Operando");
  });
});
