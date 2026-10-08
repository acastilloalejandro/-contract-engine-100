import type { ContractState } from "../domain/types";
import { classifyContract } from "../classification/classify";
import { buildRuleSnapshot } from "../rules-engine/snapshot";
import { validateContract } from "../validation/contract";

export interface PipelineResult {
  state: ContractState;
  classification: NonNullable<ContractState["classification"]>;
  validation: ReturnType<typeof validateContract>;
}

export function runContractPipeline(state: ContractState, now = new Date().toISOString()): PipelineResult {
  const classification = classifyContract(state);
  const classified = { ...state, classification, status: "VALIDATING" as const };
  const validation = validateContract(classified);
  const ruleSnapshot = buildRuleSnapshot(classified, now);

  const status = !validation.ok
    ? (validation.issues.some(issue => issue.severity === "BLOCKING") ? "REVIEW_REQUIRED" : "VALIDATING")
    : classification.blocking ? "REVIEW_REQUIRED" : "READY";

  return {
    state: { ...classified, ruleSnapshot, compliance: {
      status: validation.ok ? "PASS" : "BLOCK",
      issues: validation.issues
    }, status },
    classification,
    validation
  };
}
