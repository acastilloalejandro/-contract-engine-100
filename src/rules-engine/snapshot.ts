import type { ContractState, RuleSnapshot } from "../domain/types";
import { HOUSING_RULES } from "./rules";
import { applicable, sortRules } from "./rule";

export const ENGINE_VERSION = "housing-core-1.0.0";

export function buildRuleSnapshot(state: ContractState, evaluatedAt = new Date().toISOString()): RuleSnapshot {
  const rules = sortRules(HOUSING_RULES.filter(rule => applicable(rule, state)));
  return {
    ruleSetId: "housing-es",
    engineVersion: ENGINE_VERSION,
    rules: rules.map(rule => ({ id: rule.id, version: rule.version, source: rule.source })),
    evaluatedAt
  };
}
