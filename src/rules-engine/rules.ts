import type { ContractState } from "../domain/types";
import type { LegalRule } from "./rule";
export const HOUSING_RULES: LegalRule[] = [
  { id: "housing.classification.temporary-cause", version: "2026.10.08", jurisdiction: "ES", effectiveFrom: "2026-10-08",
    evaluate: s => s.tenancy.purpose === "temporary" && !s.tenancy.temporaryCause ? [{ code: "TEMPORARY_CAUSE_REQUIRED", severity: "BLOCKING", message: "Falta la causa real de temporalidad.", field: "tenancy.temporaryCause" }] : [] },
  { id: "housing.classification.temporary-evidence", version: "2026.10.08", jurisdiction: "ES", effectiveFrom: "2026-10-08",
    evaluate: s => s.tenancy.purpose === "temporary" && !(s.tenancy.temporaryCauseEvidenceIds?.length) ? [{ code: "TEMPORARY_EVIDENCE_REQUIRED", severity: "BLOCKING", message: "Falta documentación acreditativa de la causa temporal.", field: "tenancy.temporaryCauseEvidenceIds" }] : [] }
];
export function evaluateRules(state: ContractState) {
  const active = HOUSING_RULES.filter(r => r.jurisdiction === state.jurisdiction.country && !!state.dateContext.contractDate && state.dateContext.contractDate >= r.effectiveFrom && (!r.effectiveTo || state.dateContext.contractDate <= r.effectiveTo));
  return { issues: active.flatMap(r => r.evaluate(state).map(i => ({ ...i, ruleId: r.id }))), ruleIds: active.map(r => ({ id: r.id, version: r.version })) };
}