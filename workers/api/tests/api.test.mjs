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

function authorizationDb({
  sessions = [], users = [], phoneChallenges = [], identitySessions = [],
  processedStripeEvents = [], phoneChallengeClaimChanges = 1
} = {}) {
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
          if (sql.includes("FROM identity_sessions WHERE provider_session_id = ? AND user_id = ?")) {
            return identitySessions.find(item =>
              item.provider_session_id === params[0] && item.user_id === params[1]
            ) || null;
          }
          if (sql.includes("FROM stripe_webhook_events WHERE event_id = ?")) {
            return processedStripeEvents.includes(params[0]) ? { event_id: params[0] } : null;
          }
          return null;
        },
        async run() {
          calls.push({ type: "run", sql, params });
          if (sql.includes("UPDATE phone_challenges SET attempts = attempts + 1")) {
            return { meta: { changes: phoneChallengeClaimChanges } };
          }
          if (sql.includes("INSERT OR IGNORE INTO stripe_webhook_events")) {
            const eventId = params[0];
            if (processedStripeEvents.includes(eventId)) return { meta: { changes: 0 } };
            processedStripeEvents.push(eventId);
            return { meta: { changes: 1 } };
          }
          if (sql.includes("UPDATE identity_sessions SET status = ?")) {
            const [status, , eventCreated, id, userId] = params;
            const row = identitySessions.find(item => item.id === id && item.user_id === userId);
            if (!row || Number(row.last_event_created_at || 0) > Number(eventCreated)) {
              return { meta: { changes: 0 } };
            }
            if (["verified", "failed"].includes(row.status) && row.status !== status) {
              return { meta: { changes: 0 } };
            }
            const rank = { requires_input: 1, processing: 2, verified: 3, failed: 3 };
            if (Number(row.last_event_created_at || 0) === Number(eventCreated) &&
                (rank[status] || 0) < (rank[row.status] || 0)) {
              return { meta: { changes: 0 } };
            }
            row.status = status;
            row.last_event_created_at = Number(eventCreated);
            return { meta: { changes: 1 } };
          }
          if (sql.includes("UPDATE users SET identity_status = 'verified'")) {
            const user = users.find(item => item.id === params[0]);
            if (user) user.identity_status = "verified";
            return { meta: { changes: user ? 1 : 0 } };
          }
          if (sql.includes("UPDATE users SET identity_status = ?")) {
            const [status, id] = params;
            const user = users.find(item => item.id === id);
            if (!user || user.identity_status === "verified") return { meta: { changes: 0 } };
            user.identity_status = status;
            return { meta: { changes: 1 } };
          }
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



const identityEventSecret = "test-stripe-webhook-secret";
const foreignIdentityPayload = JSON.stringify({
  id: "evt_crossUserTest",
  type: "identity.verification_session.verified",
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: "vs-session-owned-by-b",
      type: "document",
      status: "verified",
      metadata: { user_id: "user-a" }
    }
  }
});
const foreignIdentityTimestamp = String(Math.floor(Date.now() / 1000));
const foreignIdentitySignature = await hmacSignature(
  foreignIdentityPayload,
  identityEventSecret,
  foreignIdentityTimestamp
);
const identityDb = authorizationDb({
  identitySessions: [{
    id: "local-identity-b",
    provider_session_id: "vs-session-owned-by-b",
    user_id: "user-b"
  }]
});
const foreignIdentityWebhook = await worker.fetch(new Request(API_ORIGIN + "/v1/webhooks/stripe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Stripe-Signature": foreignIdentitySignature
  },
  body: foreignIdentityPayload
}), { ...env, DB: identityDb, STRIPE_WEBHOOK_SECRET: identityEventSecret });
assert.equal(foreignIdentityWebhook.status, 200);
assert.equal(await foreignIdentityWebhook.text(), "ignored");
assertSecurityHeaders(foreignIdentityWebhook);
assert.ok(identityDb.calls.some(call =>
  call.type === "first" &&
  call.sql.includes("FROM identity_sessions WHERE provider_session_id = ? AND user_id = ?") &&
  call.params[0] === "vs-session-owned-by-b" &&
  call.params[1] === "user-a"
), "webhook updates must require both provider session ID and associated user ID");
assert.equal(identityDb.calls.filter(call =>
  call.type === "run" && /UPDATE (identity_sessions|users SET identity_status)/i.test(call.sql)
).length, 0, "a provider session owned by another user must not change identity status");



// Atomic phone-attempt claims must reject a race in which another request
// has already consumed the last available attempt.
const challengeRaceDb = authorizationDb({
  sessions: [{ token_hash: sessionHash, user_id: userA.id, expires_at: nowForAuthorization + 3600 }],
  users: [userA],
  phoneChallengeClaimChanges: 0,
  phoneChallenges: [{
    id: "challenge-owner-a-1234567890",
    user_id: userA.id,
    phone: "+34600111222",
    attempts: 4,
    expires_at: nowForAuthorization + 600,
    used_at: null
  }]
});
const racedPhoneConfirmation = await worker.fetch(new Request(API_ORIGIN + "/v1/onboarding/phone/confirm", {
  method: "POST",
  headers: {
    Origin: APP_ORIGIN,
    Cookie: "__Host-ce_session=" + sessionToken,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ challengeId: "challenge-owner-a-1234567890", code: "123456" })
}), { ...env, DB: challengeRaceDb });
assert.equal(racedPhoneConfirmation.status, 400);
assert.equal((await racedPhoneConfirmation.json()).code, "PHONE_CHALLENGE_EXPIRED");
assert.ok(challengeRaceDb.calls.some(call =>
  call.type === "run" &&
  call.sql.includes("attempts < 5") &&
  call.sql.includes("expires_at > ?")
), "phone-code attempt reservation must enforce expiry and maximum attempts atomically");

// A real owned Stripe event may move a pending identity session to verified.
const verifiedEventCreated = nowForAuthorization - 10;
const verifiedPayload = JSON.stringify({
  id: "evt_verifiedExample123",
  type: "identity.verification_session.verified",
  created: verifiedEventCreated,
  data: { object: {
    id: "vs-session-owned-by-a",
    type: "document",
    status: "verified",
    metadata: { user_id: "user-a" }
  } }
});
const verifiedSignature = await hmacSignature(
  verifiedPayload, identityEventSecret, String(Math.floor(Date.now() / 1000))
);
const verifiedUser = { ...userA, identity_status: "processing" };
const verifiedDb = authorizationDb({
  users: [verifiedUser],
  identitySessions: [{
    id: "local-identity-a",
    provider_session_id: "vs-session-owned-by-a",
    user_id: "user-a",
    status: "processing",
    last_event_created_at: verifiedEventCreated - 1
  }]
});
const verifiedResponse = await worker.fetch(new Request(API_ORIGIN + "/v1/webhooks/stripe", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Stripe-Signature": verifiedSignature },
  body: verifiedPayload
}), { ...env, DB: verifiedDb, STRIPE_WEBHOOK_SECRET: identityEventSecret });
assert.equal(verifiedResponse.status, 200);
assert.equal(await verifiedResponse.text(), "ok");
assert.equal(verifiedDb.calls.some(call => call.sql.includes("UPDATE identity_sessions SET status = ?")), true);
assert.equal(verifiedDb.calls.some(call => call.sql.includes("INSERT OR IGNORE INTO stripe_webhook_events")), true);
assert.equal(verifiedDb.calls.filter(call => call.sql.includes("UPDATE users SET identity_status = 'verified'")).length, 1);
assert.equal(verifiedUser.identity_status, "verified");

// Replaying the exact Stripe event is idempotent and cannot re-run mutations.
const callsAfterFirstVerified = verifiedDb.calls.filter(call => call.type === "run").length;
const duplicateResponse = await worker.fetch(new Request(API_ORIGIN + "/v1/webhooks/stripe", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Stripe-Signature": verifiedSignature },
  body: verifiedPayload
}), { ...env, DB: verifiedDb, STRIPE_WEBHOOK_SECRET: identityEventSecret });
assert.equal(await duplicateResponse.text(), "duplicate");
assert.equal(verifiedDb.calls.filter(call => call.type === "run").length, callsAfterFirstVerified);

// An older processing event cannot roll an already verified session/user back.
const stalePayload = JSON.stringify({
  id: "evt_staleProcessing123",
  type: "identity.verification_session.processing",
  created: verifiedEventCreated - 5,
  data: { object: {
    id: "vs-session-owned-by-a",
    type: "document",
    status: "processing",
    metadata: { user_id: "user-a" }
  } }
});
const staleSignature = await hmacSignature(
  stalePayload, identityEventSecret, String(Math.floor(Date.now() / 1000))
);
const staleResponse = await worker.fetch(new Request(API_ORIGIN + "/v1/webhooks/stripe", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Stripe-Signature": staleSignature },
  body: stalePayload
}), { ...env, DB: verifiedDb, STRIPE_WEBHOOK_SECRET: identityEventSecret });
assert.equal(await staleResponse.text(), "ignored");
assert.equal(verifiedDb.calls.filter(call => call.type === "run" &&
  call.sql.includes("UPDATE identity_sessions SET status = ?")).length, 1);
assert.equal(verifiedDb.calls.filter(call => call.type === "run" &&
  call.sql.includes("UPDATE users SET identity_status = ?")).length, 0);
assert.equal(verifiedUser.identity_status, "verified");

// A redaction notification is a data-lifecycle event, not a failed identity result.
const redactedPayload = JSON.stringify({
  id: "evt_redactedExample123",
  type: "identity.verification_session.redacted",
  created: Math.floor(Date.now() / 1000),
  data: { object: {
    id: "vs-session-owned-by-a",
    type: "document",
    status: "verified",
    metadata: { user_id: "user-a" }
  } }
});
const redactedSignature = await hmacSignature(
  redactedPayload, identityEventSecret, String(Math.floor(Date.now() / 1000))
);
const redactedResponse = await worker.fetch(new Request(API_ORIGIN + "/v1/webhooks/stripe", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Stripe-Signature": redactedSignature },
  body: redactedPayload
}), { ...env, DB: verifiedDb, STRIPE_WEBHOOK_SECRET: identityEventSecret });
assert.equal(await redactedResponse.text(), "ignored");
assert.equal(verifiedUser.identity_status, "verified");

console.log("Worker API and authorization regression tests: OK");
