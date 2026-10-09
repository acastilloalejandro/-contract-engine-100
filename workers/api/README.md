# Contract Engine Auth API (Cloudflare Workers + D1)

This directory contains a deployable backend foundation for the frontend adapter in app/auth.js. It is not running until the operator creates the Cloudflare resources, configures secrets and origins, deploys it, and validates the production setup.

## Included routes

| Method | Route | Purpose |
|---|---|---|
| GET | /health | Liveness only; no configuration or secret information |
| POST | /v1/auth/register | Password registration plus email verification link |
| GET | /v1/auth/email/verify?token=... | One-time email verification |
| POST | /v1/auth/login | PBKDF2 password check and server session |
| GET | /v1/auth/session | Resolve the server-side session |
| POST | /v1/auth/logout | Revoke session and clear cookie |
| GET | /v1/auth/oauth/google | Start Google OIDC with state, nonce and PKCE |
| GET | /v1/auth/oauth/apple | Start Sign in with Apple using state and nonce |
| GET | /v1/auth/oauth/{provider}/callback | Validate the authorization response and ID token |
| POST | /v1/onboarding/phone/start | Start Twilio Verify SMS challenge |
| POST | /v1/onboarding/phone/confirm | Check one-time phone code |
| POST | /v1/onboarding/identity/start | Create Stripe Identity document-verification session |
| GET | /v1/onboarding/status | Server-authoritative onboarding status |
| POST | /v1/webhooks/stripe | Verify Stripe signature and update identity state |

The Worker stores hashes of session cookies, email verification tokens and OAuth state values. Passwords use PBKDF2-HMAC-SHA-256 with a random salt. Database access uses prepared statements. Provider secrets live only in Worker secret storage.

## Important deployment boundary: use a shared custom domain

The current frontend is hosted at https://acastilloalejandro.github.io. A separate workers.dev API is cross-site. This implementation sends an HttpOnly Secure cookie with SameSite=None plus credentialed CORS, but browser third-party-cookie protections can still interfere with session continuity.

**For production, serve the frontend and API under one registrable domain**, for example https://app.example.com and https://api.example.com. Configure APP_ORIGIN and API_ORIGIN to the exact origins. Do not assume cookies will work reliably between GitHub Pages and an unrelated API domain.

## Create and configure the backend

Requirements: Node.js 24 or newer, a Cloudflare account with Workers and D1 enabled, a domain whose DNS can be managed, provider accounts, and a verified sender address for email. The documented CLI version is pinned to Wrangler 4.148.0 (checked 2026-10-09) for repeatable setup; review the official release notes before intentionally changing it.

1. Create D1:

        npx wrangler@4.148.0 d1 create contract-engine-auth

   Copy the returned UUID into wrangler.toml, replacing REPLACE_WITH_D1_DATABASE_UUID.

2. Create the database schema:

        npx wrangler@4.148.0 d1 execute contract-engine-auth --remote --file=workers/api/schema.sql

3. Set APP_ORIGIN and API_ORIGIN in wrangler.toml to the real HTTPS origins.

4. From workers/api, deploy after installing/authenticating Wrangler:

        npx wrangler@4.148.0 deploy

5. Add the D1 binding exactly as declared (DB) and configure the following secrets. Use npx wrangler@4.148.0 secret put NAME for each, never commit secret values.

Required for password registration:
- RESEND_API_KEY
- EMAIL_FROM (verified sender accepted by Resend)

Required for Google:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

Required for Sign in with Apple:
- APPLE_CLIENT_ID (Services ID for web sign-in)
- APPLE_TEAM_ID
- APPLE_KEY_ID
- APPLE_PRIVATE_KEY (the .p8 private key contents, newline-preserving)

Required for phone verification:
- TWILIO_API_KEY
- TWILIO_API_SECRET
- TWILIO_VERIFY_SERVICE_SID

Required for identity verification and webhook:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

Configure provider redirect URLs to these exact values:
- Google: https://api.example.com/v1/auth/oauth/google/callback
- Apple Services ID: https://api.example.com/v1/auth/oauth/apple/callback
- Stripe Identity webhook: https://api.example.com/v1/webhooks/stripe

Subscribe Stripe to the Identity Verification Session events used by the Worker, especially identity.verification_session.verified, identity.verification_session.requires_input, identity.verification_session.processing, identity.verification_session.canceled and identity.verification_session.redacted.

6. Configure the public frontend config.js only after deployment:

        window.CONTRACT_ENGINE_CONFIG = Object.freeze({
          authBaseUrl: "https://api.example.com",
          identityProviderHosts: ["verify.stripe.com"]
        });

   The file is public. Do not put secret values there.

7. Verify GET https://api.example.com/health, test registration with a test mailbox, confirm that the verification token is one-use, sign in, verify Twilio OTP, finish a Stripe test session and confirm that only the signed webhook changes identity status.

## Security assumptions and production gates

- OAuth ID tokens are verified server-side: signature, issuer, audience, expiry, nonce and verified email. Google uses server flow with state/nonce/PKCE; Apple uses a server-generated ES256 client-secret JWT.
- OAuth state is short-lived and one-use. Provider errors return a generic status to the frontend.
- The API only accepts the configured frontend origin and does not use wildcard CORS.
- Mutating browser routes require the configured Origin. Session cookies use the `__Host-ce_session` prefix, are HttpOnly, Secure, `Path=/`, omit `Domain`, and use `SameSite=Lax`. This requires the production frontend/API to share the same site. Existing sessions are not migrated; before first production deployment, use this cookie policy from the start and test login, OAuth callbacks, and logout in supported browsers.
- Email verification expires after 24 hours; phone challenges expire after 10 minutes with an attempt limit. Twilio handles code generation and delivery.
- Stripe webhook signatures and timestamps are validated before server-side identity state is changed.
- Identity verification accepts only the configured DNI/document flow. No DNI number or image is collected by the app form directly.
- Rate limits are stored in D1; they are a baseline, not a replacement for WAF/bot mitigation, Cloudflare Turnstile, monitoring or abuse review.
- This implementation currently does not include password reset, account deletion UI, organization/role management, passkeys, full audit export, or a formal privacy retention job. Add these before a general public launch.
- Run a privacy/legal review, penetration test, dependency review, accessibility/E2E suite and backup/restore test before production use.
- GitHub Pages remains a demo unless redeployed to the shared custom domain and the backend is connected. Local draft data in a browser is not server-side encrypted storage.
