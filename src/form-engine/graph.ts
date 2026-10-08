import type { ContractState } from "../domain/types";
import type { FormField } from "./schema";

export interface AnswerChange {
  fieldId: string;
  previous: unknown;
  next: unknown;
}

function fieldData(state: ContractState): Record<string, unknown> {
  return {
    "property.type": state.property.type,
    "tenancy.purpose": state.tenancy.purpose,
    "tenancy.temporaryCause": state.tenancy.temporaryCause,
    "tenancy.temporaryCauseEvidenceIds": state.tenancy.temporaryCauseEvidenceIds,
    "jurisdiction.municipality": state.jurisdiction.municipality,
    "dateContext.contractDate": state.dateContext.contractDate,
    "dateContext.startDate": state.dateContext.startDate,
    "dateContext.endDate": state.dateContext.endDate,
    "economics.requestedRent": state.economics.requestedRent,
    "economics.deposit": state.economics.deposit
  };
}

export function isVisible(field: FormField, state: ContractState): boolean {
  if (!field.visibleWhen) return true;
  return field.visibleWhen(fieldData(state));
}

export function visibleFields(fields: FormField[], state: ContractState): FormField[] {
  return fields.filter(field => isVisible(field, state));
}

export function invalidateDependentAnswers(fields: FormField[], change: AnswerChange): string[] {
  const affected = new Set<string>();
  const queue = [change.fieldId];

  while (queue.length) {
    const dependency = queue.shift()!;
    for (const field of fields) {
      if (field.dependsOn?.includes(dependency) && !affected.has(field.id)) {
        affected.add(field.id);
        queue.push(field.id);
      }
    }
  }

  return [...affected];
}
