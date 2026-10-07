# Identity + Electronic Signature Architecture

## Objective

Extend Contract Engine 100 with a provider-neutral trust layer for identity verification, document validation and electronic signature.

## Architecture

Frontend (static iPhone-first UI)
→ backend transaction API
→ identity provider adapter
→ normalized identity result
→ human-review gate when needed
→ contract integrity snapshot
→ signature provider adapter
→ webhook/event processor
→ signed document + audit trail metadata
→ public verification endpoint

## Identity verification

The frontend must never receive provider secrets.

Suggested normalized result:

```json
{
  "verificationId": "string",
  "status": "required|pending|verified|review|failed|expired",
  "document": {
    "type": "id|passport|residence|driver_license",
    "country": "ISO-3166-1",
    "documentId": "opaque-reference",
    "expiry": "YYYY-MM-DD"
  },
  "checks": {
    "documentAuthenticity": "pass|fail|review",
    "dataConsistency": "pass|fail|review",
    "liveness": "pass|fail|review|not-run"
  },
  "provider": "opaque-provider-id",
  "checkedAt": "ISO-8601"
}
```

The public QR must expose only the minimum verification metadata needed to validate the published integrity snapshot. Identity images, biometric data and government identifiers remain private.

## Signaturit integration

Signaturit's public developer documentation exposes an API for creating signature requests, checking status, validating Photo ID, receiving events and generating/downloading audit trails. Production access requires provider credentials and a server-side integration.

The adapter should support:

- `createSignatureRequest()`
- `getSignatureRequest()`
- `downloadSignedDocument()`
- `downloadAuditTrail()`
- `handleWebhookEvent()`

Recommended event mapping:

- `document_opened` → SIGNATURE_OPENED
- `document_signed` → SIGNED
- `document_completed` → SIGNED_COMPLETED
- `document_declined` → DECLINED
- `document_expired` → EXPIRED
- `audit_trail_completed` → AUDIT_READY
- `photo_id_added` → IDENTITY_DOCUMENT_ATTACHED

## Security boundaries

1. Provider tokens and webhook secrets stay server-side.
2. Never claim identity verification or signature completion from client-only state.
3. Recompute canonical hashes server-side before accepting completion.
4. Store only the minimum personal data necessary.
5. Keep private worker-protection answers outside the public QR payload.
6. Require explicit human review for elevated protection signals.
7. Record immutable event timestamps and provider transaction IDs.
8. Use idempotency for signature creation and webhook processing.
9. Validate webhook authenticity before changing transaction state.
10. Separate provider status from legal conclusions.

## UX states

- IDENTITY_REQUIRED
- IDENTITY_PENDING
- IDENTITY_REVIEW
- IDENTITY_VERIFIED
- SIGNATURE_READY
- SIGNATURE_SENT
- SIGNATURE_OPENED
- SIGNED
- SIGNED_COMPLETED
- DECLINED
- EXPIRED
- AUDIT_READY

## Current implementation boundary

Contract Engine 100 remains a static frontend. This branch defines the integration contract and UI/state model but must not embed live credentials or pretend to perform regulated identity or electronic-signature operations without a backend and contracted provider account.

## Provider-neutral design

The application should use interfaces such as:

```js
export const identityProvider = {
  createSession,
  getResult
};

export const signatureProvider = {
  createRequest,
  getRequest,
  getSignedDocument,
  getAuditTrail
};
```

A Signaturit adapter can implement `signatureProvider`, while another qualified identity provider can implement `identityProvider` without changing the form schema or public verification model.
