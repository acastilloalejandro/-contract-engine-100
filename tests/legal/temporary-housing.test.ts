import { describe, expect, it } from "vitest";
import { validateContract } from "../../src/validation/contract";
import type { ContractState } from "../../src/domain/types";
const base = (): ContractState => ({
  contractId: "test", version: 1, status: "DRAFT", createdAt: "2026-10-08T00:00:00Z", updatedAt: "2026-10-08T00:00:00Z",
  jurisdiction: { country: "ES", municipality: "Barcelona" }, dateContext: { contractDate: "2026-10-08", startDate: "2026-11-01" },
  property: { type: "room" }, parties: { landlords: [], tenants: [] }, tenancy: { purpose: "temporary" }, economics: {}, evidence: []
});
describe("temporary housing", () => {
  it("blocks missing cause", () => expect(validateContract(base()).ok).toBe(false));
  it("blocks missing evidence", () => { const s = base(); s.tenancy.temporaryCause = "Studies"; expect(validateContract(s).ok).toBe(false); });
  it("passes when cause and evidence references exist", () => { const s = base(); s.tenancy.temporaryCause = "Studies"; s.tenancy.temporaryCauseEvidenceIds = ["E1"]; expect(validateContract(s).ok).toBe(true); });
});