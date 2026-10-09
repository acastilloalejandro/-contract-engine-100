import { SCHEMA } from "./schema.js";
import { state, filled, visibleFields, validate } from "./engine.js";

const EXCLUDED_SECTIONS = new Set(["Protección", "Consentimientos", "Documentos"]);
const EXCLUDED_FIELDS = new Set([
  "workerDateOfBirth",
  "workerNationality",
  "employerNationality",
  "employerIdNumber",
  "emergencyContact",
  "workerPreferredLanguage",
  "interpreterRequired",
  "workerUnderstandsContract",
  "workerIndependentCopy",
  "recruitmentFee",
  "paymentHistory",
  "privacyAcknowledgement",
  "independentReviewRequested",
  "consentIdentity",
  "consentDocuments",
  "consentContract"
]);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function fieldValue(field, value) {
  if (field.type === "checkbox" || field.type === "switch") return value === true ? "Sí" : value === false ? "No" : "";
  if (field.type === "select" || field.type === "radio") {
    return field.options.find(option => option.value === value)?.label ?? String(value ?? "");
  }
  if (field.type === "multiselect" && Array.isArray(value)) {
    return value.map(item => field.options.find(option => option.value === item)?.label ?? item).join(", ");
  }
  if (field.type === "file" || field.type === "files") return "";
  return String(value ?? "").trim();
}

function isFieldFilled(field) {
  const value = state.data[field.id];
  if (field.type === "checkbox") return value === true;
  if (field.type === "file") return Boolean(value?.id);
  if (field.type === "files") return Array.isArray(value) && value.length > 0;
  return filled(value);
}

function contractTitle() {
  const type = state.data.relationshipType;
  const option = SCHEMA.find(field => field.id === "relationshipType")?.options.find(item => item.value === type);
  if (type === "domestic_employment") return "Borrador de acuerdo de trabajo doméstico";
  if (type === "personal_assistant") return "Borrador de acuerdo de asistencia personal";
  if (type === "private_driver") return "Borrador de acuerdo de conducción privada";
  if (type === "caregiver") return "Borrador de acuerdo de cuidados";
  return option ? "Borrador de acuerdo · " + option.label : "Borrador de acuerdo contractual";
}

export function renderContractDraft() {
  const host = document.getElementById("contractDraftPreview");
  if (!host) return;

  const fields = visibleFields().filter(field =>
    !EXCLUDED_SECTIONS.has(field.section) &&
    !EXCLUDED_FIELDS.has(field.id) &&
    !field.restricted &&
    field.type !== "file" &&
    field.type !== "files"
  );
  const groups = new Map();
  for (const field of fields) {
    const value = fieldValue(field, state.data[field.id]);
    if (!value) continue;
    if (!groups.has(field.section)) groups.set(field.section, []);
    groups.get(field.section).push({ label: field.label, value });
  }

  const validation = validate();
  const pending = visibleFields().filter(field =>
    field.required && !EXCLUDED_SECTIONS.has(field.section) &&
    !EXCLUDED_FIELDS.has(field.id) && !isFieldFilled(field)
  );
  const sections = [...groups.entries()].map(([section, entries]) =>
    "<section class=\"contract-draft__section\"><h3>" + escapeHtml(section) + "</h3>" +
    "<dl>" + entries.map(entry =>
      "<div class=\"contract-draft__field\"><dt>" + escapeHtml(entry.label) +
      "</dt><dd>" + escapeHtml(entry.value) + "</dd></div>"
    ).join("") + "</dl></section>"
  ).join("");

  const pendingMarkup = pending.length
    ? "<section class=\"contract-draft__pending\"><h3>Datos pendientes</h3><p>Completa o revisa estos campos antes de compartir el borrador.</p><ul>" +
      pending.map(field => "<li>" + escapeHtml(field.label) + "</li>").join("") + "</ul></section>"
    : "<p class=\"contract-draft__complete\">No faltan campos obligatorios visibles en esta vista. Esto no demuestra validez jurídica.</p>";

  const status = validation.errors.length
    ? "Borrador incompleto · " + validation.errors.length + " error(es) de validación"
    : "Borrador preparado para revisión · no firmado";
  const jurisdiction = [state.data.city, state.data.country, state.data.jurisdiction].filter(Boolean).join(" · ");

  host.innerHTML =
    "<div class=\"contract-draft__toolbar\"><div><span class=\"eyebrow\">VISTA PREVIA</span><h2>Documento de trabajo</h2><p class=\"muted\">Previsualización local basada en los campos cumplimentados.</p></div>" +
    "<button id=\"printContractBtn\" type=\"button\" class=\"primary-btn\">Imprimir / Guardar PDF</button></div>" +
    "<article class=\"contract-draft__page\"><header class=\"contract-draft__header\"><p class=\"contract-draft__overline\">CONTRACT ENGINE 100 · VERSIÓN " +
    escapeHtml(state.prepared?.version || "5.2.0") + "</p><h1>" + escapeHtml(contractTitle()) + "</h1>" +
    "<p class=\"contract-draft__status\">" + escapeHtml(status) + "</p>" +
    "<p class=\"contract-draft__jurisdiction\">" + escapeHtml(jurisdiction || "Jurisdicción pendiente de indicar") + "</p></header>" +
    "<div class=\"contract-draft__notice\"><strong>BORRADOR · NO FIRMADO · NO VALIDADO JURÍDICAMENTE</strong><p>Este documento organiza los datos introducidos. No constituye asesoramiento jurídico, no verifica la legislación aplicable y no crea una firma electrónica. Requiere revisión humana competente antes de utilizarse.</p></div>" +
    sections +
    pendingMarkup +
    "<footer class=\"contract-draft__footer\"><p>Expediente local: " + escapeHtml(state.recordId) + "</p><p>Huella técnica: " +
    escapeHtml(state.hash || "Se calculará al iniciar la revisión") + "</p><p>La huella solo se refiere a los datos incluidos en el cálculo; no demuestra identidad ni autenticidad.</p></footer></article>";
}
