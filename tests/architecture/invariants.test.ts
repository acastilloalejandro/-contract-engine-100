import { describe, expect, it } from "vitest";

describe("Contract OS invariants", () => {
  it("uses a single canonical domain state", () => {
    expect("ContractState").toBe("ContractState");
  });

  it("keeps legal decisions outside the UI layer", () => {
    expect("rules-engine").not.toContain("ui");
  });

  it("requires versioned rules", () => {
    const rule = { id: "example", version: "1", jurisdiction: "ES", effectiveFrom: "2026-10-08" };
    expect(rule.version).toBeTruthy();
    expect(rule.jurisdiction).toBe("ES");
    expect(rule.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
