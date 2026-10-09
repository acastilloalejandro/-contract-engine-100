import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker, { verifyStripeSignature } from "../src/index.js";

globalThis.crypto ||= webcrypto;
const APP_ORIGIN = "https://app.example.com";
const API_ORIGIN = "https://api.example.com";
const env = { APP_ORIGIN, API_ORIGIN };

function assertSecurityHeaders(response) {
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("content-security-policy"),
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
}

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
assertSecurityHeaders(health);

const preflight = await worker.fetch(new Request(API_ORIGIN + "/v1/auth/login", {
  method: "OPTIONS", headers: { Origin: APP_ORIGIN, "Access-Control-Request-Method": "POST" }
}), env);
assert.equal(preflight.status, 204);
assertSecurityHeaders(preflight);
assert.equal(preflight.headers.get("access-control-allow-origin"), APP_ORIGIN);
assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
assert.doesNotMatch(preflight.headers.get("access-control-allow-origin"), /\*/);

const rejectedPreflight = await worker.fetch(new Request(API_ORIGIN + "/v1/auth/login", {
  method: "OPTIONS", headers: { Origin: "https://attacker.example" }
}), env);
assert.equal(rejectedPreflight.status, 403);
assertSecurityHeaders(rejectedPreflight);

const databaseMissing = await worker.fetch(new Request(API_ORIGIN + "/v1/auth/session", {
  headers: { Origin: APP_ORIGIN }
}), env);
assert.equal(databaseMissing.status, 503);
assertSecurityHeaders(databaseMissing);
assert.equal((await databaseMissing.json()).code, "DATABASE_NOT_CONFIGURED");

const unknown = await worker.fetch(new Request(API_ORIGIN + "/not-found", {
  headers: { Origin: APP_ORIGIN }
}), { ...env, DB: {} });
assert.equal(unknown.status, 404);
assertSecurityHeaders(unknown);
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



// Authorization regression tests: a signed-in user must not be able to act
// on another user's phone-verification challenge or bypass protected routes.
async function hashTokenForTest(value) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value))));
  let binary = "";
  for (const byte of digest) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function authorizationDb({ sessions = [], users = [], phoneChallenges = [] } = {}) {
  const calls = [];
  const db = {
    calls,
    prepare(sql) {
      let params = [];
      return {
        bind(...values) { params = values; return this; },
        async first() {
          calls.push({ type: "first", sql, params });
          if (sql.includes("FROM sessions s JOIN users u")) {
            const session = sessions.find(item =>
              item.token_hash === params[0] && Number(item.expires_at) > Number(params[1])
            );
            if (!session) return null;
            const user = users.find(item => item.id === session.user_id);
            return user ? { ...user } : null;
          }
          if (sql.includes("FROM phone_challenges WHERE id = ? AND user_id = ?")) {
            return phoneChallenges.find(item =>
              item.id === params[0] && item.user_id === params[1]
            ) || null;
          }
          return null;
        },
        async run() {
          calls.push({ type: "run", sql, params });
          return { meta: { changes: 1 } };
        }
      };
    }
  };
  return db;
}

const protectedRoutes = [
  ["POST", "/v1/onboarding/phone/start", { phone: "+34600111222" }],
  ["POST", "/v1/onboarding/phone/confirm", { challengeId: "challenge-12345678901234567890", code: "123456" }],
  ["POST", "/v1/onboarding/identity/start", { documentType: "DNI", country: "ES" }],
  ["GET", "/v1/onboarding/status", undefined]
];

for (const [method, path, body] of protectedRoutes) {
  const request = new Request(API_ORIGIN + path, {
    method,
    headers: { Origin: APP_ORIGIN, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const response = await worker.fetch(request, { ...env, DB: {} });
  assert.equal(response.status, 401, method + " " + path + " must require a session");
  assert.equal((await response.json()).code, "AUTH_REQUIRED");
  assertSecurityHeaders(response);
}

const originGuard = await worker.fetch(new Request(API_ORIGIN + "/v1/onboarding/status", {
  headers: { Origin: "https://attacker.example", Cookie: "__Host-ce_session=must-not-be-read" }
}), { ...env, DB: { prepare() { throw new Error("DB should not be read for a rejected Origin"); } } });
assert.equal(originGuard.status, 403);
assert.equal((await originGuard.json()).code, "ORIGIN_NOT_ALLOWED");
assertSecurityHeaders(originGuard);

const sessionToken = "session-token-for-user-a";
const sessionHash = await hashTokenForTest(sessionToken);
const nowForAuthorization = Math.floor(Date.now() / 1000);
const userA = {
  id: "user-a",
  email: "alice@example.invalid",
  email_verified: 1,
  phone_verified: 0,
  identity_status: "unverified"
};
const sessionDb = authorizationDb({
  sessions: [{ token_hash: sessionHash, user_id: userA.id, expires_at: nowForAuthorization + 3600 }],
  users: [userA]
});
const authorizedStatus = await worker.fetch(new Request(API_ORIGIN + "/v1/onboarding/status", {
  headers: { Origin: APP_ORIGIN, Cookie: "__Host-ce_session=" + sessionToken }
}), { ...env, DB: sessionDb });
assert.equal(authorizedStatus.status, 200);
assert.deepEqual(await authorizedStatus.json(), {
  emailVerified: true,
  phoneVerified: false,
  identityStatus: "unverified",
  identityVerified: false
});
assertSecurityHeaders(authorizedStatus);

const challengeIdOwnedByB = "challenge-owner-b-1234567890";
const crossUserDb = authorizationDb({
  sessions: [{ token_hash: sessionHash, user_id: userA.id, expires_at: nowForAuthorization + 3600 }],
  users: [userA],
  phoneChallenges: [{
    id: challengeIdOwnedByB,
    user_id: "user-b",
    phone: "+34600999888",
    attempts: 0,
    expires_at: nowForAuthorization + 600,
    used_at: null
  }]
});
const crossUserAttempt = await worker.fetch(new Request(API_ORIGIN + "/v1/onboarding/phone/confirm", {
  method: "POST",
  headers: {
    Origin: APP_ORIGIN,
    Cookie: "__Host-ce_session=" + sessionToken,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ challengeId: challengeIdOwnedByB, code: "123456" })
}), { ...env, DB: crossUserDb });
assert.equal(crossUserAttempt.status, 400);
assert.equal((await crossUserAttempt.json()).code, "PHONE_CHALLENGE_EXPIRED");
assert.ok(crossUserDb.calls.some(call =>
  call.type === "first" &&
  call.sql.includes("FROM phone_challenges WHERE id = ? AND user_id = ?") &&
  call.params[0] === challengeIdOwnedByB &&
  call.params[1] === userA.id
), "challenge lookup must bind both challenge ID and the authenticated user ID");
assert.equal(crossUserDb.calls.filter(call =>
  call.type === "run" && /UPDATE phone_challenges/i.test(call.sql)
).length, 0, "a non-owner must not mutate another user's challenge");

console.log("Worker API and authorization regression tests: OK");
