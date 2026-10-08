import type { ContractState, ValidationIssue } from "../domain/types";
import { evaluateRules } from "../rules-engine/rules";
export function validateContract(state: ContractState): { ok: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!state.property.type) issues.push({ code: "PROPERTY_TYPE_REQUIRED", severity: "BLOCKING", message: "Selecciona qué se alquila.", field: "property.type" });
  if (!state.tenancy.purpose) issues.push({ code: "PURPOSE_REQUIRED", severity: "BLOCKING", message: "Indica el uso contractual.", field: "tenancy.purpose" });
  if (state.dateContext.startDate && state.dateContext.endDate && state.dateContext.endDate < state.dateContext.startDate) issues.push({ code: "DATE_ORDER", severity: "ERROR", message: "La fecha de finalización no puede ser anterior al inicio.", field: "dateContext.endDate" });
  issues.push(...evaluateRules(state).issues);
  return { ok: !issues.some(i => i.severity === "BLOCKING" || i.severity === "ERROR"), issues };
}