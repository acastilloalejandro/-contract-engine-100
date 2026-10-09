const SESSION_COOKIE = "ce_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 210000;
const OAUTH_STATE_SECONDS = 600;
const EMAIL_TOKEN_SECONDS = 60 * 60 * 24;
const PHONE_CHALLENGE_SECONDS = 10 * 60;
const MAX_BODY_BYTES = 16 * 1024;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromB64url(value) {
  const base64 = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function jsonB64url(value) {
  return b64url(encoder.encode(JSON.stringify(value)));
}

function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(String(value)));
  return b64url(new Uint8Array(digest));
}

function equalBytes(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array)) return false;
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) mismatch |= (left[i % (left.length || 1)] || 0) ^ (right[i % (right.length || 1)] || 0);
  return mismatch === 0;
}

async function passwordDigest(password, salt, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({
    name: "PBKDF2", hash: "SHA-256", salt: fromB64url(salt), iterations
  }, key, 256));
}

function originAllowed(request, env) {
  return Boolean(env.APP_ORIGIN) && request.headers.get("Origin") === env.APP_ORIGIN;
}

function corsHeaders(request, env) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin"
  });
  const origin = request.headers.get("Origin");
  if (origin && origin === env.APP_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "600");
  }
  return headers;
}

function json(request, env, payload, status = 200, extra = {}) {
  const headers = corsHeaders(request, env);
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return new Response(JSON.stringify(payload), { status, headers });
}

function redirect(location, extra = {}) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  for (const [key, value] of Object.entries(extra)) headers.append(key, value);
  return new Response(null, { status: 302, headers });
}

function requireOrigin(request, env) {
  if (!originAllowed(request, env)) throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "Origen no permitido.");
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) throw new HttpError(413, "BODY_TOO_LARGE", "La solicitud supera el tamaño permitido.");
  const text = await request.text();
  if (encoder.encode(text).length > MAX_BODY_BYTES) throw new HttpError(413, "BODY_TOO_LARGE", "La solicitud supera el tamaño permitido.");
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new HttpError(400, "INVALID_JSON", "El cuerpo JSON no es válido.");
  }
}

function cookieValue(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

function sessionCookie(token, maxAge = SESSION_SECONDS) {
  // SameSite=None is necessary when app/API use different sites; a shared custom domain is preferred.
  return SESSION_COOKIE + "=" + token + "; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=" + maxAge;
}

function userView(row) {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.email_verified === 1,
    phoneVerified: row.phone_verified === 1,
    identityStatus: row.identity_status || "unverified",
    identityVerified: row.identity_status === "verified"
  };
}

async function createSession(env, userId) {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, now + SESSION_SECONDS, now).run();
  return sessionCookie(token);
}

async function currentUser(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    "SELECT u.id, u.email, u.email_verified, u.phone_verified, u.identity_status " +
    "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1"
  ).bind(tokenHash, now).first();
  if (!row) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ? OR expires_at <= ?").bind(tokenHash, now).run();
    return null;
  }
  return row;
}

async function requireUser(request, env) {
  requireOrigin(request, env);
  const user = await currentUser(request, env);
  if (!user) throw new HttpError(401, "AUTH_REQUIRED", "Inicia sesión para continuar.");
  if (user.email_verified !== 1) throw new HttpError(403, "EMAIL_VERIFICATION_REQUIRED", "Confirma tu correo antes de continuar.");
  return user;
}

async function rateLimit(env, key, maximum, windowSeconds) {
  const keyHash = await sha256(key);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const row = await env.DB.prepare(
    "INSERT INTO rate_limits (key_hash, window_start, count) VALUES (?, ?, 1) " +
    "ON CONFLICT(key_hash, window_start) DO UPDATE SET count = count + 1 RETURNING count"
  ).bind(keyHash, windowStart).first();
  return Number(row?.count || 0) <= maximum;
}

async function requireRateLimit(request, env, routeKey, maximum, windowSeconds = 900) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const allowed = await rateLimit(env, routeKey + ":" + ip, maximum, windowSeconds);
  if (!allowed) throw new HttpError(429, "RATE_LIMITED", "Demasiados intentos. Espera antes de volver a intentarlo.");
}

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new HttpError(503, "EMAIL_PROVIDER_NOT_CONFIGURED", "El servicio de correo no está configurado.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html })
  });
  if (!response.ok) throw new HttpError(503, "EMAIL_DELIVERY_FAILED", "No se pudo enviar el correo de verificación.");
}

async function register(request, env) {
  requireOrigin(request, env);
  if (!env.DB) throw new HttpError(503, "DATABASE_NOT_CONFIGURED", "La base de datos no está configurada.");
  const body = await readJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, "INVALID_EMAIL", "Introduce un correo válido.");
  }
  if (password.length < 12 || password.length > 128) {
    throw new HttpError(400, "WEAK_PASSWORD", "La contraseña debe tener entre 12 y 128 caracteres.");
  }
  await requireRateLimit(request, env, "register", 6);
  const emailHash = await sha256(email);
  if (!await rateLimit(env, "register-email:" + emailHash, 4, 3600)) {
    throw new HttpError(429, "RATE_LIMITED", "Demasiados intentos. Espera antes de volver a intentarlo.");
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").bind(email).first();
  if (existing) {
    // This endpoint does not distinguish existing accounts in a successful response.
    return json(request, env, { requiresEmailVerification: true, emailVerified: false }, 202);
  }
  const now = Math.floor(Date.now() / 1000);
  const userId = crypto.randomUUID();
  const salt = randomToken(16);
  const derived = b64url(await passwordDigest(password, salt));
  await env.DB.prepare(
    "INSERT INTO users (id, email, email_verified, password_hash, password_salt, password_iterations, auth_provider, auth_subject, phone_verified, identity_status, created_at) " +
    "VALUES (?, ?, 0, ?, ?, ?, 'password', NULL, 0, 'unverified', ?)"
  ).bind(userId, email, derived, salt, PASSWORD_ITERATIONS, now).run();

  const token = randomToken(32);
  const tokenHash = await sha256(token);
  await env.DB.prepare("INSERT INTO email_verifications (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, now + EMAIL_TOKEN_SECONDS, now).run();
  const verifyUrl = env.API_ORIGIN + "/v1/auth/email/verify?token=" + encodeURIComponent(token);
  try {
    await sendEmail(env, email, "Confirma tu correo de Contract Engine", 
      "<p>Confirma tu correo para continuar con Contract Engine.</p><p><a href=\"" + verifyUrl + "\">Verificar correo</a></p><p>El enlace caduca en 24 horas. Si no creaste esta cuenta, ignora el correo.</p>");
  } catch (error) {
    await env.DB.prepare("DELETE FROM email_verifications WHERE token_hash = ?").bind(tokenHash).run();
    await env.DB.prepare("DELETE FROM users WHERE id = ? AND email_verified = 0").bind(userId).run();
    throw error;
  }
  return json(request, env, { requiresEmailVerification: true, emailVerified: false }, 202);
}

async function verifyEmail(url, env) {
  const token = url.searchParams.get("token") || "";
  if (!/^[A-Za-z0-9_-]{32,100}$/.test(token)) return redirect(env.APP_ORIGIN + "/?auth_error=email_verification_failed");
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const record = await env.DB.prepare(
    "SELECT user_id FROM email_verifications WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL LIMIT 1"
  ).bind(tokenHash, now).first();
  if (!record) return redirect(env.APP_ORIGIN + "/?auth_error=email_verification_failed");
  const updated = await env.DB.prepare(
    "UPDATE email_verifications SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?"
  ).bind(now, tokenHash, now).run();
  if (Number(updated?.meta?.changes || 0) !== 1) return redirect(env.APP_ORIGIN + "/?auth_error=email_verification_failed");
  await env.DB.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").bind(record.user_id).run();
  return redirect(env.APP_ORIGIN + "/?email_verified=1");
}

async function login(request, env) {
  requireOrigin(request, env);
  const body = await readJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  await requireRateLimit(request, env, "login", 12);
  const emailHash = await sha256(email);
  if (!await rateLimit(env, "login-email:" + emailHash, 8, 900)) {
    throw new HttpError(429, "RATE_LIMITED", "Demasiados intentos. Espera antes de volver a intentarlo.");
  }
  const user = await env.DB.prepare(
    "SELECT id, email, email_verified, password_hash, password_salt, password_iterations, phone_verified, identity_status " +
    "FROM users WHERE email = ? AND auth_provider = 'password' LIMIT 1"
  ).bind(email).first();
  // Perform the same expensive derivation for unknown accounts to reduce email-enumeration timing differences.
  const salt = user?.password_salt || "c2VjdXJlLWR1bW15LXNhbHQ";
  const digest = await passwordDigest(password, salt, Number(user?.password_iterations) || PASSWORD_ITERATIONS);
  const matchesPassword = Boolean(user?.password_hash && equalBytes(digest, fromB64url(user.password_hash)));
  if (!user || !matchesPassword) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "No se pudo iniciar sesión. Revisa las credenciales.");
  }
  if (user.email_verified !== 1) throw new HttpError(403, "EMAIL_VERIFICATION_REQUIRED", "Confirma el correo desde el enlace enviado antes de iniciar sesión.");
  const cookie = await createSession(env, user.id);
  return json(request, env, { ok: true, user: userView(user) }, 200, { "Set-Cookie": cookie });
}

async function getSession(request, env) {
  requireOrigin(request, env);
  const user = await currentUser(request, env);
  if (!user || user.email_verified !== 1) return json(request, env, { authenticated: false }, 401);
  return json(request, env, { authenticated: true, user: userView(user) });
}

async function logout(request, env) {
  requireOrigin(request, env);
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json(request, env, { ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}

function getOAuthConfig(provider, env) {
  if (provider === "google") {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) throw new HttpError(503, "OAUTH_NOT_CONFIGURED", "Google OAuth no está configurado.");
    return {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    };
  }
  if (provider === "apple") {
    if (!env.APPLE_CLIENT_ID || !env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY) {
      throw new HttpError(503, "OAUTH_NOT_CONFIGURED", "Apple Sign in with Apple no está configurado.");
    }
    return {
      authorizeUrl: "https://appleid.apple.com/auth/authorize",
      tokenUrl: "https://appleid.apple.com/auth/token",
      jwksUrl: "https://appleid.apple.com/auth/keys",
      issuer: ["https://appleid.apple.com"],
      clientId: env.APPLE_CLIENT_ID
    };
  }
  throw new HttpError(404, "PROVIDER_NOT_SUPPORTED", "Proveedor no admitido.");
}

async function appleClientSecret(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = jsonB64url({ alg: "ES256", kid: env.APPLE_KEY_ID });
  const claims = jsonB64url({
    iss: env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 300,
    aud: "https://appleid.apple.com",
    sub: env.APPLE_CLIENT_ID
  });
  const unsigned = header + "." + claims;
  const pem = env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const key = await crypto.subtle.importKey("pkcs8", fromB64url(pem.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")), {
    name: "ECDSA", namedCurve: "P-256"
  }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(unsigned));
  return unsigned + "." + b64url(new Uint8Array(signature));
}

async function startOAuth(request, env, provider) {
  requireOrigin(request, env);
  await requireRateLimit(request, env, "oauth:" + provider, 20);
  const config = getOAuthConfig(provider, env);
  const state = randomToken(32);
  const nonce = randomToken(32);
  const verifier = provider === "google" ? randomToken(32) : null;
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    "INSERT INTO oauth_states (state_hash, provider, nonce, code_verifier, expires_at, created_at, used_at) VALUES (?, ?, ?, ?, ?, ?, NULL)"
  ).bind(await sha256(state), provider, nonce, verifier, now + OAUTH_STATE_SECONDS, now).run();

  const callbackUrl = env.API_ORIGIN + "/v1/auth/oauth/" + provider + "/callback";
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: provider === "apple" ? "name email" : "openid email profile",
    state,
    nonce
  });
  if (provider === "apple") params.set("response_mode", "query");
  if (provider === "google") {
    const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
    params.set("code_challenge", challenge);
    params.set("code_challenge_method", "S256");
    params.set("access_type", "online");
  }
  return json(request, env, { authorizationUrl: config.authorizeUrl + "?" + params.toString() });
}

async function verifyIdToken(idToken, provider, oauth, expectedNonce, env) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new HttpError(401, "INVALID_ID_TOKEN", "No se pudo validar la identidad del proveedor.");
  const header = JSON.parse(decoder.decode(fromB64url(parts[0])));
  const claims = JSON.parse(decoder.decode(fromB64url(parts[1])));
  if (header.alg !== "RS256" || !header.kid) throw new HttpError(401, "INVALID_ID_TOKEN", "El token de identidad no utiliza un algoritmo permitido.");
  const jwksResponse = await fetch(oauth.jwksUrl, { headers: { "Accept": "application/json" } });
  if (!jwksResponse.ok) throw new HttpError(503, "IDENTITY_KEYS_UNAVAILABLE", "No se pudieron obtener las claves del proveedor.");
  const jwks = await jwksResponse.json();
  const jwk = (jwks.keys || []).find(key => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) throw new HttpError(401, "INVALID_ID_TOKEN", "La clave del token no pertenece al proveedor configurado.");
  const publicKey = await crypto.subtle.importKey("jwk", jwk, {
    name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"
  }, false, ["verify"]);
  const signedContent = encoder.encode(parts[0] + "." + parts[1]);
  const validSignature = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, fromB64url(parts[2]), signedContent);
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  if (!validSignature || !oauth.issuer.includes(claims.iss) || !aud.includes(oauth.clientId) || (aud.length > 1 && claims.azp !== oauth.clientId) ||
      Number(claims.exp) <= now || Number(claims.iat) > now + 60 ||
      claims.nonce !== expectedNonce || typeof claims.sub !== "string" || !claims.sub ||
      !emailVerified || typeof claims.email !== "string") {
    throw new HttpError(401, "INVALID_ID_TOKEN", "No se pudo validar la identidad del proveedor.");
  }
  return { subject: claims.sub, email: claims.email.trim().toLowerCase() };
}

async function finishOAuth(request, env, provider) {
  const url = new URL(request.url);
  let params;
  if (request.method === "POST") {
    params = new URLSearchParams(await request.text());
  } else {
    params = url.searchParams;
  }
  const providerError = params.get("error");
  if (providerError) return redirect(env.APP_ORIGIN + "/?auth_error=oauth_cancelled");
  const state = params.get("state") || "";
  const code = params.get("code") || "";
  if (!state || !code) return redirect(env.APP_ORIGIN + "/?auth_error=oauth_callback_failed");
  const now = Math.floor(Date.now() / 1000);
  const stateHash = await sha256(state);
  const oauthState = await env.DB.prepare(
    "SELECT provider, nonce, code_verifier FROM oauth_states WHERE state_hash = ? AND provider = ? AND expires_at > ? AND used_at IS NULL LIMIT 1"
  ).bind(stateHash, provider, now).first();
  if (!oauthState) return redirect(env.APP_ORIGIN + "/?auth_error=oauth_callback_failed");
  const claimed = await env.DB.prepare(
    "UPDATE oauth_states SET used_at = ? WHERE state_hash = ? AND provider = ? AND used_at IS NULL AND expires_at > ?"
  ).bind(now, stateHash, provider, now).run();
  if (Number(claimed?.meta?.changes || 0) !== 1) return redirect(env.APP_ORIGIN + "/?auth_error=oauth_callback_failed");

  try {
    const config = getOAuthConfig(provider, env);
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.API_ORIGIN + "/v1/auth/oauth/" + provider + "/callback",
      client_id: config.clientId,
      client_secret: provider === "apple" ? await appleClientSecret(env) : config.clientSecret
    });
    if (provider === "google" && oauthState.code_verifier) body.set("code_verifier", oauthState.code_verifier);
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: body.toString()
    });
    if (!tokenResponse.ok) throw new Error("OAuth token exchange failed");
    const tokens = await tokenResponse.json();
    const identity = await verifyIdToken(tokens.id_token, provider, config, oauthState.nonce, env);
    let user = await env.DB.prepare(
      "SELECT id, email, email_verified, phone_verified, identity_status FROM users WHERE auth_provider = ? AND auth_subject = ? LIMIT 1"
    ).bind(provider, identity.subject).first();
    if (!user) {
      const conflicting = await env.DB.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").bind(identity.email).first();
      if (conflicting) return redirect(env.APP_ORIGIN + "/?auth_error=account_linking_required");
      const id = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO users (id, email, email_verified, password_hash, password_salt, password_iterations, auth_provider, auth_subject, phone_verified, identity_status, created_at) " +
        "VALUES (?, ?, 1, NULL, NULL, NULL, ?, ?, 0, 'unverified', ?)"
      ).bind(id, identity.email, provider, identity.subject, now).run();
      user = { id, email: identity.email, email_verified: 1, phone_verified: 0, identity_status: "unverified" };
    }
    const cookie = await createSession(env, user.id);
    return redirect(env.APP_ORIGIN + "/", { "Set-Cookie": cookie });
  } catch {
    return redirect(env.APP_ORIGIN + "/?auth_error=oauth_callback_failed");
  }
}

async function twilioRequest(env, endpoint, body) {
  if (!env.TWILIO_API_KEY || !env.TWILIO_API_SECRET || !env.TWILIO_VERIFY_SERVICE_SID) {
    throw new HttpError(503, "PHONE_PROVIDER_NOT_CONFIGURED", "El proveedor de teléfono no está configurado.");
  }
  const auth = btoa(env.TWILIO_API_KEY + ":" + env.TWILIO_API_SECRET);
  const response = await fetch(
    "https://verify.twilio.com/v2/Services/" + env.TWILIO_VERIFY_SERVICE_SID + "/" + endpoint,
    {
      method: "POST",
      headers: { "Authorization": "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: new URLSearchParams(body).toString()
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, "PHONE_PROVIDER_ERROR", "El proveedor de verificación telefónica no pudo procesar la solicitud.");
  return payload;
}

async function startPhone(request, env) {
  const user = await requireUser(request, env);
  if (user.phone_verified === 1) return json(request, env, { phoneVerified: true });
  const body = await readJson(request);
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) throw new HttpError(400, "INVALID_PHONE", "Introduce el teléfono en formato internacional E.164.");
  const phoneHash = await sha256(phone);
  if (!await rateLimit(env, "phone-user:" + user.id, 3, 3600) ||
      !await rateLimit(env, "phone-number:" + phoneHash, 3, 3600)) {
    throw new HttpError(429, "PHONE_RATE_LIMITED", "Se ha alcanzado el límite de solicitudes para este teléfono. Inténtalo más tarde.");
  }
  await twilioRequest(env, "Verifications", { To: phone, Channel: "sms" });
  const id = randomToken(24);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    "INSERT INTO phone_challenges (id, user_id, phone, expires_at, attempts, used_at, created_at) VALUES (?, ?, ?, ?, 0, NULL, ?)"
  ).bind(id, user.id, phone, now + PHONE_CHALLENGE_SECONDS, now).run();
  return json(request, env, { challengeId: id, expiresIn: PHONE_CHALLENGE_SECONDS });
}

async function confirmPhone(request, env) {
  const user = await requireUser(request, env);
  const body = await readJson(request);
  const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(challengeId) || !/^\d{4,8}$/.test(code)) {
    throw new HttpError(400, "INVALID_PHONE_CHALLENGE", "El código o la solicitud no son válidos.");
  }
  const now = Math.floor(Date.now() / 1000);
  const challenge = await env.DB.prepare(
    "SELECT id, phone, attempts, expires_at, used_at FROM phone_challenges WHERE id = ? AND user_id = ? LIMIT 1"
  ).bind(challengeId, user.id).first();
  if (!challenge || challenge.used_at !== null || Number(challenge.expires_at) <= now || Number(challenge.attempts) >= 5) {
    throw new HttpError(400, "PHONE_CHALLENGE_EXPIRED", "La solicitud de verificación ha caducado. Inicia una nueva.");
  }
  await env.DB.prepare("UPDATE phone_challenges SET attempts = attempts + 1 WHERE id = ? AND user_id = ? AND used_at IS NULL")
    .bind(challengeId, user.id).run();
  const result = await twilioRequest(env, "VerificationCheck", { To: challenge.phone, Code: code });
  if (result.status !== "approved") throw new HttpError(400, "PHONE_CODE_INVALID", "El código no es válido o ha caducado.");
  await env.DB.prepare("UPDATE phone_challenges SET used_at = ?, phone = '' WHERE id = ? AND user_id = ? AND used_at IS NULL")
    .bind(now, challengeId, user.id).run();
  // Retain only the verification status, not the phone number itself.
  await env.DB.prepare("UPDATE users SET phone_verified = 1 WHERE id = ?")
    .bind(user.id).run();
  return json(request, env, { phoneVerified: true });
}

async function startIdentity(request, env) {
  const user = await requireUser(request, env);
  if (user.phone_verified !== 1) throw new HttpError(403, "PHONE_VERIFICATION_REQUIRED", "Verifica el teléfono antes de continuar.");
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "IDENTITY_PROVIDER_NOT_CONFIGURED", "El proveedor de identidad no está configurado.");
  await requireRateLimit(request, env, "identity:" + user.id, 4, 3600);
  const body = await readJson(request);
  if ((body.documentType || "DNI") !== "DNI" || (body.country || "ES") !== "ES") {
    throw new HttpError(400, "DOCUMENT_TYPE_NOT_SUPPORTED", "Este flujo está configurado para DNI español.");
  }
  const form = new URLSearchParams({
    type: "document",
    client_reference_id: user.id,
    "metadata[user_id]": user.id,
    "metadata[country]": "ES",
    "options[document][allowed_types][0]": "id_card",
    return_url: env.APP_ORIGIN + "/?identity=return"
  });
  const response = await fetch("https://api.stripe.com/v1/identity/verification_sessions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: form.toString()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.id || !payload.url) throw new HttpError(502, "IDENTITY_PROVIDER_ERROR", "No se pudo iniciar la verificación de identidad.");
  const now = Math.floor(Date.now() / 1000);
  const localId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO identity_sessions (id, user_id, provider_session_id, status, created_at, updated_at) VALUES (?, ?, ?, 'requires_input', ?, ?)"
  ).bind(localId, user.id, payload.id, now, now).run();
  return json(request, env, { redirectUrl: payload.url, verificationSessionId: localId });
}

function hexBytes(hex) {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return new Uint8Array();
  return Uint8Array.from(hex.match(/.{2}/g), byte => parseInt(byte, 16));
}

async function verifyStripeSignature(body, signature, secret) {
  if (!signature || !secret) return false;
  const parts = signature.split(",").map(item => item.split("=", 2));
  const timestamp = parts.find(item => item[0] === "t")?.[1];
  const signatures = parts.filter(item => item[0] === "v1").map(item => item[1]);
  if (!timestamp || !signatures.length || Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "." + body)));
  return signatures.some(signatureHex => equalBytes(expected, hexBytes(signatureHex)));
}

async function stripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new HttpError(503, "WEBHOOK_NOT_CONFIGURED", "El webhook no está configurado.");
  const raw = await request.text();
  if (encoder.encode(raw).length > 1024 * 1024) throw new HttpError(413, "BODY_TOO_LARGE", "El evento supera el tamaño permitido.");
  const valid = await verifyStripeSignature(raw, request.headers.get("Stripe-Signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) throw new HttpError(400, "INVALID_WEBHOOK_SIGNATURE", "La firma del webhook no es válida.");
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "INVALID_WEBHOOK", "El evento no es JSON válido.");
  }
  const allowed = new Set([
    "identity.verification_session.verified",
    "identity.verification_session.requires_input",
    "identity.verification_session.processing",
    "identity.verification_session.canceled",
    "identity.verification_session.redacted"
  ]);
  if (!allowed.has(event.type)) return new Response("ignored", { status: 200 });
  const session = event.data?.object;
  if (!session?.id || session.type !== "document" || !session.metadata?.user_id) return new Response("ignored", { status: 200 });
  const statusMap = {
    "identity.verification_session.verified": session.status === "verified" ? "verified" : "pending",
    "identity.verification_session.requires_input": "requires_input",
    "identity.verification_session.processing": "processing",
    "identity.verification_session.canceled": "failed",
    "identity.verification_session.redacted": "failed"
  };
  const nextStatus = statusMap[event.type];
  const now = Math.floor(Date.now() / 1000);
  const record = await env.DB.prepare(
    "SELECT id, user_id FROM identity_sessions WHERE provider_session_id = ? AND user_id = ? LIMIT 1"
  ).bind(session.id, session.metadata.user_id).first();
  if (!record) return new Response("ignored", { status: 200 });
  await env.DB.prepare("UPDATE identity_sessions SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .bind(nextStatus, now, record.id, record.user_id).run();
  await env.DB.prepare("UPDATE users SET identity_status = ? WHERE id = ?")
    .bind(nextStatus, record.user_id).run();
  return new Response("ok", { status: 200 });
}

async function onboardingStatus(request, env) {
  const user = await requireUser(request, env);
  return json(request, env, {
    emailVerified: user.email_verified === 1,
    phoneVerified: user.phone_verified === 1,
    identityStatus: user.identity_status || "unverified",
    identityVerified: user.identity_status === "verified"
  });
}

function validateConfig(env) {
  if (!env.APP_ORIGIN || !env.API_ORIGIN) throw new HttpError(503, "APP_CONFIG_NOT_SET", "Faltan APP_ORIGIN o API_ORIGIN.");
  try {
    const app = new URL(env.APP_ORIGIN);
    const api = new URL(env.API_ORIGIN);
    if (app.protocol !== "https:" || api.protocol !== "https:" || app.origin !== env.APP_ORIGIN || api.origin !== env.API_ORIGIN) {
      throw new Error("origin");
    }
  } catch {
    throw new HttpError(503, "APP_CONFIG_INVALID", "APP_ORIGIN y API_ORIGIN deben ser orígenes HTTPS válidos, sin rutas.");
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/health" && request.method === "GET") {
        return new Response("ok", { status: 200, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
      }
      if (request.method === "OPTIONS") {
        if (!originAllowed(request, env)) return new Response(null, { status: 403 });
        return new Response(null, { status: 204, headers: corsHeaders(request, env) });
      }
      validateConfig(env);
      if (!env.DB && path !== "/v1/webhooks/stripe") throw new HttpError(503, "DATABASE_NOT_CONFIGURED", "La base de datos no está configurada.");

      if (path === "/v1/auth/register" && request.method === "POST") return await register(request, env);
      if (path === "/v1/auth/login" && request.method === "POST") return await login(request, env);
      if (path === "/v1/auth/session" && request.method === "GET") return await getSession(request, env);
      if (path === "/v1/auth/logout" && request.method === "POST") return await logout(request, env);
      if (path === "/v1/auth/email/verify" && request.method === "GET") return await verifyEmail(url, env);

      const oauthStart = path.match(/^\/v1\/auth\/oauth\/(google|apple)$/);
      if (oauthStart && request.method === "GET") return await startOAuth(request, env, oauthStart[1]);
      const oauthCallback = path.match(/^\/v1\/auth\/oauth\/(google|apple)\/callback$/);
      if (oauthCallback && ["GET", "POST"].includes(request.method)) return await finishOAuth(request, env, oauthCallback[1]);

      if (path === "/v1/onboarding/phone/start" && request.method === "POST") return await startPhone(request, env);
      if (path === "/v1/onboarding/phone/confirm" && request.method === "POST") return await confirmPhone(request, env);
      if (path === "/v1/onboarding/identity/start" && request.method === "POST") return await startIdentity(request, env);
      if (path === "/v1/onboarding/status" && request.method === "GET") return await onboardingStatus(request, env);
      if (path === "/v1/webhooks/stripe" && request.method === "POST") return await stripeWebhook(request, env);
      return json(request, env, { code: "NOT_FOUND", message: "Ruta no encontrada." }, 404);
    } catch (error) {
      if (path.endsWith("/callback")) return redirect(env.APP_ORIGIN + "/?auth_error=oauth_callback_failed");
      const status = Number(error?.status) || 500;
      if (status >= 500) {
        return json(request, env, {
          code: error?.code || "INTERNAL_ERROR",
          message: status === 500 ? "Error interno. Inténtalo de nuevo más tarde." : error.message
        }, status);
      }
      return json(request, env, { code: error.code || "REQUEST_FAILED", message: error.message || "La solicitud no se pudo completar." }, status,
        status === 429 ? { "Retry-After": "900" } : {});
    }
  }
};

export { verifyStripeSignature };
