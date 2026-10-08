import type { ContractState } from "../domain/types";
import type { LegalRule } from "./rule";
import { applicable } from "./rule";

const SOURCE = {
  authority: "Boletín Oficial del Estado",
  citation: "Real Decreto-ley 29/2026, de 6 de octubre, art. 3, modificación de los arts. 2, 7 y 9 bis LAU",
  url: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-20823"
};

function durationDays(state: ContractState): number | undefined {
  if (!state.dateContext.startDate || !state.dateContext.endDate) return undefined;
  const start = Date.parse(state.dateContext.startDate);
  const end = Date.parse(state.dateContext.endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined;
  return Math.floor((end - start) / 86400000);
}

export const HOUSING_RULES: LegalRule[] = [
  {
    id: "housing.temporary.cause-required",
    version: "2026.10.08",
    jurisdiction: "ES",
    effectiveFrom: "2026-10-08",
    priority: 100,
    source: SOURCE,
    evaluate: s => s.tenancy.purpose === "temporary" && !s.tenancy.temporaryCause
      ? [{ code: "TEMPORARY_CAUSE_REQUIRED", severity: "BLOCKING", message: "Falta la causa real de temporalidad.", field: "tenancy.temporaryCause" }]
      : []
  },
  {
    id: "housing.temporary.evidence-required",
    version: "2026.10.08",
    jurisdiction: "ES",
    effectiveFrom: "2026-10-08",
    priority: 99,
    source: SOURCE,
    evaluate: s => {
      if (s.tenancy.purpose !== "temporary") return [];
      const ids = s.tenancy.temporaryCauseEvidenceIds ?? [];
      const verified = new Set(s.evidence.filter(e => e.status === "VERIFIED").map(e => e.id));
      return ids.some(id => verified.has(id))
        ? []
        : [{ code: "TEMPORARY_EVIDENCE_REQUIRED", severity: "BLOCKING", message: "La causa temporal debe estar respaldada por evidencia verificable.", field: "tenancy.temporaryCauseEvidenceIds" }];
    }
  },
  {
    id: "housing.temporary.minimum-duration",
    version: "2026.10.08",
    jurisdiction: "ES",
    effectiveFrom: "2026-10-08",
    priority: 98,
    source: SOURCE,
    evaluate: s => {
      if (s.tenancy.purpose !== "temporary") return [];
      const days = durationDays(s);
      return days !== undefined && days <= 31
        ? [{ code: "TEMPORARY_DURATION_TOO_SHORT", severity: "BLOCKING", message: "El arrendamiento temporal debe superar 31 días.", field: "dateContext.endDate" }]
        : [];
    }
  },
  {
    id: "housing.temporary.general-duration-limit",
    version: "2026.10.08",
    jurisdiction: "ES",
    effectiveFrom: "2026-10-08",
    priority: 97,
    source: SOURCE,
    evaluate: s => {
      if (s.tenancy.purpose !== "temporary") return [];
      const days = durationDays(s);
      return days !== undefined && days > 365
        ? [{ code: "TEMPORARY_DURATION_REVIEW", severity: "WARNING", message: "La duración supera un año y requiere justificar la subsistencia de la causa y revisar la regulación aplicable.", field: "dateContext.endDate" }]
        : [];
    }
  }
];

export function evaluateRules(state: ContractState) {
  const active = HOUSING_RULES.filter(r => applicable(r, state));
  return {
    issues: active.flatMap(r => r.evaluate(state).map(i => ({ ...i, ruleId: r.id }))),
    ruleIds: active.map(r => ({ id: r.id, version: r.version }))
  };
}
