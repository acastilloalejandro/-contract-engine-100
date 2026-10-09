import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const D1_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function tomlString(text, name) {
  const escaped = name.replace(/[.*+?^$()|[\]{}]/g, "\\$&");
  return text.match(new RegExp("^\\s*" + escaped + '\\s*=\\s*"([^"\\n]*)"', "m"))?.[1] || "";
}

function httpsOrigin(value, name, errors) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.origin !== value || url.username || url.password ||
        url.hostname.endsWith(".example.com") || url.hostname === "example.com" ||
        url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
      throw new Error("not a production HTTPS origin");
    }
    return url;
  } catch {
    errors.push(name + " must be an explicit, non-example HTTPS origin with no path, query or fragment.");
    return null;
  }
}

export function checkProductionConfig(wrangler, frontend) {
  const errors = [];
  const app = httpsOrigin(tomlString(wrangler, "APP_ORIGIN"), "APP_ORIGIN", errors);
  const api = httpsOrigin(tomlString(wrangler, "API_ORIGIN"), "API_ORIGIN", errors);
  const databaseId = tomlString(wrangler, "database_id");
  if (!D1_UUID.test(databaseId) || databaseId === "00000000-0000-0000-0000-000000000000") {
    errors.push("D1 database_id must be a real UUID from the provisioned Cloudflare D1 database.");
  }
  if (!/\bbinding\s*=\s*"DB"/.test(wrangler)) {
    errors.push("D1 binding DB is required.");
  }
  if (/\bworkers_dev\s*=\s*true\b/.test(wrangler)) {
    errors.push("Set workers_dev = false for this custom-domain production profile.");
  }
  const match = frontend.match(/\bauthBaseUrl\s*:\s*"([^"]*)"/);
  if (!match || !match[1]) {
    errors.push("The frontend authBaseUrl is empty: production authentication is disabled.");
  } else if (api && match[1] !== api.origin) {
    errors.push("Frontend authBaseUrl must match the configured API_ORIGIN.");
  }
  if (app && api && app.origin === api.origin) {
    errors.push("Use separately routed frontend and API origins for the documented deployment profile.");
  }
  return { ok: errors.length === 0, errors };
}

export function runProductionPreflight(baseDir = ROOT) {
  const wrangler = fs.readFileSync(path.join(baseDir, "workers/api/wrangler.toml"), "utf8");
  const frontend = fs.readFileSync(path.join(baseDir, "config.js"), "utf8");
  return checkProductionConfig(wrangler, frontend);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runProductionPreflight();
  if (!result.ok) {
    process.stderr.write("Production configuration BLOCKED:\n" + result.errors.map(e => "- " + e).join("\n") + "\n");
    process.exitCode = 1;
  } else {
    process.stdout.write("Static production configuration preflight passed. Runtime/permissions/E2E checks are STILL REQUIRED.\n");
  }
}
