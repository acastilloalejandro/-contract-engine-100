import { auth, AuthConfigurationError } from "./auth.js";

const $ = id => document.getElementById(id);
let mode = "login";
let pendingPhoneChallenge = null;
let sessionUser = null;
let entryCallbacks = {};

function message(text, kind = "info") {
  const node = $("accessAlert");
  if (!node) return;
  node.textContent = text;
  node.dataset.kind = kind;
  node.hidden = !text;
}

function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = label || "Procesando…";
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
    delete button.dataset.originalLabel;
  }
}

function showPanel(id) {
  for (const name of ["authPanel", "phonePanel", "identityPanel"]) $(name).hidden = name !== id;
  message("");
}

function setMode(next) {
  mode = next === "register" ? "register" : "login";
  $("authModeLogin").classList.toggle("active", mode === "login");
  $("authModeRegister").classList.toggle("active", mode === "register");
  $("authModeLogin").setAttribute("aria-pressed", String(mode === "login"));
  $("authModeRegister").setAttribute("aria-pressed", String(mode === "register"));
  $("authTitle").textContent = mode === "login" ? "Inicia sesión" : "Crea tu cuenta";
  $("authSubmit").textContent = mode === "login" ? "Continuar" : "Crear cuenta";
  $("authPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("authPassword").minLength = mode === "register" ? 12 : 1;
  $("authPasswordHelp").textContent = mode === "register"
    ? "Utiliza una contraseña única de al menos 12 caracteres."
    : "Usa la contraseña asociada a tu cuenta.";
}

function authenticatedSession(payload) {
  const user = payload?.user || payload?.account || payload;
  const subject = user?.id || user?.sub || user?.userId || user?.email;
  if (payload?.authenticated === false || !subject) return null;
  if (payload?.authenticated === true || user?.id || user?.sub || user?.userId) return user;
  return null;
}

function phoneIsVerified(status) {
  return status?.phoneVerified === true || status?.phone?.verified === true ||
    status?.phoneStatus === "verified";
}

function identityIsVerified(status) {
  return status?.identityVerified === true || status?.identity?.verified === true ||
    status?.identityStatus === "verified" || status?.identity?.status === "verified";
}

async function advanceOnboarding(user) {
  sessionUser = user;
  let status;
  try {
    status = await auth.onboardingStatus();
  } catch (error) {
    showPanel("authPanel");
    message(error.message || "No se pudo consultar el estado de incorporación.", "error");
    return;
  }
  if (!phoneIsVerified(status)) {
    pendingPhoneChallenge = null;
    showPanel("phonePanel");
    return;
  }
  if (!identityIsVerified(status)) {
    showPanel("identityPanel");
    return;
  }
  await enterApplication("authenticated", user, entryCallbacks.onEnterDemo, entryCallbacks.onEnterAuthenticated);
}

async function resumeSession() {
  if (!auth.isConfigured()) return;
  try {
    const payload = await auth.session();
    const user = authenticatedSession(payload);
    if (user) await advanceOnboarding(user);
  } catch (error) {
    // A 401 is the normal signed-out state. Other failures are surfaced below.
    if (error?.status !== 401) message("No se ha podido comprobar la sesión. Revisa la conexión con el servidor.", "error");
  }
}

async function enterApplication(nextMode, user = null, onEnterDemo, onEnterAuthenticated) {
  sessionUser = user;
  $("accessGate").hidden = true;
  $("app").hidden = false;
  $("sessionBadge").textContent = nextMode === "demo" ? "DEMO · LOCAL" : "CUENTA · LOCAL";
  $("logoutBtn").hidden = nextMode !== "authenticated";
  $("logoutBtn").setAttribute("aria-label", "Cerrar sesión");
  if (nextMode === "demo") await onEnterDemo?.();
  else await onEnterAuthenticated?.(user);
}

export function initializeAccessGate({ onEnterDemo, onEnterAuthenticated }) {
  entryCallbacks = { onEnterDemo, onEnterAuthenticated };
  const gate = $("accessGate");
  const app = $("app");
  if (!gate || !app) {
    // Fail closed if markup and scripts have drifted out of sync.
    app?.setAttribute("hidden", "");
    return;
  }
  app.hidden = true;
  gate.hidden = false;

  const configured = auth.isConfigured();
  $("providerAuth").hidden = false;
  $("authPanel").hidden = false;
  $("authEmail").disabled = !configured;
  $("authPassword").disabled = !configured;
  $("authSubmit").disabled = !configured;
  $("googleBtn").disabled = !configured;
  $("appleBtn").disabled = !configured;
  $("demoPanel").hidden = false;
  $("accessState").textContent = configured
    ? "Autenticación conectada: la sesión y la identidad se comprobarán en el servidor."
    : "Autenticación real sin configurar. La demo no crea una cuenta ni verifica identidad.";
  const query = new URLSearchParams(location.search);
  if (query.get("email_verified") === "1") {
    message("Correo verificado. Ya puedes iniciar sesión.", "success");
  } else if (["email_verification_failed", "oauth_callback_failed", "oauth_cancelled", "account_linking_required"].includes(query.get("auth_error"))) {
    const errorMessages = {
      email_verification_failed: "El enlace de verificación no es válido o ha caducado. Solicita uno nuevo.",
      oauth_callback_failed: "No se ha podido completar el acceso con el proveedor. Vuelve a intentarlo.",
      oauth_cancelled: "Se ha cancelado el acceso con el proveedor.",
      account_linking_required: "Ya existe una cuenta con ese correo. Inicia sesión con el método original antes de vincular otro proveedor."
    };
    message(errorMessages[query.get("auth_error")], "error");
  }
  if (query.has("email_verified") || query.has("auth_error")) {
    history.replaceState(null, "", location.pathname);
  }
  if (!configured) {
    $("demoTitle").textContent = "Explorar sin cuenta";
    $("demoDescription").textContent = "Puedes probar el formulario con datos ficticios. No introduzcas DNI, teléfonos, documentos ni información contractual real en este modo.";
  }
  setMode("login");

  $("authModeLogin").addEventListener("click", () => setMode("login"));
  $("authModeRegister").addEventListener("click", () => setMode("register"));

  $("authForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!auth.isConfigured()) {
      message("Configura el backend antes de usar el registro real.", "error");
      return;
    }
    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;
    if (!email || !password || (mode === "register" && password.length < 12)) {
      message(mode === "register" ? "Introduce un correo válido y una contraseña de al menos 12 caracteres." : "Introduce correo y contraseña.", "error");
      return;
    }
    setBusy($("authSubmit"), true, mode === "login" ? "Comprobando…" : "Creando cuenta…");
    try {
      if (mode === "register") {
        const result = await auth.register({ email, password });
        if (result?.requiresEmailVerification === true || result?.emailVerified === false) {
          message("Si el registro procede, recibirás un correo de verificación. Confirma el correo antes de iniciar sesión.", "success");
          setMode("login");
          return;
        }
      } else {
        await auth.login({ email, password });
      }
      const current = authenticatedSession(await auth.session());
      if (!current) {
        message("El servidor no ha confirmado una sesión válida. Confirma tu correo o revisa la configuración.", "error");
        return;
      }
      await advanceOnboarding(current);
    } catch (error) {
      const text = error instanceof AuthConfigurationError
        ? error.message
        : error?.status === 401
          ? "No se pudo iniciar sesión. Revisa las credenciales."
          : error.message || "No se pudo completar el acceso.";
      message(text, "error");
    } finally {
      setBusy($("authSubmit"), false);
    }
  });

  $("googleBtn").addEventListener("click", () => startProvider("google"));
  $("appleBtn").addEventListener("click", () => startProvider("apple"));
  $("demoBtn").addEventListener("click", () => enterApplication("demo", null, onEnterDemo, onEnterAuthenticated));

  async function startProvider(provider) {
    setBusy(provider === "google" ? $("googleBtn") : $("appleBtn"), true, "Abriendo proveedor…");
    try {
      await auth.startOAuth(provider);
    } catch (error) {
      message(error.message || "No se pudo iniciar el acceso con el proveedor.", "error");
      setBusy(provider === "google" ? $("googleBtn") : $("appleBtn"), false);
    }
  }

  $("phoneStartForm").addEventListener("submit", async event => {
    event.preventDefault();
    const phone = $("phoneNumber").value.trim();
    if (!phone || phone.length < 7) {
      message("Introduce un teléfono válido con prefijo internacional.", "error");
      return;
    }
    setBusy($("phoneStartBtn"), true, "Enviando código…");
    try {
      const result = await auth.startPhoneVerification(phone);
      if (!result?.challengeId) throw new Error("El servidor no devolvió un identificador de verificación.");
      pendingPhoneChallenge = result.challengeId;
      $("phoneConfirmField").hidden = false;
      $("phoneCode").required = true;
      $("phoneCode").focus();
      message("Si el teléfono es válido, recibirás un código. El código caduca y solo puede utilizarse una vez.", "success");
    } catch (error) {
      message(error.message || "No se pudo iniciar la verificación telefónica.", "error");
    } finally {
      setBusy($("phoneStartBtn"), false);
    }
  });

  $("phoneConfirmForm").addEventListener("submit", async event => {
    event.preventDefault();
    const code = $("phoneCode").value.trim();
    if (!pendingPhoneChallenge || !/^\d{4,8}$/.test(code)) {
      message("Introduce el código recibido.", "error");
      return;
    }
    setBusy($("phoneConfirmBtn"), true, "Verificando…");
    try {
      await auth.confirmPhoneVerification({ challengeId: pendingPhoneChallenge, code });
      pendingPhoneChallenge = null;
      await advanceOnboarding(sessionUser);
    } catch (error) {
      message(error.message || "No se pudo verificar el teléfono.", "error");
    } finally {
      setBusy($("phoneConfirmBtn"), false);
    }
  });

  $("identityStartBtn").addEventListener("click", async () => {
    setBusy($("identityStartBtn"), true, "Conectando…");
    try {
      const result = await auth.startIdentityVerification({ documentType: "DNI", country: "ES" });
      const url = result?.redirectUrl || result?.verificationUrl || result?.url;
      if (!url) {
        message("El servidor ha iniciado el flujo pero no ha devuelto una URL. Revisa el estado del proveedor.", "error");
        return;
      }
      const target = new URL(url);
      const allowedHosts = Array.isArray(window.CONTRACT_ENGINE_CONFIG?.identityProviderHosts)
        ? window.CONTRACT_ENGINE_CONFIG.identityProviderHosts.map(host => String(host).toLowerCase())
        : [];
      if (target.protocol !== "https:" || target.port || target.username || target.password || !allowedHosts.includes(target.hostname.toLowerCase())) {
        throw new Error("El dominio del proveedor de identidad no está incluido en la lista permitida de config.js.");
      }
      location.assign(target.href);
    } catch (error) {
      message(error.message || "No se pudo iniciar la verificación de identidad.", "error");
    } finally {
      setBusy($("identityStartBtn"), false);
    }
  });

  $("demoReturnBtn").addEventListener("click", () => {
    pendingPhoneChallenge = null;
    showPanel("authPanel");
    setMode("login");
  });

  $("logoutBtn").addEventListener("click", async () => {
    const btn = $("logoutBtn");
    setBusy(btn, true, "Cerrando…");
    try {
      await auth.logout();
      // Reload to clear in-memory form fields and event handlers before another account signs in.
      location.reload();
      return;
    } catch (error) {
      message(error.message || "No se pudo cerrar la sesión en el servidor.", "error");
    } finally {
      setBusy(btn, false);
    }
  });

  // Preserve an explicit return target for trusted same-origin post-provider redirects.
  if (configured) void resumeSession();
}
