import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker, { verifyStripeSignature } from "../src/index.js";

globalThis.crypto ||= webcrypto;
const APP_ORIGIN = "https://app.example.com";
const API_ORIGIN = "https://api.example.com";
const env = { APP_ORIGIN, API_ORIGIN };

async function hmacSignature(body, secret, timestamp) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + "." + body)));
  const hex = [...digest].map(value => value.toString(16).padStart(2, "0")).join("");
  return "t=" + timestamp + ",v1=" + hex;
}

const health = await worker.fetch(new Request(API_ORIGIN + "/health"), env);
assert.equal(health.status, 200);
assert.equal(await health.text(), "ok");
assert.equal(health.headers.get("cache-control"), "no-store");

const preflight = await worker.fetch(new Request(API_ORIGIN + "/v1/auth/login", {
  method: "OPTIONS", headers: { Origin: APP_ORIGIN, "Access-Control-Request-Method": "POST" }
}), env);
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("access-control-allow-origin"), APP_ORIGIN);
assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
assert.doesNotMatch(preflight.headers.get("access-control-allow-origin"), /\*/);

const rejectedPreflight = await worker.fetch(new Request(API_ORIGIN + "/v1/auth/login", {
  method: "OPTIONS", headers: { Origin: "https://attacker.example" }
}), env);
assert.equal(rejectedPreflight.status, 403);

const databaseMissing = await worker.fetch(new Request(API_ORIGIN + "/v1/auth/session", {
  headers: { Origin: APP_ORIGIN }
}), env);
assert.equal(databaseMissing.status, 503);
assert.equal((await databaseMissing.json()).code, "DATABASE_NOT_CONFIGURED");

const unknown = await worker.fetch(new Request(API_ORIGIN + "/not-found", {
  headers: { Origin: APP_ORIGIN }
}), { ...env, DB: {} });
assert.equal(unknown.status, 404);
assert.equal((await unknown.json()).code, "NOT_FOUND");

const secret = "test-webhook-secret-only";
const payload = JSON.stringify({ id: "evt_test", type: "identity.verification_session.verified" });
const now = Math.floor(Date.now() / 1000);
const signed = await hmacSignature(payload, secret, String(now));
assert.equal(await verifyStripeSignature(payload, signed, secret), true);
assert.equal(await verifyStripeSignature(payload + " ", signed, secret), false);
const expired = await hmacSignature(payload, secret, String(now - 600));
assert.equal(await verifyStripeSignature(payload, expired, secret), false);
assert.equal(await verifyStripeSignature(payload, signed, "wrong-secret"), false);

console.log("Worker API contract tests: OK");
