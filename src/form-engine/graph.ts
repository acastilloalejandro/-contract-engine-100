import type { ContractState } from "../domain/types";
import type { FormField } from "./schema";

export interface AnswerChange {
  fieldId: string;
  previous: unknown;
  next: unknown;
}

export function isVisible(field: FormField, state: ContractState): boolean {
  if (!field.visibleWhen) return true;
  return field.visibleWhen(state as unknown as Record<string, unknown>);
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
