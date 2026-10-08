import type { ContractState, ValidationIssue } from "../domain/types";
export interface LegalRule {
  id: string; version: string; jurisdiction: string; effectiveFrom: string; effectiveTo?: string; priority?: number;
  evaluate(state: ContractState): ValidationIssue[];
}
export function applicable(rule: LegalRule, state: ContractState): boolean {
  const date = state.dateContext.contractDate;
  return !!date && date >= rule.effectiveFrom && (!rule.effectiveTo || date <= rule.effectiveTo) && rule.jurisdiction === state.jurisdiction.country;
}