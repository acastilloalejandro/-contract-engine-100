import type { ContractState, ValidationIssue } from "../domain/types";

export interface LegalRule {
  id: string;
  version: string;
  jurisdiction: string;
  effectiveFrom: string;
  effectiveTo?: string;
  priority?: number;
  source?: { authority: string; citation: string; url?: string };
  evaluate(state: ContractState): ValidationIssue[];
}

function jurisdictionMatches(ruleJurisdiction: string, state: ContractState): boolean {
  const parts = ruleJurisdiction.split("/");
  const hierarchy = [
    state.jurisdiction.country,
    state.jurisdiction.autonomousCommunity,
    state.jurisdiction.province,
    state.jurisdiction.municipality
  ].filter(Boolean);
  return parts.every((part, index) => hierarchy[index] === part);
}

export function applicable(rule: LegalRule, state: ContractState): boolean {
  const date = state.dateContext.contractDate;
  return !!date &&
    date >= rule.effectiveFrom &&
    (!rule.effectiveTo || date <= rule.effectiveTo) &&
    jurisdictionMatches(rule.jurisdiction, state);
}

export function sortRules(rules: LegalRule[]): LegalRule[] {
  return [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id));
}
