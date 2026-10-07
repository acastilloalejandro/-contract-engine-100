# Trust API deployment

The browser application remains static, while the trust endpoints run as serverless Node.js functions. GitHub Pages can serve the frontend but cannot execute these API functions, so production trust flows require a serverless host such as Vercel.

## Required server variables

### authID

- `AUTHID_API_KEY_ID`
- `AUTHID_API_KEY_VALUE`
- `AUTHID_BASE_URL=https://id.authid.ai`
- `AUTHID_UI_BASE_URL=https://id.authid.ai/`

authID documents API-key-to-Bearer-token exchange and the Proof flow. Keep both API-key values exclusively in the server environment. citeturn2search2turn3search0

### Signaturit

- `SIGNATURIT_ACCESS_TOKEN`
- `SIGNATURIT_BASE_URL=https://api.sandbox.signaturit.com/v3` for development

Use the production base URL only after the Sandbox integration has been tested and the production token has been issued. Signaturit documents OAuth2 bearer authentication, signature creation, status retrieval, events and audit-trail downloads. citeturn0search0

## Production boundary

Never place provider credentials in browser JavaScript, HTML, localStorage, QR payloads or Git history.

The frontend should receive only short-lived transaction identifiers and normalized status. Identity images, biometric material, government identifiers and provider access tokens remain server-side or inside the contracted provider's secure flow.

## Deployment sequence

1. Import the repository into the serverless host.
2. Configure the variables above in the deployment environment.
3. Deploy the frontend and `/api` functions together.
4. Run authID Proof in its UAT environment first.
5. Run Signaturit Sandbox signature creation and event callbacks.
6. Configure the Signaturit event subscription to the deployed webhook endpoint.
7. Verify the complete identity → review → hash → signature → audit trail path.
8. Only then switch provider endpoints and credentials to production.

## Important

The current GitHub Pages/static URL cannot execute `/api` server functions. The repository therefore contains both the static application and a deployable serverless API architecture. The integration is not considered production-ready until provider credentials, backend deployment, webhook handling, storage and legal/privacy review are configured.
