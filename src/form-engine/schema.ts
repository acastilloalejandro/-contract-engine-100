export type FieldType = "text" | "number" | "date" | "select" | "multiselect" | "boolean" | "file" | "textarea";
export interface FormField { id: string; label: string; type: FieldType; required?: boolean; sensitive?: boolean; dependsOn?: string[]; visibleWhen?: (data: Record<string, unknown>) => boolean; options?: { value: string; label: string }[]; }
export const HOUSING_FLOW: FormField[] = [
  { id: "property.type", label: "¿Qué vas a alquilar?", type: "select", required: true, options: [
    { value: "whole_home", label: "Vivienda completa" }, { value: "room", label: "Habitación" }, { value: "partial_space", label: "Otra parte del inmueble" }
  ]},
  { id: "tenancy.purpose", label: "¿Para qué se utilizará?", type: "select", required: true, options: [
    { value: "habitual", label: "Vivienda habitual" }, { value: "temporary", label: "Vivienda temporal" }, { value: "other", label: "Otro supuesto" }
  ]},
  { id: "tenancy.temporaryCause", dependsOn: ["tenancy.purpose"], label: "¿Cuál es la causa real de temporalidad?", type: "textarea", required: true, visibleWhen: d => d["tenancy.purpose"] === "temporary" },
  { id: "tenancy.temporaryCauseEvidenceIds", dependsOn: ["tenancy.temporaryCause"], label: "Acreditación de la causa", type: "file", required: true, visibleWhen: d => d["tenancy.purpose"] === "temporary" },
  { id: "jurisdiction.municipality", label: "Municipio", type: "text", required: true },
  { id: "dateContext.contractDate", label: "Fecha del contrato", type: "date", required: true },
  { id: "dateContext.startDate", label: "Fecha de inicio", type: "date", required: true },
  { id: "dateContext.endDate", label: "Fecha de finalización", type: "date" },
  { id: "economics.requestedRent", label: "Renta", type: "number", required: true },
  { id: "economics.deposit", label: "Fianza", type: "number" }
];