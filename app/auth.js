/**
 * Backend-backed authentication adapter. No fake authentication is implemented.
 * Set window.CONTRACT_ENGINE_CONFIG.authBaseUrl to a same-origin or approved API.
 */
const config = () => window.CONTRACT_ENGINE_CONFIG || {};
const baseUrl = () => String(config().authBaseUrl || "").replace(/\/$/, "");
const configured = () => Boolean(baseUrl());

function apiBase() {
  if (!configured()) throw new AuthConfigurationError();
  const url = new URL(baseUrl());
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("La API de autenticación debe utilizar HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Configura la URL base de la API sin credenciales, consulta ni fragmento.");
  }
  return url;
}

export class AuthConfigurationError extends Error {
  constructor(message = "La autenticación aún no está configurada en el servidor.") {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  const api = apiBase();
  const basePath = api.pathname.endsWith("/") ? api.pathname.slice(0, -1) : api.pathname;
  const response = await fetch(api.origin + basePath + path, {
    method, credentials: "include",
    headers: { "Accept": "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "No se pudo completar la operación.");
    error.status = response.status;
    error.code = payload.code || "AUTH_REQUEST_FAILED";
    throw error;
  }
  return payload;
}

export const auth = Object.freeze({
  isConfigured: configured,
  session: () => request("/v1/auth/session"),
  register: ({ email, password }) => request("/v1/auth/register", { method: "POST", body: { email, password } }),
  login: ({ email, password }) => request("/v1/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request("/v1/auth/logout", { method: "POST" }),
  startOAuth: async provider => {
    if (!["google", "apple"].includes(provider)) throw new TypeError("Proveedor OAuth no admitido.");
    const result = await request("/v1/auth/oauth/" + provider);
    if (typeof result.authorizationUrl !== "string") throw new Error("El servidor no devolvió una URL de autorización válida.");
    const target = new URL(result.authorizationUrl);
    const expectedHost = provider === "google" ? "accounts.google.com" : "appleid.apple.com";
    if (target.protocol !== "https:" || target.hostname !== expectedHost || target.username || target.password) {
      throw new Error("El servidor devolvió un destino de autenticación no permitido.");
    }
    location.assign(target.href);
  },
  startPhoneVerification: phone => request("/v1/onboarding/phone/start", { method: "POST", body: { phone } }),
  confirmPhoneVerification: ({ challengeId, code }) => request("/v1/onboarding/phone/confirm", { method: "POST", body: { challengeId, code } }),
  startIdentityVerification: ({ documentType = "DNI", country = "ES" } = {}) =>
    request("/v1/onboarding/identity/start", { method: "POST", body: { documentType, country } }),
  onboardingStatus: () => request("/v1/onboarding/status")
});
