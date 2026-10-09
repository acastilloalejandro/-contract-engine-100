const params = new URLSearchParams(location.search);
const id = params.get("id") || "";
const version = params.get("version") || "";
const hash = params.get("hash") || "";
const request = params.get("request") || "";
const mode = params.get("mode") || "";

const idPattern = /^[A-Z0-9-]{8,120}$/i;
const versionPattern = /^\d+\.\d+\.\d+(?:[-+][A-Z0-9.-]+)?$/i;
const hashPattern = /^[a-f0-9]{64}$/i;
const valid = id.length <= 120 && request.length <= 120 &&
  idPattern.test(id) && idPattern.test(request) &&
  versionPattern.test(version) && hashPattern.test(hash) &&
  mode === "static";

const status = document.querySelector("#status");
status.textContent = valid ? "Formato compatible · NO VERIFICADO" : "Enlace incompleto";
status.className = "hero-value pill " + (valid ? "warning" : "bad");
document.querySelector("#summary").textContent = valid
  ? "Los parámetros tienen un formato compatible. Este sitio estático no comprueba el expediente, la identidad, la integridad contra una copia almacenada ni una firma electrónica."
  : "Falta información o algún identificador no tiene el formato esperado.";

const rows = document.querySelector("#rows");
for (const [label, value] of [
  ["Expediente", id],
  ["Versión", version],
  ["SHA-256", hash],
  ["Request ID", request],
  ["Modo", mode || "—"]
]) {
  const row = document.createElement("div");
  row.className = "hash-row";
  const name = document.createElement("span");
  name.textContent = label;
  const result = document.createElement("b");
  result.className = "break";
  result.textContent = value || "—";
  row.append(name, result);
  rows.append(row);
}
