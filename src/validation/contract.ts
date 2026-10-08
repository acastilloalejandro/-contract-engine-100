import type { ContractState, ValidationIssue } from "../domain/types";
import { evaluateRules } from "../rules-engine/rules";

export function validateContract(state: ContractState): { ok: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (!state.property.type) issues.push({ code: "PROPERTY_TYPE_REQUIRED", severity: "BLOCKING", message: "Selecciona qué se alquila.", field: "property.type" });
  if (!state.tenancy.purpose) issues.push({ code: "PURPOSE_REQUIRED", severity: "BLOCKING", message: "Indica el uso contractual.", field: "tenancy.purpose" });
  if (!state.jurisdiction.country) issues.push({ code: "COUNTRY_REQUIRED", severity: "BLOCKING", message: "Indica el país de jurisdicción.", field: "jurisdiction.country" });
  if (!state.jurisdiction.municipality) issues.push({ code: "MUNICIPALITY_REQUIRED", severity: "BLOCKING", message: "Indica el municipio.", field: "jurisdiction.municipality" });
  if (!state.dateContext.contractDate) issues.push({ code: "CONTRACT_DATE_REQUIRED", severity: "BLOCKING", message: "Indica la fecha del contrato.", field: "dateContext.contractDate" });
  if (!state.dateContext.startDate) issues.push({ code: "START_DATE_REQUIRED", severity: "BLOCKING", message: "Indica la fecha de inicio.", field: "dateContext.startDate" });

  if (state.dateContext.startDate && state.dateContext.endDate && state.dateContext.endDate < state.dateContext.startDate) {
    issues.push({ code: "DATE_ORDER", severity: "ERROR", message: "La fecha de finalización no puede ser anterior al inicio.", field: "dateContext.endDate" });
  }
  if (state.economics.requestedRent !== undefined && state.economics.requestedRent < 0) {
    issues.push({ code: "NEGATIVE_RENT", severity: "ERROR", message: "La renta no puede ser negativa.", field: "economics.requestedRent" });
  }
  if (state.economics.deposit !== undefined && state.economics.deposit < 0) {
    issues.push({ code: "NEGATIVE_DEPOSIT", severity: "ERROR", message: "La fianza no puede ser negativa.", field: "economics.deposit" });
  }

  issues.push(...evaluateRules(state).issues);
  return { ok: !issues.some(i => i.severity === "BLOCKING" || i.severity === "ERROR"), issues };
}