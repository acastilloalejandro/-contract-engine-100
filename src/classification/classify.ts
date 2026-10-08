import type { ContractState, ClassificationResult } from "../domain/types";

export function classifyContract(state: ContractState): ClassificationResult {
  const reasons: string[] = [];
  if (!state.property.type) return { code: "UNKNOWN", confidence: 0, reasons: ["Falta el tipo de inmueble."], blocking: true };
  if (!state.tenancy.purpose) return { code: "UNKNOWN", confidence: 0, reasons: ["Falta la finalidad del contrato."], blocking: true };

  const code = state.tenancy.purpose === "temporary"
    ? (state.property.type === "room" ? "HOUSING_TEMPORARY_ROOM" : "HOUSING_TEMPORARY")
    : state.tenancy.purpose === "habitual"
      ? (state.property.type === "room" ? "HOUSING_HABITUAL_ROOM" : "HOUSING_HABITUAL")
      : "HOUSING_OTHER";

  reasons.push(`assetType=${state.property.type}`);
  reasons.push(`purpose=${state.tenancy.purpose}`);

  const confidence = state.tenancy.purpose === "temporary" && !state.tenancy.temporaryCause ? 0.55 : 0.99;
  return { code, confidence, reasons, blocking: confidence < 0.8 };
}
