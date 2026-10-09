import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const auth = fs.readFileSync(path.join(root, "app", "auth.js"), "utf8");
const docs = fs.readFileSync(path.join(root, "docs", "AUTH-ONBOARDING.md"), "utf8");

assert.match(auth, /credentials:\s*"include"/);
assert.match(auth, /startOAuth/);
assert.match(auth, /"google", "apple"/);
assert.match(auth, /\/v1\/onboarding\/phone\/start/);
assert.match(auth, /\/v1\/onboarding\/phone\/confirm/);
assert.match(auth, /\/v1\/onboarding\/identity\/start/);
assert.match(auth, /AuthConfigurationError/);
assert.doesNotMatch(auth, /localStorage|sessionStorage/);
assert.match(docs, /GitHub Pages/);
assert.match(docs, /state, nonce, PKCE/);
assert.match(docs, /No guardar DNI, teléfono/);
console.log("Authentication adapter contract tests: OK");
