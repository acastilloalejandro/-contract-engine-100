import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const html = read("index.html");
const gate = read("app/onboarding-ui.js");
const authSource = read("app/auth.js");
const engine = read("app/engine.js");
const config = read("config.js");
const css = read("styles/world-ui.css");

assert.match(html, /id="accessGate"/);
assert.match(html, /id="app" class="app-shell" hidden/);
assert.match(html, /id="phoneStartForm"/);
assert.match(html, /id="identityStartBtn"/);
assert.match(html, /config\.js/);
assert.match(gate, /onboardingStatus/);
assert.match(gate, /phoneIsVerified/);
assert.match(gate, /identityIsVerified/);
assert.match(gate, /identityProviderHosts/);
assert.match(gate, /No introduzcas ni subas tu DNI directamente/);
assert.match(authSource, /accounts\.google\.com/);
assert.match(authSource, /appleid\.apple\.com/);
assert.match(authSource, /La API de autenticación debe utilizar HTTPS/);
assert.doesNotMatch(authSource, /localStorage|sessionStorage/);
assert.match(engine, /setStorageScope/);
assert.match(engine, /state\.storageKey\|\|STORAGE_KEY/);
assert.match(engine, /f\.private\|\|f\.restricted/);
assert.match(config, /identityProviderHosts: \[\]/);
assert.match(css, /\.access-gate/);
assert.match(css, /\.provider-btn/);

// Unit-check the fail-closed configuration behavior without contacting a server.
globalThis.window = { CONTRACT_ENGINE_CONFIG: { authBaseUrl: "" } };
const { auth, AuthConfigurationError } = await import("../app/auth.js?onboarding-test");
assert.equal(auth.isConfigured(), false);
await assert.rejects(auth.session(), AuthConfigurationError);

// The API must reject insecure non-local HTTP endpoints before fetching credentials.
window.CONTRACT_ENGINE_CONFIG.authBaseUrl = "http://api.example.test";
await assert.rejects(auth.session(), /HTTPS/);

// OAuth redirect targets are constrained to their expected provider hosts.
window.CONTRACT_ENGINE_CONFIG.authBaseUrl = "https://api.example.test";
globalThis.fetch = async () => ({
  ok: true, status: 200,
  json: async () => ({ authorizationUrl: "https://evil.example/phishing" })
});
await assert.rejects(auth.startOAuth("google"), /destino de autenticación no permitido/);
console.log("Access and onboarding tests: OK");
