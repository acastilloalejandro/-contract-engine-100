import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { state, publicData, integrityData, validateDocumentFile, visibleFields, validate } from "../app/engine.js";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const schema = read("app/schema.js");
const engine = read("app/engine.js");
const main = read("app/main.js");
const contractPreview = read("app/contract-preview.js");
const index = read("index.html");
const verifyHtml = read("verify.html");
const verifyScript = read("app/verify.js");
const config = read("config.js");
const gates = read("docs/PRODUCTION-GATES.md");
const saveBlock = engine.slice(engine.indexOf("export function saveLocal"), engine.indexOf("export async function restore"));
const serviceWorker = read("sw.js");
const postdeploy = read("scripts/postdeploy-smoke.mjs");
const manifest = JSON.parse(read("manifest.webmanifest"));

assert.equal(pkg.version, "5.2.0");
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[""].version, pkg.version);
assert.match(schema, /VERSION="5\.2\.0"/);
assert.match(index, /application-version" content="5\.2\.0"/);
assert.doesNotMatch(engine, /data:\{workerRole:"worker",country:"SA",city:"Jeddah"/);
assert.match(engine, /indexedDB/);
assert.match(engine, /persistDocumentBlob/);
assert.match(engine, /export async function restore\(\)/);
assert.match(engine, /export async function validateDocumentFile\(file\)/);
assert.match(engine, /f\.private\|\|f\.restricted/);
assert.match(engine, /clearPersistedDocuments/);
assert.match(engine, /STORAGE_KEY="ce100:v5\.2"/);
assert.match(engine, /LEGACY_STORAGE_KEY="ce100:v5"/);
assert.match(engine, /sanitizeSavedData/);
assert.match(engine, /localStorage\.removeItem\(sourceKey\)/);
assert.match(schema, /F\("additionalDocuments","Documentos","Otros documentos y anexos","files",\{private:true\}\)/);
assert.doesNotMatch(saveBlock, /documents:\s*state\.docs\.filter/);
assert.match(main, /await restore\(\)/);
assert.doesNotMatch(main, /cdn\.jsdelivr\.net/);
assert.match(main, /warningsAcknowledged/);
assert.match(main, /function focusDocuments\(\)/);
assert.match(main, /window.print\(\)/);
assert.match(contractPreview, /EXCLUDED_SECTIONS/);
assert.match(contractPreview, /EXCLUDED_FIELDS/);
assert.match(contractPreview, /NO FIRMADO/);
assert.match(contractPreview, /VALIDADO JURÍDICAMENTE/);
assert.match(postdeploy, /app\\/contract-preview\\.js/);
assert.match(postdeploy, /application-version/);
assert.match(postdeploy, /Post-deploy Pages smoke test passed/);
assert.match(index, /vendor\/qrcode\.min\.js/);
assert.match(index, /Content-Security-Policy/);
assert.match(index, /connect-src 'self'/);
assert.match(main, /serviceWorker/);
assert.match(serviceWorker, /ce100-shell-v5\.2\.0/);
assert.match(serviceWorker, /request\.mode === "navigate"/);
assert.ok(manifest.icons.some(icon => icon.src.includes("contract-engine.svg")));
assert.match(verifyHtml, /app\/verify\.js/);
assert.match(verifyHtml, /no-referrer/);
assert.match(verifyScript, /NO VERIFICADO/);
assert.match(verifyScript, /mode === "static"/);
assert.match(config, /authBaseUrl:\s*""/);
assert.match(gates, /no está desplegada|no está activa/i);

// Sensitive identifiers and private contact fields must never enter the
// canonical integrity payload or the local/public data serializer.
state.data.employerIdNumber = "PREDICTABLE-ID-123";
state.data.workerEmail = "person@example.invalid";
state.data.position = "Cuidador/a";
assert.equal(Object.hasOwn(integrityData(), "employerIdNumber"), false);
assert.equal(Object.hasOwn(integrityData(), "workerEmail"), false);
assert.equal(Object.hasOwn(publicData(), "employerIdNumber"), false);
assert.equal(Object.hasOwn(publicData(), "workerEmail"), false);
assert.equal(integrityData().position, "Cuidador/a");
state.role = "reviewer";
assert.equal(visibleFields().some(field => field.id === "workerEmail"), false);
assert.equal(visibleFields().some(field => field.id === "employerIdNumber"), false);
state.role = "worker";
state.data.country = "ES";
state.data.compensation = "paid";
state.data.currency = "SAR";
state.data.jurisdiction = "Jurisdicción de prueba";
assert.ok(validate().warnings.some(warning => warning.field === "currency"));
assert.ok(validate().warnings.some(warning => warning.field === "jurisdiction"));

// The upload guard checks both the allow-listed extension and the actual
// file signature. MIME declarations alone are insufficient.
const makeFile = (bytes, name, type) => {
  const blob = new Blob([new Uint8Array(bytes)], { type });
  Object.defineProperty(blob, "name", { value: name });
  return blob;
};
const validPdf = makeFile([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37], "contract.pdf", "application/pdf");
assert.equal(await validateDocumentFile(validPdf), "");
const fakePdf = makeFile([0x3c,0x68,0x74,0x6d,0x6c,0x3e], "contract.pdf", "application/pdf");
assert.match(await validateDocumentFile(fakePdf), /contenido no coincide/i);
const svg = makeFile([0x3c,0x73,0x76,0x67,0x3e], "document.svg", "image/svg+xml");
assert.match(await validateDocumentFile(svg), /Formato no admitido/i);
const mismatch = makeFile([0xff,0xd8,0xff,0x00], "photo.png", "image/png");
assert.match(await validateDocumentFile(mismatch), /contenido no coincide/i);

console.log("Production hardening regression tests: OK");
